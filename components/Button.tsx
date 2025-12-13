import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-semibold rounded-[12px] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5",
    // Fixed: Dark text in light mode, White text in dark mode
    secondary: "bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20",
    ghost: "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10",
    glass: "bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};