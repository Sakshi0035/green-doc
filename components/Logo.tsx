import React from 'react';
import { Leaf, BookOpen } from 'lucide-react';

export const Logo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 40
  };

  return (
    <div className={`relative flex items-center justify-center bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-lg shadow-emerald-100 ${sizeClasses[size]}`}>
      <BookOpen size={iconSizes[size]} className="text-white relative z-10" strokeWidth={2.5} />
      <Leaf 
        size={iconSizes[size] * 0.6} 
        className="absolute -bottom-1 -right-1 text-emerald-100 z-20 fill-emerald-100" 
      />
    </div>
  );
};