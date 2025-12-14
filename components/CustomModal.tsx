import React from 'react';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export const CustomModal: React.FC<CustomModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}) => {
  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { 
          Icon: CheckCircle, 
          iconColor: 'text-green-500', 
          bgColor: 'bg-green-100 dark:bg-green-900/30' 
        };
      case 'error':
        return { 
          Icon: AlertCircle, 
          iconColor: 'text-red-500', 
          bgColor: 'bg-red-100 dark:bg-red-900/30' 
        };
      case 'warning':
        return { 
          Icon: AlertCircle, 
          iconColor: 'text-yellow-500', 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' 
        };
      default:
        return { 
          Icon: Mail, 
          iconColor: 'text-blue-500', 
          bgColor: 'bg-blue-100 dark:bg-blue-900/30' 
        };
    }
  };

  const { Icon, iconColor, bgColor } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95">
        <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mb-4 mx-auto`}>
          <Icon size={24} className={iconColor} />
        </div>
        <h3 className="text-xl font-bold mb-2 dark:text-white text-center">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center leading-relaxed">{message}</p>
        <button 
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
