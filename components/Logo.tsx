import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Base Container / Bowl Shape */}
    <path 
        d="M32 76C32 93.6731 46.3269 108 64 108C81.6731 108 96 93.6731 96 76V68H32V76Z" 
        fill="currentColor" 
    />
    
    {/* Chef Hat Folds (Stylized) */}
    <path 
        d="M34 68C28 50 38 36 50 42C52 24 76 24 78 42C90 36 100 50 94 68" 
        stroke="currentColor" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
    />
    
    {/* Sync/Motion Accent */}
    <path 
        d="M106 52C112 58 114 68 112 78" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        opacity="0.4"
    />
     <path 
        d="M22 76C20 66 22 56 28 50" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        opacity="0.4"
    />
  </svg>
);
