import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#1D4ED8', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path 
        d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 9.25164 20.6696 6.73357 18.8891 4.88909" 
        stroke="url(#logoGrad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
      />
    </svg>
  );
};