# 🔐 Google OAuth Troubleshooting Guide

## 📋 Checklist trước khi test

### 1. ✅ Backend phải đang chạy
```bash
cd backend
npm start
# Server chạy tại: http://localhost:3000
```

### 2. ✅ Frontend phải đang chạy
```bash
cd frontend
npm run dev
# Frontend chạy tại: http://localhost:5173
```

### 3. ✅ Google OAuth Credentials
Kiểm tra file `backend/.env` có các biến:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. ✅ Google Cloud Console Setup
- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

## 🧪 Test OAuth

1. **Truy cập**: `http://localhost:5173/google-auth-test`
2. **Click**: "Test Backend Connection" để kiểm tra backend
3. **Click**: "Đăng nhập với Google" để test OAuth

## 🐛 Các lỗi thường gặp

### ❌ "redirect_uri_mismatch"
**Nguyên nhân**: Google OAuth callback URL không đúng
**Giải pháp**: 
- Kiểm tra Google Cloud Console
- Đảm bảo redirect URI: `http://localhost:3000/api/auth/google/callback`

### ❌ "unauthorized_client"
**Nguyên nhân**: Client ID/Secret không đúng
**Giải pháp**:
- Kiểm tra file `.env` trong backend
- Đảm bảo GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET đúng

### ❌ "Không thể kết nối backend"
**Nguyên nhân**: Backend chưa chạy hoặc port sai
**Giải pháp**:
- Chạy `cd backend && npm start`
- Kiểm tra port 3000 có available không
- Test: `curl http://localhost:3000/api/auth/profile`

### ❌ "Token không hợp lệ"
**Nguyên nhân**: JWT token bị lỗi hoặc hết hạn
**Giải pháp**:
- Xóa localStorage: `localStorage.clear()`
- Refresh trang và đăng nhập lại

## 🔄 Quy trình OAuth Flow

```
1. User click "Đăng nhập với Google"
   ↓
2. Redirect to: http://localhost:3000/api/auth/google/verify
   ↓
3. Google authentication
   ↓
4. Google redirect to: http://localhost:3000/api/auth/google/callback
   ↓
5. Backend tạo JWT token
   ↓
6. Redirect to: http://localhost:5173/oauth-success?token=jwt_token
   ↓
7. Frontend lưu token và redirect đến dashboard
```

## 🛠️ Debug Commands

### Test Backend Health
```bash
curl http://localhost:3000/api/auth/profile
```

### Test Google OAuth Start
```bash
curl http://localhost:3000/api/auth/google/verify
```

### Check Environment Variables
```bash
cd backend
node -e "console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...')"
```

## 🎯 Setup Google Cloud Console

1. Truy cập: https://console.cloud.google.com/
2. Tạo hoặc chọn project
3. Enable Google+ API hoặc Google People API
4. Tạo OAuth 2.0 Client IDs
5. Cấu hình:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

## 📞 Support

Nếu vẫn gặp vấn đề:
1. Kiểm tra Console logs trong browser (F12)
2. Kiểm tra Backend logs
3. Test từng bước theo quy trình OAuth flow
4. Sử dụng `/google-auth-test` để debug chi tiết 