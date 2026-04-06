import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  onClick?: () => void;
}

const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '', onClick }) => {
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <span className="relative z-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 text-red-400 opacity-70 animate-pulse"
        style={{ 
          animation: 'glitch-1 0.5s infinite linear alternate-reverse',
          clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)'
        }}
      >
        {text}
      </span>
      <span 
        className="absolute top-0 left-0 text-blue-400 opacity-70 animate-pulse"
        style={{ 
          animation: 'glitch-2 0.5s infinite linear alternate-reverse',
          clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)'
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default GlitchText;