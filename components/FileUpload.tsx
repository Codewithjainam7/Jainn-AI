import React, { useState, useRef } from 'react';
import { Paperclip, X, FileText, File, Loader } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  base64?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelected, 
  maxFiles = 5,
  disabled = false 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      );
    }
    if (type.includes('pdf') || type.includes('document')) return <FileText size={16} />;
    return <File size={16} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setProcessing(true);

    try {
      const processedFiles: UploadedFile[] = await Promise.all(
        files.map(async (file) => {
          const url = URL.createObjectURL(file);

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          return {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url,
            base64
          };
        })
      );

      const updatedFiles = [...selectedFiles, ...processedFiles];
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Failed to process files. Please try again.');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const file = selectedFiles.find(f => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
    const updatedFiles = selectedFiles.filter(f => f.id !== id);
    setSelectedFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const clearAll = () => {
    selectedFiles.forEach(file => URL.revokeObjectURL(file.url));
    setSelectedFiles([]);
    onFilesSelected([]);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        disabled={disabled || processing}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || processing || selectedFiles.length >= maxFiles}
        className={`p-2 rounded-full transition-colors ${
          disabled || processing || selectedFiles.length >= maxFiles
            ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
            : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
        title={selectedFiles.length >= maxFiles ? `Maximum ${maxFiles} files` : 'Upload files'}
      >
        {processing ? (
          <Loader className="animate-spin" size={20} />
        ) : (
          <Paperclip size={20} />
        )}
      </button>

      {selectedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-80 max-w-[90vw] bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#0D1117] rounded-lg group"
              >
                <div className="flex-shrink-0 text-blue-500">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
