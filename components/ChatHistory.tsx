import React, { useState, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Check, X, Loader } from 'lucide-react';
import { ChatSession } from '../types';
import { getChatSessions, deleteChatSession, renameChatSession } from '../lib/chatHistory';

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSelectChat: (session: ChatSession) => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onSelectChat,
  onDeleteChat,
  onRenameChat
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    onRenameChat(sessionId, editTitle.trim());
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) return;

    setDeletingId(sessionId);
    await onDeleteChat(sessionId);
    setDeletingId(null);
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
        No chat history yet. Start a new conversation!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => !editingId && onSelectChat(session)}
          className={`group relative p-3 rounded-xl transition-all cursor-pointer ${currentSessionId === session.id
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
            } ${deletingId === session.id ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {editingId === session.id ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(session.id, e as any);
                  if (e.key === 'Escape') handleCancelEdit(e as any);
                }}
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-[#161B22] border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => handleSaveEdit(session.id, e)}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-600 dark:text-green-400"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs opacity-70">
                    {new Date(session.lastUpdated).toLocaleDateString()} • {session.messages.length} msgs
                  </p>
                </div>
              </div>

              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleStartEdit(session, e)}
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                  title="Rename"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
                  title="Delete"
                  disabled={deletingId === session.id}
                >
                  {deletingId === session.id ? (
                    <Loader className="animate-spin" size={14} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
