import React from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from './Input';
import { Label } from './label';
import { 
  InputFieldProps, 
  TextareaFieldProps, 
  SelectFieldProps,
  SelectOption 
} from '../../types/forms';

// Generic FormField component để sử dụng với React Hook Form
interface FormFieldProps<T extends FieldValues> extends Omit<InputFieldProps, 'value' | 'onChange'> {
  name: FieldPath<T>;
  control: Control<T>;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  className = '',
  disabled = false,
  required = false,
  error,
  description
}: FormFieldProps<T>) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <Input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                ${fieldState.error ? 'border-red-500 focus:border-red-500' : ''}
                ${className}
              `}
            />
            
            {/* Error message */}
            {(fieldState.error || error) && (
              <p className="text-sm text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
            
            {/* Description */}
            {description && !fieldState.error && !error && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}

// Textarea variant
interface FormTextareaProps<T extends FieldValues> extends Omit<TextareaFieldProps, 'value' | 'onChange'> {
  name: FieldPath<T>;
  control: Control<T>;
}

export function FormTextarea<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  rows = 3,
  maxLength,
  error,
  description
}: FormTextareaProps<T>) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <textarea
              {...field}
              id={name}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              maxLength={maxLength}
              className={`
                w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500
                ${fieldState.error ? 'border-red-500 focus:border-red-500' : ''}
                ${className}
              `}
            />
            
            {/* Character count */}
            {maxLength && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>{field.value?.length || 0}/{maxLength}</span>
              </div>
            )}
            
            {/* Error message */}
            {(fieldState.error || error) && (
              <p className="text-sm text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
            
            {/* Description */}
            {description && !fieldState.error && !error && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}

// Select component
interface FormSelectProps<T extends FieldValues> extends Omit<SelectFieldProps, 'value' | 'onChange'> {
  name: FieldPath<T>;
  control: Control<T>;
}

export function FormSelect<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = 'Chọn...',
  options,
  className = '',
  disabled = false,
  required = false,
  error,
  description
}: FormSelectProps<T>) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="space-y-1">
            <select
              {...field}
              id={name}
              disabled={disabled}
              className={`
                w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-500
                ${fieldState.error ? 'border-red-500 focus:border-red-500' : ''}
                ${className}
              `}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Error message */}
            {(fieldState.error || error) && (
              <p className="text-sm text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
            
            {/* Description */}
            {description && !fieldState.error && !error && (
              <p className="text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
} 