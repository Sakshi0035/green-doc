import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="animate-slide-up flex flex-col items-center">
        <div className="animate-bounce mb-8">
            <Logo size="lg" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tighter mb-3">
          GreenDoc
        </h1>
        <p className="text-emerald-600 font-semibold tracking-wide text-sm uppercase">
          Intelligent Document Assistant
        </p>
        
        <div className="mt-12 flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse delay-75"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};