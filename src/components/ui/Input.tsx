import React from 'react';

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  type = 'text',
  label,
  placeholder,
  disabled = false,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="mb-1 text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          rounded-md border border-gray-700 bg-gray-800 px-3 py-2
          text-gray-100 placeholder-gray-500
          transition-colors duration-150
          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900
          disabled:cursor-not-allowed disabled:opacity-60
        `.trim()}
      />
    </div>
  );
};

export default Input;
