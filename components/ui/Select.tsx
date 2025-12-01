import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className, ...props }) => {
  return (
    <div className="w-full group">
      {label && (
        <label className="block text-sm font-semibold text-[#031247] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full rounded-xl border border-[#d5dfec] bg-white/90 px-4 py-3 pr-10 text-base text-[#031247] shadow-sm transition-all focus:border-[#36ccca] focus:ring-2 focus:ring-[#36ccca]/40 focus:outline-none cursor-pointer appearance-none placeholder:text-[#6b7a99] ${className}`}
          {...props}
        >
          <option value="" disabled className="text-[#6b7a99]">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-sm mt-2 ml-1 animate-pulse">{error}</p>}
    </div>
  );
};
