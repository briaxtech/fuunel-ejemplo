import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-[#031247] mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full rounded-xl border border-[#d5dfec] bg-white/90 px-4 py-3 text-base text-[#031247] shadow-sm transition-all focus:border-[#36ccca] focus:ring-2 focus:ring-[#36ccca]/40 focus:outline-none placeholder:text-[#6b7a99] ${
          error ? 'border-red-500 bg-red-50 text-red-800' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-2 ml-1 animate-pulse">{error}</p>}
    </div>
  );
};
