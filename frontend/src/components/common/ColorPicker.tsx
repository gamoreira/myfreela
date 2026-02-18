import { useState } from 'react';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (color: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F43F5E', // Rose
];

export default function ColorPicker({
  label,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {/* Selected Color Display */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer transition-transform hover:scale-105 shadow-sm"
            style={{ backgroundColor: value }}
            onClick={() => !disabled && setShowPicker(!showPicker)}
          />
          <div className="flex-1">
            <input
              type="text"
              value={value.toUpperCase()}
              onChange={(e) => {
                const color = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(color)) {
                  onChange(color);
                }
              }}
              className={`
                block w-full px-3 py-2.5
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                border ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'}
                rounded-lg shadow-sm
                focus:outline-none focus:ring-2
                transition-all duration-200
                disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                font-mono
              `}
              placeholder="#000000"
              disabled={disabled}
              maxLength={7}
            />
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600 shadow-sm"
          />
        </div>

        {/* Preset Colors */}
        {showPicker && !disabled && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Cores Sugeridas:</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    onChange(color);
                    setShowPicker(false);
                  }}
                  className={`
                    w-10 h-10 rounded-lg border-2 transition-all shadow-sm
                    ${value === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-200 dark:border-gray-600 hover:scale-105'}
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center animate-fadeIn">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
