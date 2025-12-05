import React, { useRef, useState } from 'react';
import { File, Trash2, CheckCircle, Loader2, ExternalLink, FileText } from 'lucide-react';
import { UploadedFile } from '../types';

interface SidebarProps {
  files: UploadedFile[];
  activeFileId: string | null;
  onUpload: (files: FileList) => void;
  onDeleteFile: (id: string) => void;
  onSelectFile: (id: string) => void;
  isConfigured: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  activeFileId,
  onUpload, 
  onDeleteFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative border-l border-gray-200">
      
      {/* File List / Status Bar */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
         {activeFile ? (
             <div className="flex items-center gap-3 text-sm text-emerald-800 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-100 w-full justify-between shadow-sm">
                 <div className="flex items-center gap-3 truncate">
                    {activeFile.status === 'ready' ? <CheckCircle size={18} className="text-emerald-500 fill-emerald-100"/> : <Loader2 size={18} className="animate-spin text-emerald-600"/>}
                    <span className="font-semibold truncate text-emerald-900">{activeFile.name}</span>
                 </div>
                 <div className="flex items-center gap-3">
                     {activeFile.status === 'ready' ? 
                        <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded shadow-sm">Ready</span> : 
                        <span className="text-xs font-bold text-emerald-600">{activeFile.status === 'uploading' ? 'Saving...' : `${activeFile.progress}%`}</span>
                     }
                     <button onClick={() => onDeleteFile(activeFile.id)} className="text-emerald-400 hover:text-red-500 hover:bg-white p-1 rounded transition-colors"><Trash2 size={16}/></button>
                 </div>
             </div>
         ) : (
            <div className="flex items-center gap-2 text-slate-400">
                <FileText size={16} />
                <span className="text-sm font-medium">No document active</span>
            </div>
         )}
      </div>

      {/* Main Content: Viewer or Upload */}
      <div className="flex-1 relative bg-slate-100 overflow-hidden flex flex-col items-center justify-center p-6">
        
        {activeFile && activeFile.fileUrl ? (
            <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
                 <object
                    data={activeFile.fileUrl}
                    type="application/pdf"
                    className="w-full h-full block"
                >
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                        <File size={64} className="text-slate-300" />
                        <p className="font-medium">Preview requires a dedicated PDF viewer.</p>
                        <a 
                            href={activeFile.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-2"
                        >
                            Open PDF in new tab <ExternalLink size={16} />
                        </a>
                    </div>
                </object>
            </div>
        ) : (
            <div 
                className={`
                    w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group
                    ${isDragging ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-300 hover:border-emerald-300 hover:bg-emerald-50/30'}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
                }}
            >
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                    <File size={40} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-slate-700 font-bold text-lg mb-2">Drag & Drop PDF here</p>
                <p className="text-sm text-slate-500 mb-6">or click to browse files</p>
                <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow hover:bg-slate-800 transition-all">
                    Select File
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.length && onUpload(e.target.files)}
                    accept=".pdf"
                    className="hidden"
                />
            </div>
        )}
      </div>
    </div>
  );
};