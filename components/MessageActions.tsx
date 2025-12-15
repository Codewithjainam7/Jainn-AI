import React, { useState } from 'react';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface MessageActionsProps {
  messageContent: string;
  messageId: string;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  messageContent,
  messageId,
  onRegenerate,
  isRegenerating = false
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    // Here you can send feedback to your backend
    console.log(`Feedback for message ${messageId}:`, type);
    
    // Optional: Show confirmation
    setTimeout(() => {
      alert(`Thank you for your feedback! This helps us improve.`);
    }, 300);
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
        title="Copy response"
      >
        {copied ? (
          <Check size={14} className="text-green-500" />
        ) : (
          <Copy size={14} />
        )}
      </button>

      <button
        onClick={onRegenerate}
        disabled={isRegenerating}
        className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all ${
          isRegenerating ? 'animate-spin' : ''
        }`}
        title="Regenerate response"
      >
        <RefreshCw size={14} />
      </button>

      <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

      <button
        onClick={() => handleFeedback('up')}
        className={`p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all ${
          feedback === 'up'
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
            : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
        }`}
        title="Good response"
      >
        <ThumbsUp size={14} />
      </button>

      <button
        onClick={() => handleFeedback('down')}
        className={`p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${
          feedback === 'down'
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
        }`}
        title="Poor response"
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
};
