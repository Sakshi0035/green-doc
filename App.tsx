import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar'; 
import { ChatInterface } from './components/ChatInterface';
import { SplashScreen } from './components/SplashScreen';
import { extractTextFromPdf, chunkText } from './services/pdfService';
import { getEmbeddings, getQueryEmbedding, generateAnswer } from './services/geminiService';
import { initQdrant, ensureCollection, uploadPoints, searchSimilar } from './services/qdrantService';
import { Message, UploadedFile, QdrantConfig } from './types';
import { GenerateContentResponse } from "@google/genai";
import { ArrowLeft, MessageSquare, FileText } from 'lucide-react';

// ENVIRONMENT CONFIGURATION
// Supports: Standard process.env, Vite import.meta.env
const getEnv = (key: string, viteKey: string) => {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) return import.meta.env[viteKey];
    return '';
};

// RELIABLE CONFIGURATION (Strictly Env Vars)
const APP_CONFIG: QdrantConfig = {
    url: getEnv('QDRANT_URL', 'VITE_QDRANT_URL') || getEnv('REACT_APP_QDRANT_URL', 'VITE_QDRANT_URL'),
    apiKey: getEnv('QDRANT_API_KEY', 'VITE_QDRANT_API_KEY') || getEnv('REACT_APP_QDRANT_API_KEY', 'VITE_QDRANT_API_KEY'),
    collectionName: 'greendoc_collection'
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // Changed default to 'doc' so mobile users see Upload screen first
  const [mobileView, setMobileView] = useState<'chat' | 'doc'>('doc');

  useEffect(() => {
    if (!APP_CONFIG.url || !APP_CONFIG.apiKey) {
        console.warn("Missing API Configuration. Please check your .env file.");
        setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'model',
            content: "System Error: Missing API Keys. Please configure your .env file.",
            timestamp: Date.now()
        }]);
        return;
    }
    initQdrant(APP_CONFIG).catch(console.error);
  }, []);

  const updateFileProgress = (id: string, updates: Partial<UploadedFile>) => {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleUpload = async (fileList: FileList) => {
    const file = fileList[0];
    if (!file) return;

    // Switch to doc view on mobile when uploading (already there, but ensures focus)
    setMobileView('doc');

    const fileUrl = URL.createObjectURL(file);
    const newId = uuidv4();

    const newFile: UploadedFile = {
      id: newId,
      name: file.name,
      size: file.size,
      status: 'parsing',
      progress: 0,
      fileUrl
    };

    setFiles([newFile]); 
    setActiveFileId(newId);

    try {
      await ensureCollection(APP_CONFIG.collectionName);

      const text = await extractTextFromPdf(file, (c, t) => {
          updateFileProgress(newId, { progress: Math.round((c/t)*20) });
      });
      
      const chunks = chunkText(text);
      updateFileProgress(newId, { status: 'embedding', progress: 30 });
      
      const embeddings = await getEmbeddings(chunks, (p) => {
          updateFileProgress(newId, { progress: 30 + (p * 0.4) });
      });
      
      updateFileProgress(newId, { status: 'uploading', progress: 80 });
      
      const payloads = chunks.map(chunk => ({ text: chunk, source: file.name }));
      await uploadPoints(APP_CONFIG.collectionName, embeddings, payloads);

      updateFileProgress(newId, { status: 'ready', progress: 100 });
      
      setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'model',
          content: `I've analyzed **${file.name}**. What would you like to know?`,
          timestamp: Date.now()
      }]);
      
      // Go back to chat on success (mobile)
      setMobileView('chat');

    } catch (error: any) {
      console.error(error);
      updateFileProgress(newId, { status: 'error', progress: 0 });
      setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'model',
          content: `Error: ${error.message}`,
          timestamp: Date.now()
      }]);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = { id: uuidv4(), role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      console.log("Generating embedding...");
      const queryVector = await getQueryEmbedding(content);
      
      console.log("Searching vector DB...");
      const searchResults = await searchSimilar(APP_CONFIG.collectionName, queryVector);
      console.log("Search found:", searchResults.length, "results");
      
      const context = searchResults.map(res => res.payload?.text as string).filter(Boolean);
      
      if (context.length === 0) {
           throw new Error("No relevant text found in document.");
      }

      console.log("Generating answer with AI...");
      const stream = await generateAnswer(content, context, []);

      const botMsgId = uuidv4();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', content: '', timestamp: Date.now() }]);

      let fullResponse = "";
      for await (const chunk of stream) {
          const text = (chunk as GenerateContentResponse).text;
          if (text) {
              fullResponse += text;
              setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, content: fullResponse } : msg));
          }
      }
    } catch (error: any) {
      console.error("Chat Error:", error.message);
      setMessages(prev => [...prev, { 
          id: uuidv4(), 
          role: 'model', 
          content: `Error: ${error.message}. Please check your internet connection and try again.`, 
          timestamp: Date.now() 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSplash) {
      return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans relative">
        
        {/* Mobile Nav Switcher */}
        <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t border-gray-200 z-50 flex items-center justify-around pb-2">
            <button 
                onClick={() => setMobileView('chat')}
                className={`flex flex-col items-center gap-1 ${mobileView === 'chat' ? 'text-emerald-600' : 'text-gray-400'}`}
            >
                <MessageSquare size={20} />
                <span className="text-xs font-medium">Chat</span>
            </button>
            <button 
                onClick={() => setMobileView('doc')}
                className={`flex flex-col items-center gap-1 ${mobileView === 'doc' ? 'text-emerald-600' : 'text-gray-400'}`}
            >
                <FileText size={20} />
                <span className="text-xs font-medium">Document</span>
            </button>
        </div>

        {/* Chat Left */}
        <div className={`
            w-full md:w-[45%] h-full flex flex-col border-r border-gray-200 transition-transform duration-300 absolute md:relative z-10 bg-white
            ${mobileView === 'chat' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <ChatInterface 
                messages={messages} 
                isLoading={isProcessing} 
                onSendMessage={handleSendMessage}
                isConfigured={true}
            />
        </div>
        
        {/* Doc Right */}
        <div className={`
            w-full md:w-[55%] h-full bg-slate-50 transition-transform duration-300 absolute md:relative right-0 z-10
            ${mobileView === 'doc' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
            <Sidebar 
                files={files} 
                activeFileId={activeFileId}
                onUpload={handleUpload} 
                onDeleteFile={() => setFiles([])}
                onSelectFile={() => {}}
                isConfigured={true} 
            />
        </div>
    </div>
  );
};

export default App;