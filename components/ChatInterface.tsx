import React, { useRef, useEffect, useState } from 'react';
import { User, StopCircle, Send, Leaf } from 'lucide-react';
import { Message } from '../types';
import { Logo } from './Logo';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  isConfigured: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  isLoading, 
  onSendMessage
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white border-r border-gray-100 shadow-sm relative z-10">
      
      {/* Header */}
      <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0">
         <div className="flex items-center gap-3">
            <Logo size="sm" />
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">
                GreenDoc
            </h1>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Online</span>
         </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white pb-6">
        {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                    <Leaf size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to GreenDoc</h3>
                <p className="text-slate-500 max-w-xs mb-8">
                    Upload your PDF to the right panel and I'll analyze it instantly.
                </p>
                <div className="grid grid-cols-1 w-full gap-3 max-w-xs">
                     {['Summarize document', 'Key takeaways', 'Explain the main concept'].map((text, i) => (
                         <button 
                            key={i}
                            onClick={() => onSendMessage(text)}
                            className="text-sm py-3 px-4 bg-white border border-gray-200 rounded-xl text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all text-left shadow-sm hover:shadow-md"
                         >
                             {text}
                         </button>
                     ))}
                </div>
            </div>
        ) : (
            <div className="space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                            ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-gray-200 text-emerald-600'}
                        `}>
                            {msg.role === 'user' ? <User size={14} /> : <Leaf size={14} />}
                        </div>
                        
                        {/* Bubble */}
                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`
                                py-3.5 px-5 rounded-2xl text-[15px] leading-relaxed shadow-sm
                                ${msg.role === 'user' 
                                    ? 'bg-slate-900 text-white rounded-tr-sm' 
                                    : 'bg-white border border-gray-100 text-slate-700 rounded-tl-sm shadow-md'}
                            `}>
                                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-4 animate-fade-in">
                         <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-emerald-600 shadow-sm">
                            <Leaf size={14} />
                        </div>
                        <div className="bg-white border border-gray-100 py-4 px-5 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white">
        <form 
            onSubmit={handleSubmit}
            className="flex items-center gap-2 p-2 rounded-2xl border border-gray-200 bg-white shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 transition-all"
        >
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask GreenDoc..."
                className="flex-1 py-3 px-4 bg-transparent border-none focus:ring-0 text-base text-slate-800 placeholder:text-slate-400"
                disabled={isLoading}
            />
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`
                    p-3 rounded-xl flex items-center justify-center transition-all
                    ${isLoading || !input.trim()
                        ? 'text-gray-300 bg-gray-50' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg active:scale-95'}
                `}
            >
                {isLoading ? <StopCircle size={20} /> : <Send size={20} />}
            </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-3">
            AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};