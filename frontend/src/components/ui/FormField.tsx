import React from 'react';
import { Controller, FieldValues, Path, Control } from 'react-hook-form';
import { Label } from './label';
import { Input } from './Input';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  maxLength?: number;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  error,
  description,
  leftIcon,
  rightIcon,
  maxLength
}: FormFieldProps<T>) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          const hasError = fieldState.error || error;
          
          return (
          <div className="space-y-1">
              <div className="relative">
                {leftIcon && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {leftIcon}
                  </div>
                )}
                
            <Input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
                  maxLength={maxLength}
              className={`
                    ${leftIcon ? 'pl-10' : ''}
                    ${rightIcon ? 'pr-10' : ''}
                    ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                ${className}
              `}
            />
            
                {rightIcon && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                    {rightIcon}
                  </div>
                )}
              </div>
              
              {/* Error message - luôn có space để tránh layout shift */}
              <div className="min-h-[20px]">
                {hasError && (
              <p className="text-sm text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
              </div>
            
              {/* Description - chỉ hiển thị khi không có lỗi */}
              {description && !hasError && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
              
              {/* Character count */}
              {maxLength && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{field.value?.length || 0}/{maxLength}</span>
          </div>
        )}
            </div>
          );
        }}
      />
    </div>
  );
}

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  rows = 3,
  maxLength,
  error,
  description
}: Omit<FormFieldProps<T>, 'type' | 'leftIcon' | 'rightIcon'> & {
  rows?: number;
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          const hasError = fieldState.error || error;
          
          return (
          <div className="space-y-1">
            <textarea
              {...field}
              id={name}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              maxLength={maxLength}
              className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:bg-gray-50 disabled:text-gray-500
                  ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                ${className}
              `}
            />
            
              {/* Error message - luôn có space để tránh layout shift */}
              <div className="min-h-[20px]">
                {hasError && (
              <p className="text-sm text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
              </div>
            
              {/* Description - chỉ hiển thị khi không có lỗi */}
              {description && !hasError && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
              
              {/* Character count */}
              {maxLength && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{field.value?.length || 0}/{maxLength}</span>
          </div>
        )}
            </div>
          );
        }}
      />
    </div>
  );
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  options,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  error,
  description
}: Omit<FormFieldProps<T>, 'type' | 'leftIcon' | 'rightIcon' | 'maxLength'> & {
  options: { value: string; label: string }[];
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => {
          const hasError = fieldState.error || error;
          
          return (
          <div className="space-y-1">
            <select
              {...field}
              id={name}
              disabled={disabled}
              className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:bg-gray-50 disabled:text-gray-500
                  ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                ${className}
              `}
            >
                {placeholder && (
                  <option value="" disabled>
                    {placeholder}
                  </option>
                )}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
              {/* Error message - luôn có space để tránh layout shift */}
              <div className="min-h-[20px]">
                {hasError && (
              <p className="text-sm text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
              </div>
            
              {/* Description - chỉ hiển thị khi không có lỗi */}
              {description && !hasError && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          );
        }}
      />
    </div>
  );
} 