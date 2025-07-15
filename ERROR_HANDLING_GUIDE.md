# Hướng dẫn sử dụng hệ thống Error Handling mới

## Tổng quan

Hệ thống error handling mới cung cấp thông báo lỗi chi tiết và thân thiện với người dùng, thay thế các thông báo lỗi chung chung trước đây.

## Cải tiến chính

### 1. Backend Error Handler

**File:** `backend/src/middlewares/errorHandler.ts`

**Cải tiến:**
- Thông báo lỗi chi tiết theo từng loại lỗi
- Hỗ trợ các error types: `VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, etc.
- Xử lý lỗi MongoDB (CastError, duplicate key)
- Thông tin timestamp và path cho debugging

**Ví dụ response:**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "type": "VALIDATION_ERROR",
  "details": "Vui lòng kiểm tra lại thông tin đặt lịch",
  "errors": [
    {
      "field": "start_time",
      "message": "Start time must be in HH:mm format",
      "value": "25:00"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/appointments/book",
  "method": "POST"
}
```

### 2. Frontend Error Utils

**File:** `frontend/src/utils/errorUtils.ts`

**Các function chính:**

#### `showErrorToast(error, customMessage?)`
Hiển thị toast lỗi với thông tin chi tiết từ backend

#### `showValidationErrorToast(errors, title?)`
Hiển thị toast với danh sách lỗi validation

#### `handleApiError(error, context?)`
Xử lý lỗi API với logging và context

#### `handleFormError(error, fieldName?)`
Xử lý lỗi form với focus vào field cụ thể

#### `isAuthError(error)`, `isValidationError(error)`
Kiểm tra loại lỗi

### 3. Validation Middleware cải tiến

**File:** `backend/src/middlewares/appointmentValidation.ts`

**Cải tiến:**
- Sử dụng `abortEarly: false` để hiển thị tất cả lỗi
- Thông báo lỗi bằng tiếng Việt
- Structured error response với field mapping

## Cách sử dụng

### 1. Trong API calls

**Cũ:**
```typescript
try {
  const response = await apiClient.post('/api/appointments/book', data);
} catch (error) {
  toast.error('Có lỗi xảy ra');
}
```

**Mới:**
```typescript
import { handleApiError } from '@/utils/errorUtils';

try {
  const response = await apiClient.post('/api/appointments/book', data);
} catch (error) {
  handleApiError(error, 'Đặt lịch hẹn');
}
```

### 2. Trong form validation

```typescript
import { handleFormError } from '@/utils/errorUtils';

const onSubmit = async (data) => {
  try {
    await submitForm(data);
  } catch (error) {
    handleFormError(error, 'email'); // Focus vào field email nếu có lỗi
  }
};
```

### 3. Custom validation errors

```typescript
import { showValidationErrorToast } from '@/utils/errorUtils';

const validateForm = () => {
  const errors = [];
  if (!email) errors.push('Email là bắt buộc');
  if (!password) errors.push('Mật khẩu là bắt buộc');
  
  if (errors.length > 0) {
    showValidationErrorToast(errors, 'Vui lòng điền đầy đủ thông tin');
    return false;
  }
  return true;
};
```

### 4. Trong Backend validation

```typescript
export const validateData = (req: Request, res: Response, next: NextFunction) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      type: 'VALIDATION_ERROR',
      details: 'Vui lòng kiểm tra lại thông tin',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};
```

## Các loại lỗi được hỗ trợ

### Backend Error Types

| Type | Status | Mô tả |
|------|--------|-------|
| `VALIDATION_ERROR` | 400 | Lỗi validation dữ liệu |
| `AUTHENTICATION_ERROR` | 401 | Lỗi xác thực |
| `AUTHORIZATION_ERROR` | 403 | Lỗi phân quyền |
| `NOT_FOUND_ERROR` | 404 | Không tìm thấy tài nguyên |
| `CONFLICT_ERROR` | 409 | Xung đột dữ liệu |
| `DUPLICATE_ERROR` | 409 | Dữ liệu trùng lặp |
| `UNPROCESSABLE_ERROR` | 422 | Dữ liệu không thể xử lý |
| `RATE_LIMIT_ERROR` | 429 | Quá nhiều request |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi server |

### Frontend Toast Types

- **Error Toast:** Lỗi đơn giản với thông báo ngắn
- **Validation Toast:** Lỗi validation với danh sách chi tiết
- **Multi-line Toast:** Lỗi với thông tin chi tiết và context

## Testing

Sử dụng component `ErrorTestComponent` để test các loại lỗi:

```typescript
import ErrorTestComponent from '@/components/debug/ErrorTestComponent';

// Trong development, thêm vào route để test
<Route path="/debug/errors" element={<ErrorTestComponent />} />
```

## Best Practices

1. **Luôn sử dụng error utils** thay vì toast trực tiếp
2. **Cung cấp context** cho `handleApiError` để dễ debug
3. **Kiểm tra loại lỗi** trước khi xử lý đặc biệt
4. **Log chi tiết** trong development environment
5. **Giữ thông báo ngắn gọn** nhưng đủ thông tin
6. **Sử dụng tiếng Việt** cho user-facing messages

## Migration từ hệ thống cũ

### Thay thế toast.error()

**Cũ:**
```typescript
toast.error('Có lỗi xảy ra');
```

**Mới:**
```typescript
import { showErrorToast } from '@/utils/errorUtils';
showErrorToast(error);
```

### Thay thế validation errors

**Cũ:**
```typescript
if (error.response?.data?.errors) {
  error.response.data.errors.forEach(err => toast.error(err));
}
```

**Mới:**
```typescript
import { handleApiError } from '@/utils/errorUtils';
handleApiError(error, 'Form validation');
```

## Kết luận

Hệ thống error handling mới cung cấp:

- ✅ Thông báo lỗi chi tiết và thân thiện
- ✅ Xử lý tự động các loại lỗi khác nhau  
- ✅ Logging tốt hơn cho debugging
- ✅ Tính nhất quán trong toàn bộ ứng dụng
- ✅ Dễ dàng mở rộng và bảo trì

Hãy sử dụng hệ thống mới này trong tất cả các tính năng mới và migration dần các tính năng cũ. 