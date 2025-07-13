import { useForm, UseFormReturn, FieldValues, DefaultValues, SubmitHandler, SubmitErrorHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { 
  UseFormValidationReturn, 
  FormConfig, 
  FormSubmissionResult,
  ValidationError 
} from '../types/forms';

// Generic interface cho form validation hook
export interface UseFormValidationProps<T extends FieldValues> extends FormConfig<T> {
  onSubmit: SubmitHandler<T>;
  onError?: SubmitErrorHandler<T>;
  enableDevtools?: boolean;
  resetOnSubmitSuccess?: boolean;
}

// Enhanced hook với TypeScript đầy đủ
export function useFormValidation<T extends FieldValues>({
  schema,
  defaultValues,
  mode = 'onChange',
  onSubmit,
  onError,
  enableDevtools = false,
  resetOnSubmitSuccess = false
}: UseFormValidationProps<T>): UseFormValidationReturn<T> {
  const form = useForm<T>({
    resolver: zodResolver(schema as any), // Type assertion to resolve zodResolver type issues
    defaultValues,
    mode,
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
    criteriaMode: 'all'
  });

  // Enhanced submit handler với proper error handling
  const handleSubmit = (
    onValid?: SubmitHandler<T>,
    onInvalid?: SubmitErrorHandler<T>
  ) => {
    return form.handleSubmit(
      async (data: T, event?: React.BaseSyntheticEvent) => {
        try {
          // Call the provided onValid or fallback to onSubmit
          const submitHandler = onValid || onSubmit;
          const result = await submitHandler(data, event);
          
          // Reset form if configured to do so
          if (resetOnSubmitSuccess) {
            form.reset();
          }
          
          return result;
        } catch (error: any) {
          console.error('Form submission error:', error);
          
          // Show user-friendly error message
          const errorMessage = error?.response?.data?.message || 
                              error?.message || 
                              'Có lỗi xảy ra khi gửi form';
          toast.error(errorMessage);
          
          // Re-throw for additional handling if needed
          throw error;
        }
      },
      (errors, event) => {
        console.error('Form validation errors:', errors);
        
        // Convert form errors to validation errors with proper typing
        const validationErrors: ValidationError[] = Object.entries(errors).map(
          ([field, error]: [string, any]) => ({
            field,
            message: (error?.message as string) || 'Trường này không hợp lệ',
            code: error?.type as string
          })
        );
        
        // Call custom error handler if provided
        if (onInvalid) {
          onInvalid(errors, event);
        } else if (onError) {
          onError(errors, event);
        } else {
          // Default error handling
          toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
        }
        
        return validationErrors;
      }
    );
  };

  // Return enhanced form object
  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    touchedFields: form.formState.touchedFields as Partial<Record<keyof T, boolean>>,
    submitCount: form.formState.submitCount
  };
}

// Type-safe wrapper for async form submissions
export async function handleFormSubmission<T extends FieldValues>(
  submitFn: (data: T) => Promise<FormSubmissionResult>,
  data: T,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  }
): Promise<FormSubmissionResult> {
  const {
    successMessage = 'Thao tác thành công!',
    errorMessage = 'Có lỗi xảy ra, vui lòng thử lại',
    showSuccessToast = true,
    showErrorToast = true
  } = options || {};

  try {
    const result = await submitFn(data);
    
    if (result.success) {
      if (showSuccessToast) {
        toast.success(result.message || successMessage);
      }
    } else {
      if (showErrorToast) {
        toast.error(result.message || errorMessage);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Form submission error:', error);
    
    const result: FormSubmissionResult = {
      success: false,
      message: error?.response?.data?.message || error?.message || errorMessage,
      errors: error?.response?.data?.errors
    };
    
    if (showErrorToast) {
      toast.error(result.message || errorMessage);
    }
    
    return result;
  }
}

// Common validation schemas cho project
export const validationSchemas = {
  // Authentication schemas
  loginSchema: z.object({
    email: z
      .string()
      .min(1, 'Email là bắt buộc')
      .email('Email không hợp lệ'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  }),

  registerSchema: z.object({
    fullName: z
      .string()
      .min(1, 'Họ tên là bắt buộc')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z
      .string()
      .min(1, 'Email là bắt buộc')
      .email('Email không hợp lệ'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Xác nhận mật khẩu là bắt buộc'),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: 'Số điện thoại phải có 10 chữ số'
      }),
    dateOfBirth: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Ngày sinh không hợp lệ'
      }),
    gender: z
      .enum(['male', 'female', 'other', ''])
      .optional(),
    role: z
      .enum(['customer', 'admin', 'consultant', 'staff'])
      .default('customer')
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword']
  }),

  // Profile update schema
  profileSchema: z.object({
    fullName: z
      .string()
      .min(1, 'Họ tên là bắt buộc')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{10}$/.test(val), {
        message: 'Số điện thoại phải có 10 chữ số'
      }),
    dateOfBirth: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Ngày sinh không hợp lệ'
      }),
    gender: z
      .enum(['male', 'female', 'other', ''])
      .optional()
  }),

  // Appointment booking schema
  appointmentSchema: z.object({
    consultantId: z
      .string()
      .min(1, 'Vui lòng chọn chuyên gia tư vấn'),
    appointmentDate: z
      .string()
      .min(1, 'Vui lòng chọn ngày hẹn')
      .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      }, 'Ngày hẹn không thể là quá khứ'),
    startTime: z
      .string()
      .min(1, 'Vui lòng chọn giờ bắt đầu')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
    endTime: z
      .string()
      .min(1, 'Vui lòng chọn giờ kết thúc')
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
    customerNotes: z
      .string()
      .max(500, 'Ghi chú không được vượt quá 500 ký tự')
      .optional()
  }).refine((data) => {
    const start = data.startTime.split(':').map(Number);
    const end = data.endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    return startMinutes < endMinutes;
  }, {
    message: 'Giờ kết thúc phải sau giờ bắt đầu',
    path: ['endTime']
  }),

  // Blog post schema
  blogSchema: z.object({
    title: z
      .string()
      .min(1, 'Tiêu đề là bắt buộc')
      .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
      .max(200, 'Tiêu đề không được vượt quá 200 ký tự'),
    content: z
      .string()
      .min(1, 'Nội dung là bắt buộc')
      .min(50, 'Nội dung phải có ít nhất 50 ký tự'),
    summary: z
      .string()
      .max(500, 'Tóm tắt không được vượt quá 500 ký tự')
      .optional(),
    tags: z
      .array(z.string())
      .optional()
  }),

  // Feedback schema
  feedbackSchema: z.object({
    rating: z
      .number()
      .min(1, 'Vui lòng chọn đánh giá')
      .max(5, 'Đánh giá tối đa là 5 sao'),
    comment: z
      .string()
      .max(1000, 'Bình luận không được vượt quá 1000 ký tự')
      .optional()
  }),

  // STI Order schema
  stiOrderSchema: z.object({
    orderDate: z
      .string()
      .min(1, 'Vui lòng chọn ngày xét nghiệm')
      .refine((val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      }, 'Ngày xét nghiệm không thể là quá khứ'),
    notes: z
      .string()
      .max(500, 'Ghi chú không được vượt quá 500 ký tự')
      .optional(),
    stiPackageId: z
      .string()
      .optional(),
    stiTestItems: z
      .array(z.string())
      .optional()
  }).refine((data) => {
    return data.stiPackageId || (data.stiTestItems && data.stiTestItems.length > 0);
  }, {
    message: 'Vui lòng chọn gói xét nghiệm hoặc ít nhất một xét nghiệm',
    path: ['stiPackageId']
  })
};

// Export types cho TypeScript
export type LoginFormData = z.infer<typeof validationSchemas.loginSchema>;
export type RegisterFormData = z.infer<typeof validationSchemas.registerSchema>;
export type ProfileFormData = z.infer<typeof validationSchemas.profileSchema>;
export type AppointmentFormData = z.infer<typeof validationSchemas.appointmentSchema>;
export type BlogFormData = z.infer<typeof validationSchemas.blogSchema>;
export type FeedbackFormData = z.infer<typeof validationSchemas.feedbackSchema>;
export type StiOrderFormData = z.infer<typeof validationSchemas.stiOrderSchema>; 