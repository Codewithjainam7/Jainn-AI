import React, { useState, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Check, X, Loader } from 'lucide-react';
import { ChatSession } from './types';
import { getChatSessions, deleteChatSession, renameChatSession } from './lib/chatHistory';

interface ChatHistoryProps {
  userId: string;
  onSelectChat: (session: ChatSession) => void;
  currentSessionId?: string;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ userId, onSelectChat, currentSessionId }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getChatSessions(userId);
      setSessions(data);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = async (sessionId: string) => {
    if (!editTitle.trim()) return;
    
    try {
      await renameChatSession(sessionId, userId, editTitle.trim());
      await loadSessions();
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      console.error('Failed to rename chat:', error);
      alert('Failed to rename chat. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(sessionId);
      await deleteChatSession(sessionId, userId);
      await loadSessions();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin text-blue-500" size={24} />
      </div>
    );
  }

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
          className={`group relative p-3 rounded-xl transition-all ${
            currentSessionId === session.id
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
          } ${deletingId === session.id ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {editingId === session.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(session.id);
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-[#161B22] border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => handleSaveEdit(session.id)}
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
              <div
                onClick={() => onSelectChat(session)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs opacity-70">
                    {new Date(session.lastUpdated).toLocaleDateString()} • {session.messages.length} messages
                  </p>
                </div>
              </div>
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(session);
                  }}
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
                  title="Rename"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(session.id);
                  }}
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
