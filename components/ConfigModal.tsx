import React, { useState, useEffect } from 'react';
import { X, Database, Key, Server, Check } from 'lucide-react';
import { QdrantConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: QdrantConfig) => void;
  initialConfig: QdrantConfig;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [url, setUrl] = useState(initialConfig.url);
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [collectionName, setCollectionName] = useState(initialConfig.collectionName);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialConfig.url);
      setApiKey(initialConfig.apiKey);
      setCollectionName(initialConfig.collectionName);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ url, apiKey, collectionName });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border/50 transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-border/50 bg-black/20">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Connect Qdrant
            </h2>
            <p className="text-sm text-primary-300/50 mt-1">Configure vector database connection</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-primary-300/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-primary-900/20 text-primary-100 p-4 rounded-xl text-sm border border-primary-500/10 flex gap-3">
              <Server size={18} className="shrink-0 mt-0.5 text-accent" />
              <div>
                  <p className="font-semibold mb-1 text-accent">Configuration Tip</p>
                  Ensure your URL includes the protocol (https://) and port :6333 if using Qdrant Cloud via browser.
              </div>
            </div>

          <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-primary-300/50 uppercase tracking-wider mb-2">
                Cluster URL
                </label>
                <div className="relative group">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50 group-focus-within:text-accent transition-colors" size={16} />
                    <input
                    type="text"
                    required
                    placeholder="https://xyz-example.qdrant.tech:6333"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all text-sm text-white placeholder:text-primary-800"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-primary-300/50 uppercase tracking-wider mb-2">
                API Key
                </label>
                <div className="relative group">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50 group-focus-within:text-accent transition-colors" size={16} />
                    <input
                    type="password"
                    placeholder="your-api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all text-sm text-white placeholder:text-primary-800"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-primary-300/50 uppercase tracking-wider mb-2">
                Collection Name
                </label>
                <div className="relative group">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50 group-focus-within:text-accent transition-colors" size={16} />
                    <input
                    type="text"
                    required
                    placeholder="my_documents"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all text-sm text-white placeholder:text-primary-800"
                    />
                </div>
            </div>
          </div>

          <div className="pt-2">
            <button
                type="submit"
                className="w-full bg-accent text-emerald-950 py-3 px-4 rounded-xl hover:bg-accent-hover transition-all font-semibold shadow-lg shadow-accent/10 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <Check size={18} />
                Save Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};