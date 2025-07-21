# Hướng dẫn kiểm thử (Testing Guide)

## 1. Chạy toàn bộ test

```bash
npm test
```
Hoặc:
```bash
npx jest
```

## 2. Chạy test kèm báo cáo coverage

```bash
npm test -- --coverage
```
Hoặc:
```bash
npx jest --coverage
```

- Báo cáo coverage sẽ được sinh ra trong thư mục `coverage/lcov-report/index.html`.
- Mở file này bằng trình duyệt để xem chi tiết.

## 3. Chạy test cho 1 file cụ thể

```bash
npm test src/hooks/useApi.test.ts
```
Hoặc:
```bash
npx jest src/hooks/useApi.test.ts
```

## 4. Thêm test mới
- Tạo file mới với đuôi `.test.ts` hoặc `.test.tsx` cùng thư mục với file cần test.
- Sử dụng Testing Library (`@testing-library/react`, `@testing-library/react-hooks`) để viết test cho component hoặc hook.
- Ví dụ:
```ts
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('hiển thị tiêu đề', () => {
  render(<MyComponent />);
  expect(screen.getByText(/tiêu đề/i)).toBeInTheDocument();
});
```

## 5. Một số lệnh hữu ích
- Liệt kê tất cả test suite:
  ```bash
  npx jest --listTests
  ```
- Chạy test và xem log chi tiết:
  ```bash
  npx jest --verbose
  ```

## 6. Lưu ý
- Đảm bảo test pass trước khi commit code.
- Coverage cao giúp đảm bảo chất lượng code, nhưng test phải pass mới thực sự có ý nghĩa.
- Nếu gặp lỗi liên quan đến mock, context, hãy kiểm tra lại cách mock hoặc hỏi leader/project owner.

---
**Mọi thắc mắc về kiểm thử, vui lòng liên hệ team FE hoặc người hướng dẫn.** 

## 3.2 Frontend Unit Testing
### 3.2.1 Framework và Tool
- **Framework:** Jest + React Testing Library
- **Component Testing:** @testing-library/react, @testing-library/jest-dom
- **Coverage Target:** ≥80%

### 3.2.2 Components đã test
- (Điền danh sách các component đã test tại đây)

### 3.2.3 Kết quả Coverage Frontend
- **Overall Coverage:** 44.94%
- **Components Coverage:** 98.15%
- **Hooks Coverage:** 91.56%
- **Utils Coverage:** 95.96% 