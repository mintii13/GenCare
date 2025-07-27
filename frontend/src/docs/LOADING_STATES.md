# Loading States Standards

## Tổng quan

Dự án này sử dụng các loading states thống nhất để đảm bảo trải nghiệm người dùng nhất quán.

## Quy tắc đặt tên

### 1. State Variables
- **Sử dụng**: `loading` / `setLoading`
- **Không sử dụng**: `isLoading` / `setIsLoading`

```typescript
// ✅ Đúng
const [loading, setLoading] = useState(false);

// ❌ Sai
const [isLoading, setIsLoading] = useState(false);
```

### 2. Interface Properties
```typescript
// ✅ Đúng
interface ComponentProps {
  loading: boolean;
  error: string | null;
}

// ❌ Sai
interface ComponentProps {
  isLoading: boolean;
  error: string | null;
}
```

## Các loại Loading States

### 1. Standard Loading (`useStandardLoading`)
Sử dụng cho các trường hợp loading đơn giản.

```typescript
import { useStandardLoading } from '../utils/loadingUtils';

const MyComponent = () => {
  const { loading, error, setLoading, setError, clearError } = useStandardLoading();
  
  // Sử dụng
  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
    </div>
  );
};
```

### 2. Async Loading (`useAsyncLoading`)
Sử dụng cho các async operations với error handling tự động.

```typescript
import { useAsyncLoading } from '../utils/loadingUtils';

const MyComponent = () => {
  const { loading, error, executeWithLoading, clearError } = useAsyncLoading();
  
  const handleSubmit = async () => {
    const result = await executeWithLoading(
      () => apiService.doSomething(),
      'Không thể thực hiện thao tác'
    );
    
    if (result) {
      // Success
    }
  };
};
```

### 3. Data Loading (`useDataLoading`)
Sử dụng cho data fetching với cache và state management.

```typescript
import { useDataLoading } from '../utils/loadingUtils';

const MyComponent = () => {
  const { 
    data, 
    loading, 
    error, 
    hasLoaded, 
    fetchData, 
    clearError 
  } = useDataLoading([]);
  
  useEffect(() => {
    fetchData(() => apiService.getData());
  }, []);
};
```

### 4. Form Loading (`useFormLoading`)
Sử dụng cho form submissions với toast notifications.

```typescript
import { useFormLoading } from '../utils/loadingUtils';

const MyForm = () => {
  const { submitting, error, submitForm, clearError } = useFormLoading();
  
  const handleSubmit = async (formData) => {
    const result = await submitForm(
      () => apiService.submitForm(formData),
      'Lưu thành công!'
    );
  };
};
```

## Combining Loading States

Sử dụng `combineLoadingStates` để kết hợp nhiều loading states:

```typescript
import { combineLoadingStates } from '../utils/loadingUtils';

const MyComponent = () => {
  const { loading: dataLoading, error: dataError } = useDataLoading([]);
  const { loading: formLoading, error: formError } = useFormLoading();
  
  const { loading, error } = combineLoadingStates(
    { loading: dataLoading, error: dataError },
    { loading: formLoading, error: formError }
  );
};
```

## Migration Guide

### Từ `isLoading` sang `loading`

1. **State Variables**:
```typescript
// Trước
const [isLoading, setIsLoading] = useState(false);

// Sau
const [loading, setLoading] = useState(false);
```

2. **Interface Properties**:
```typescript
// Trước
interface Props {
  isLoading: boolean;
}

// Sau
interface Props {
  loading: boolean;
}
```

3. **Hook Returns**:
```typescript
// Trước
return { isLoading, error };

// Sau
return { loading, error };
```

4. **Component Usage**:
```typescript
// Trước
const { isLoading } = useMyHook();

// Sau
const { loading } = useMyHook();
```

## Best Practices

### 1. Error Handling
- Luôn có error state đi kèm với loading state
- Clear error khi bắt đầu loading mới
- Hiển thị error message thân thiện với người dùng

### 2. Loading Indicators
- Sử dụng spinner hoặc skeleton cho loading states
- Không hiển thị loading quá lâu (> 3 giây)
- Có fallback UI khi loading thất bại

### 3. Performance
- Sử dụng `useCallback` cho loading functions
- Tránh re-render không cần thiết
- Cache loading states khi có thể

### 4. Accessibility
- Thêm `aria-busy` attribute cho loading elements
- Cung cấp loading message cho screen readers
- Disable interactive elements khi loading

## Examples

### Complete Component Example
```typescript
import React from 'react';
import { useDataLoading } from '../utils/loadingUtils';
import { Spinner, ErrorMessage } from '../components/ui';

interface User {
  id: string;
  name: string;
}

const UserList = () => {
  const { 
    data: users, 
    loading, 
    error, 
    fetchData, 
    clearError 
  } = useDataLoading<User[]>([]);

  useEffect(() => {
    fetchData(() => apiService.getUsers());
  }, []);

  if (loading && users.length === 0) {
    return <Spinner message="Đang tải danh sách người dùng..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          clearError();
          fetchData(() => apiService.getUsers());
        }}
      />
    );
  }

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

### Hook Example
```typescript
import { useStandardLoading } from '../utils/loadingUtils';

export const useUserData = (userId: string) => {
  const { loading, error, setLoading, setError, clearError } = useStandardLoading();
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await apiService.getUser(userId);
      setUser(response.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError, clearError]);

  return {
    user,
    loading,
    error,
    fetchUser
  };
};
``` 
 

## Tổng quan

Dự án này sử dụng các loading states thống nhất để đảm bảo trải nghiệm người dùng nhất quán.

## Quy tắc đặt tên

### 1. State Variables
- **Sử dụng**: `loading` / `setLoading`
- **Không sử dụng**: `isLoading` / `setIsLoading`

```typescript
// ✅ Đúng
const [loading, setLoading] = useState(false);

// ❌ Sai
const [isLoading, setIsLoading] = useState(false);
```

### 2. Interface Properties
```typescript
// ✅ Đúng
interface ComponentProps {
  loading: boolean;
  error: string | null;
}

// ❌ Sai
interface ComponentProps {
  isLoading: boolean;
  error: string | null;
}
```

## Các loại Loading States

### 1. Standard Loading (`useStandardLoading`)
Sử dụng cho các trường hợp loading đơn giản.

```typescript
import { useStandardLoading } from '../utils/loadingUtils';

const MyComponent = () => {
  const { loading, error, setLoading, setError, clearError } = useStandardLoading();
  
  // Sử dụng
  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorMessage message={error} />}
    </div>
  );
};
```

### 2. Async Loading (`useAsyncLoading`)
Sử dụng cho các async operations với error handling tự động.

```typescript
import { useAsyncLoading } from '../utils/loadingUtils';

const MyComponent = () => {
  const { loading, error, executeWithLoading, clearError } = useAsyncLoading();
  
  const handleSubmit = async () => {
    const result = await executeWithLoading(
      () => apiService.doSomething(),
      'Không thể thực hiện thao tác'
    );
    
    if (result) {
      // Success
    }
  };
};
```

### 3. Data Loading (`useDataLoading`)
Sử dụng cho data fetching với cache và state management.

```typescript
import { useDataLoading } from '../utils/loadingUtils';

const MyComponent = () => {
  const { 
    data, 
    loading, 
    error, 
    hasLoaded, 
    fetchData, 
    clearError 
  } = useDataLoading([]);
  
  useEffect(() => {
    fetchData(() => apiService.getData());
  }, []);
};
```

### 4. Form Loading (`useFormLoading`)
Sử dụng cho form submissions với toast notifications.

```typescript
import { useFormLoading } from '../utils/loadingUtils';

const MyForm = () => {
  const { submitting, error, submitForm, clearError } = useFormLoading();
  
  const handleSubmit = async (formData) => {
    const result = await submitForm(
      () => apiService.submitForm(formData),
      'Lưu thành công!'
    );
  };
};
```

## Combining Loading States

Sử dụng `combineLoadingStates` để kết hợp nhiều loading states:

```typescript
import { combineLoadingStates } from '../utils/loadingUtils';

const MyComponent = () => {
  const { loading: dataLoading, error: dataError } = useDataLoading([]);
  const { loading: formLoading, error: formError } = useFormLoading();
  
  const { loading, error } = combineLoadingStates(
    { loading: dataLoading, error: dataError },
    { loading: formLoading, error: formError }
  );
};
```

## Migration Guide

### Từ `isLoading` sang `loading`

1. **State Variables**:
```typescript
// Trước
const [isLoading, setIsLoading] = useState(false);

// Sau
const [loading, setLoading] = useState(false);
```

2. **Interface Properties**:
```typescript
// Trước
interface Props {
  isLoading: boolean;
}

// Sau
interface Props {
  loading: boolean;
}
```

3. **Hook Returns**:
```typescript
// Trước
return { isLoading, error };

// Sau
return { loading, error };
```

4. **Component Usage**:
```typescript
// Trước
const { isLoading } = useMyHook();

// Sau
const { loading } = useMyHook();
```

## Best Practices

### 1. Error Handling
- Luôn có error state đi kèm với loading state
- Clear error khi bắt đầu loading mới
- Hiển thị error message thân thiện với người dùng

### 2. Loading Indicators
- Sử dụng spinner hoặc skeleton cho loading states
- Không hiển thị loading quá lâu (> 3 giây)
- Có fallback UI khi loading thất bại

### 3. Performance
- Sử dụng `useCallback` cho loading functions
- Tránh re-render không cần thiết
- Cache loading states khi có thể

### 4. Accessibility
- Thêm `aria-busy` attribute cho loading elements
- Cung cấp loading message cho screen readers
- Disable interactive elements khi loading

## Examples

### Complete Component Example
```typescript
import React from 'react';
import { useDataLoading } from '../utils/loadingUtils';
import { Spinner, ErrorMessage } from '../components/ui';

interface User {
  id: string;
  name: string;
}

const UserList = () => {
  const { 
    data: users, 
    loading, 
    error, 
    fetchData, 
    clearError 
  } = useDataLoading<User[]>([]);

  useEffect(() => {
    fetchData(() => apiService.getUsers());
  }, []);

  if (loading && users.length === 0) {
    return <Spinner message="Đang tải danh sách người dùng..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          clearError();
          fetchData(() => apiService.getUsers());
        }}
      />
    );
  }

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

### Hook Example
```typescript
import { useStandardLoading } from '../utils/loadingUtils';

export const useUserData = (userId: string) => {
  const { loading, error, setLoading, setError, clearError } = useStandardLoading();
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      clearError();
      const response = await apiService.getUser(userId);
      setUser(response.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  }, [userId, setLoading, setError, clearError]);

  return {
    user,
    loading,
    error,
    fetchUser
  };
};
``` 