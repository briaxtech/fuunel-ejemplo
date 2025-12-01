import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <div className="flex items-center mb-4">
      <input
        type="checkbox"
        className="w-5 h-5 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
        {...props}
      />
      <label className="ml-2 text-sm font-medium text-gray-900 cursor-pointer" onClick={(e) => {
          // Allow clicking label to toggle checkbox (accessibility)
          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
          // React handles the click event on the input if we don't interfere, 
          // but for custom label handling typically the input is wrapped or linked by ID.
          // Since structure is adjacent, this is just visual unless we use htmlFor.
      }}>
        {label}
      </label>
    </div>
  );
};