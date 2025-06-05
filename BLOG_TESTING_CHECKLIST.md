# 📝 Blog Feature Testing Checklist

## 🚀 Server Status
- [x] Backend API running on http://localhost:3000
- [x] Frontend running on http://localhost:5173
- [x] API connection test successful (Status 200)

## 📊 Blog List Page Tests (/blogs)

### 🔧 API Connection Tests
1. **Test API Button**: 
   - [ ] Click "Test API" button on blog page
   - [ ] Check browser console (F12) for test results
   - [ ] Verify both Blog API and Auth API tests complete

### 📚 Blog Display Tests
2. **Blog Loading**:
   - [ ] Page loads without errors
   - [ ] Blog posts are displayed (should show 3 imported blogs)
   - [ ] Each blog shows: title, author, publish date, content preview

3. **Blog Content**:
   - [ ] "Hiểu biết cơ bản về sức khỏe sinh sản ở phụ nữ"
   - [ ] "Tầm soát ung thư cổ tử cung: Điều cần biết"
   - [ ] "Kế hoạch hóa gia đình hiệu quả"

### 🔍 Filter & Search Tests
4. **Filtering**:
   - [ ] Sort by date (newest first, oldest first)
   - [ ] Sort by title (A-Z, Z-A)
   - [ ] Filter by author specialization
   - [ ] Search by keywords in title/content

### 🔐 Authentication Features
5. **User Role Tests**:
   - [ ] Without login: Can view blogs but no create button
   - [ ] As consultant: See "Viết bài mới" button
   - [ ] As customer: See discussion encouragement section

## 📖 Blog Detail Page Tests (/blogs/:id)

6. **Blog Detail View**:
   - [ ] Click on any blog from list
   - [ ] Full blog content displays
   - [ ] Author information shows
   - [ ] Comments section appears (if implemented)

## ✍️ Blog Creation Tests (Consultants only)

7. **Create New Blog** (requires consultant login):
   - [ ] Click "Viết bài mới" button
   - [ ] Blog creation form appears
   - [ ] Can write title, content, select specialization
   - [ ] Save/Publish functionality works

## 🔄 API Integration Tests

8. **Frontend-Backend Communication**:
   - [ ] Blog data loads from backend (not mock data)
   - [ ] Loading states work properly
   - [ ] Error handling displays appropriate messages
   - [ ] CORS allows frontend to access backend APIs

## 🐛 Error Handling Tests

9. **Error Scenarios**:
   - [ ] No internet/backend down: Shows appropriate error
   - [ ] Empty blog list: Shows "no blogs" message
   - [ ] Invalid blog ID: Handles gracefully

## 📱 UI/UX Tests

10. **User Interface**:
    - [ ] Responsive design on different screen sizes
    - [ ] Loading spinners appear during data fetch
    - [ ] Buttons are clickable and styled properly
    - [ ] Vietnamese text displays correctly

---

## 🎯 Quick Test Instructions

1. **Open Blog Page**: http://localhost:5173/blogs
2. **Test API Connection**: Click green "Test API" button
3. **Check Console**: Press F12, click "Test API", view console output
4. **Browse Blogs**: Click on blog cards to view details
5. **Test Filters**: Try different sort options and search

## ✅ Expected Results

- **Blog Count**: 3 blogs should be visible
- **API Status**: Both Blog API and Auth API tests should pass
- **Content**: Vietnamese health-related blog posts
- **Navigation**: Smooth transitions between list and detail views

## 🚨 Common Issues & Solutions

- **No blogs showing**: Check if backend is running and database is connected
- **API errors**: Verify CORS settings and network connectivity  
- **Loading forever**: Check browser console for JavaScript errors
- **Test API fails**: Ensure both frontend (5173) and backend (3000) ports are accessible 