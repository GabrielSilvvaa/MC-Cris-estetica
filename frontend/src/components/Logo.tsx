import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  watermark?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  watermark = false,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const titleSizes = {
    sm: 'text-sm tracking-widest',
    md: 'text-lg tracking-[0.2em]',
    lg: 'text-2xl tracking-[0.25em]',
    xl: 'text-3xl tracking-[0.28em]'
  };

  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  if (watermark) {
    return (
      <div className={`pointer-events-none opacity-[0.04] select-none flex flex-col items-center justify-center ${className}`}>
        <svg className="w-96 h-96" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#4A3F35" strokeWidth="1.5" />
          <path
            d="M50 18C41 18 36 26 36 34C36 43 44 48 47 54C50 60 46 72 40 80C45 81 52 78 57 71C62 64 64 53 62 44C60 35 62 29 58 24C56 20 53 18 50 18Z"
            stroke="#4A3F35"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M41 38C44 31 49 29 54 29" stroke="#4A3F35" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Símbolo / Silhueta Line-art */}
      <div
        className={`relative flex items-center justify-center rounded-full bg-[#FAF6F0] border border-[#C4A883]/40 shadow-xs shrink-0 ${iconSizes[size]}`}
      >
        <svg className="w-3/4 h-3/4" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" fill="#FAF6F0" stroke="#C4A883" strokeWidth="2.5" />
          <path
            d="M50 18C41 18 36 26 36 34C36 43 44 48 47 54C50 60 46 72 40 80C45 81 52 78 57 71C62 64 64 53 62 44C60 35 62 29 58 24C56 20 53 18 50 18Z"
            stroke="#C4A883"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M41 38C44 31 49 29 54 29" stroke="#C4A883" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M39 52C43 53 47 53 51 52" stroke="#C4A883" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Tipografia da Marca */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-serif uppercase font-semibold text-[#3D332A] ${titleSizes[size]}`}
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
          >
            Márcia Cristina
          </span>
          <span
            className={`font-script text-[#A68A64] -mt-1 font-normal ${subtitleSizes[size]}`}
            style={{ fontFamily: "'Great Vibes', cursive" }}
          >
            estética & bem estar
          </span>
        </div>
      )}
    </div>
  );
};
