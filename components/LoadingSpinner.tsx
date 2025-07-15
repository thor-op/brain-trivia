import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-cyan"></div>
      <p className="text-lg text-slate-300 tracking-wide">Conjuring knowledge from the cosmos...</p>
    </div>
  );
};

export default LoadingSpinner;