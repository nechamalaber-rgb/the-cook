import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => (
  <svg 
    viewBox="0 0 128 128" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="GatherHome Logo"
  >
    {/* Outer Harmony Circle */}
    <circle 
      cx="64" 
      cy="64" 
      r="58" 
      stroke="currentColor" 
      strokeWidth="8" 
      strokeLinecap="round"
      opacity="0.1"
    />
    
    {/* The Culinary Cloche Base */}
    <path 
      d="M28 84C28 64.1177 44.1177 48 64 48C83.8823 48 100 64.1177 100 84V88H28V84Z" 
      fill="currentColor" 
    />
    
    {/* The Minimalist Roof Line */}
    <path 
      d="M64 22L44 42H84L64 22Z" 
      fill="currentColor" 
    />
    
    {/* Connection Point */}
    <rect 
      x="61" 
      y="38" 
      width="6" 
      height="12" 
      fill="currentColor" 
    />

    {/* Central Focus Spark */}
    <circle 
      cx="64" 
      cy="68" 
      r="5" 
      fill="white" 
      className="animate-pulse"
    />
    
    {/* Motion Accent */}
    <path 
      d="M106 42C112 48 116 58 116 68" 
      stroke="currentColor" 
      strokeWidth="6" 
      strokeLinecap="round" 
      opacity="0.3"
    />
  </svg>
);