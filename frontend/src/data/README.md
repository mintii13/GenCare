# Mock Data cho Blog System

## Tổng quan

Thư mục này chứa dữ liệu mẫu (mock data) cho hệ thống blog, giúp phát triển frontend mà không cần backend thật.

## Files

- `mockBlogData.ts` - Dữ liệu mẫu cho blogs, comments, và specializations

## Cấu hình Mock Data

Trong file `src/services/blogService.ts`, có một flag `USE_MOCK_DATA` để bật/tắt mock data:

```typescript
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || true;
```

### Cách bật/tắt Mock Data

1. **Sử dụng Environment Variable:**
   - Tạo file `.env` trong thư mục `frontend/`
   - Thêm dòng: `VITE_USE_MOCK_DATA=true` (bật) hoặc `VITE_USE_MOCK_DATA=false` (tắt)

2. **Thay đổi trực tiếp trong code:**
   - Mở file `src/services/blogService.ts`
   - Thay đổi dòng: `const USE_MOCK_DATA = true;` hoặc `false`

## Dữ liệu Mock có sẵn

### Blogs (5 bài viết mẫu)
- Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ
- Phòng tránh các bệnh lây truyền qua đường tình dục (STIs)
- Dinh dưỡng trong thai kỳ: Những điều cần biết
- Chăm sóc sức khỏe nam giới: Những vấn đề thường gặp
- Tầm soát ung thư cổ tử cung: Tại sao quan trọng?

### Comments
- Blog ID 1: 4 comments (bao gồm 1 reply và 1 anonymous comment)
- Blog ID 2: 2 comments (bao gồm 1 anonymous comment)

### Specializations
10 chuyên khoa y tế khác nhau để test filter

## Tính năng Mock

Mock service hỗ trợ tất cả các tính năng như API thật:

-  Lấy danh sách blog với filter và sorting
-  Lấy chi tiết blog
-  Lấy comments của blog
-  Tạo comment mới (có persisted trong session)
-  Tạo blog mới (có persisted trong session)
-  Cập nhật blog
-  Xóa blog
-  Lấy danh sách specializations
-  Simulate API delays (100-800ms)

## Khi nào sử dụng Mock Data

**Bật Mock Data khi:**
- Phát triển frontend mà chưa có backend
- Test UI/UX
- Demo sản phẩm
- Unit testing

**Tắt Mock Data khi:**
- Có backend API hoàn chỉnh
- Integration testing
- Production

## Chuyển đổi từ Mock sang Real API

1. Đảm bảo backend API đã sẵn sàng với các endpoints:
   ```
   GET    /api/blogs
   GET    /api/blogs/:id
   GET    /api/blogs/:id/comments
   POST   /api/blogs/:id/comments
   POST   /api/blogs
   PUT    /api/blogs/:id
   DELETE /api/blogs/:id
   GET    /api/specializations
   ```

2. Cập nhật `VITE_API_URL` trong `.env` file

3. Set `VITE_USE_MOCK_DATA=false`

4. Test các chức năng để đảm bảo API response format khớp với mock data