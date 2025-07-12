import { z } from 'zod';
import { UseFormReturn, FieldValues, DefaultValues, SubmitHandler } from 'react-hook-form';

// Base form configuration interface
export interface FormConfig<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

// Enhanced form validation hook return type
export interface UseFormValidationReturn<T extends FieldValues> extends UseFormReturn<T> {
  handleSubmit: (onValid: SubmitHandler<T>, onInvalid?: (errors: any) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  touchedFields: Partial<Record<keyof T, boolean>>;
  submitCount: number;
}

// Form field common props
export interface BaseFormFieldProps {
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  description?: string;
  'data-testid'?: string;
}

// Input field specific props
export interface InputFieldProps extends BaseFormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time' | 'datetime-local' | 'url';
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

// Textarea field props
export interface TextareaFieldProps extends BaseFormFieldProps {
  rows?: number;
  maxLength?: number;
  minLength?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

// Select field props
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectFieldProps extends BaseFormFieldProps {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
}

// Checkbox/Radio field props
export interface CheckboxFieldProps extends BaseFormFieldProps {
  value?: string | number;
}

export interface RadioGroupFieldProps extends BaseFormFieldProps {
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  direction?: 'horizontal' | 'vertical';
}

// Date/Time field props
export interface DateFieldProps extends BaseFormFieldProps {
  minDate?: string | Date;
  maxDate?: string | Date;
  format?: string;
  showTime?: boolean;
}

// File upload field props
export interface FileFieldProps extends BaseFormFieldProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
}

// Form submission result
export interface FormSubmissionResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: Record<string, string[]>;
}

// API response for form submissions
export interface ApiFormResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  details?: string;
  timestamp?: string;
}

// Form state management
export interface FormState {
  isLoading: boolean;
  isSubmitting: boolean;
  hasErrors: boolean;
  isDirty: boolean;
  isValid: boolean;
  submitCount: number;
  lastSubmissionTime?: Date;
}

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Form context type
export interface FormContextType<T extends FieldValues> {
  formState: FormState;
  setValue: (name: keyof T, value: any, options?: any) => void;
  getValue: (name: keyof T) => any;
  clearErrors: (name?: keyof T | (keyof T)[]) => void;
  setError: (name: keyof T, error: { message: string; type?: string }) => void;
  trigger: (name?: keyof T | (keyof T)[]) => Promise<boolean>;
  reset: (values?: DefaultValues<T>) => void;
}

// Common form field validation rules
export interface ValidationRules {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  validate?: (value: any) => boolean | string;
}

// Form step configuration (for multi-step forms)
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  optional?: boolean;
  validation?: z.ZodSchema<any>;
}

// Multi-step form configuration
export interface MultiStepFormConfig<T extends FieldValues> extends FormConfig<T> {
  steps: FormStep[];
  currentStep: number;
  allowStepNavigation?: boolean;
  validateOnStepChange?: boolean;
}

// Form analytics/tracking
export interface FormAnalytics {
  formId: string;
  startTime: Date;
  submitTime?: Date;
  abandonTime?: Date;
  fieldInteractions: Record<string, {
    focused: number;
    changed: number;
    errorCount: number;
    timeSpent: number;
  }>;
  errors: ValidationError[];
  submissionAttempts: number;
  completionRate: number;
}

// Export for convenience
export type {
  FieldValues,
  SubmitHandler,
  DefaultValues,
  UseFormReturn
} from 'react-hook-form'; 