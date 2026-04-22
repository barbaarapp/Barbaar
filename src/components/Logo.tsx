import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export const Logo = React.memo(({ className = "", size = 32 }: LogoProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Official Barbaar Heart-Leaf B Logo */}
          <path 
            d="M230 420C140 420 80 340 80 250C80 160 140 80 230 80C300 80 360 130 380 200C383 210 380 220 370 220H300C290 220 285 210 280 200C260 140 200 140 200 140C200 140 160 180 160 250C160 320 200 360 230 360C260 360 320 340 340 280C343 270 350 265 360 265H430C440 265 445 275 442 284C420 370 330 420 230 420Z" 
            fill="#649B61" 
          />
          <path 
            d="M230 140C230 140 280 140 310 180C315 185 315 195 310 200L250 260C240 270 220 260 220 240L220 150C220 145 225 140 230 140Z" 
            fill="#649B61" 
          />
          <circle cx="430" cy="90" r="22" stroke="#649B61" strokeWidth="4" />
          <text x="430" y="96" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="20" fill="#649B61">R</text>
        </svg>
      </div>
      <span 
        className="font-black tracking-[-0.05em] text-text uppercase leading-none"
        style={{ fontSize: size * 0.7 }}
      >
        Barbaar
      </span>
    </div>
  );
});
