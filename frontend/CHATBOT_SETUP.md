# Hướng dẫn cấu hình GenCare AI Chatbot

## Tổng quan

GenCare đã tích hợp chatbot AI sử dụng n8n workflow. Chatbot này giúp người dùng tương tác và nhận được hỗ trợ 24/7 về các dịch vụ chăm sóc sức khỏe.

## Yêu cầu

- N8N instance (cloud hoặc self-hosted)
- Workflow n8n với Chat Trigger node
- Webhook URL từ n8n workflow

## Cấu hình

### 1. Tạo workflow n8n

1. Đăng nhập vào n8n instance của bạn
2. Tạo workflow mới
3. Thêm **Chat Trigger** node làm trigger đầu tiên
4. Thêm **AI Agent** node hoặc các node xử lý khác
5. Kích hoạt workflow và lấy webhook URL

### 2. Cấu hình frontend

Tạo file `.env` trong thư mục `frontend/` với nội dung:

```env
# GenCare Frontend Environment Variables

# API Configuration
VITE_API_URL=http://localhost:3000/api

# N8N Chatbot Configuration
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# Optional settings
VITE_ENABLE_LOGGING=true
VITE_ENABLE_DEBUG_MODE=true
VITE_API_TIMEOUT=5000
VITE_RETRY_ATTEMPTS=3
```

**Lưu ý quan trọng**: Thay thế `your-webhook-id` bằng ID thực tế từ n8n workflow của bạn.

### 3. Cấu hình n8n workflow

#### Chat Trigger Node:
- **Allowed Origins (CORS)**: Thêm domain của website GenCare
  - Development: `http://localhost:5173`
  - Production: `https://your-domain.com`

#### AI Agent Node (khuyến nghị):
- **Model**: OpenAI GPT-4 hoặc model AI khác
- **System Message**: 
  ```
  Bạn là trợ lý AI của GenCare, một nền tảng chăm sóc sức khỏe tại Việt Nam. 
  Nhiệm vụ của bạn là:
  - Hỗ trợ người dùng về các dịch vụ chăm sóc sức khỏe
  - Cung cấp thông tin về xét nghiệm, tư vấn sức khỏe
  - Hướng dẫn đặt lịch hẹn
  - Trả lời các câu hỏi về sức khỏe sinh sản
  - Luôn lịch sự, chuyên nghiệp và thân thiện
  - Trả lời bằng tiếng Việt trừ khi được yêu cầu khác
  ```

#### Memory Node (tùy chọn):
- **Simple Memory**: Để chatbot nhớ ngữ cảnh cuộc trò chuyện
- **Max Messages**: 10-20 tin nhắn

### 4. Test chatbot

1. Khởi động frontend: `npm run dev`
2. Mở trình duyệt và truy cập website
3. Tìm biểu tượng chat ở góc dưới bên phải
4. Click để mở chatbot và test

## Tùy chỉnh giao diện

Chatbot đã được tùy chỉnh phù hợp với theme GenCare. Bạn có thể chỉnh sửa trong file `ChatBot.tsx`:

### Màu sắc:
- Primary: `#3b82f6` (Blue)
- Secondary: `#10b981` (Green)
- Header: Gradient blue

### Kích thước:
- Window: 380px x 600px
- Toggle button: 60px

### Vị trí:
- Góc dưới bên phải
- Cách bottom: 20px, right: 20px

## Troubleshooting

### Chatbot không hiển thị:
1. Kiểm tra webhook URL trong file `.env`
2. Đảm bảo n8n workflow đã được kích hoạt
3. Kiểm tra CORS settings trong Chat Trigger node

### Lỗi kết nối:
1. Kiểm tra network connection
2. Xem console logs trong DevTools
3. Đảm bảo n8n instance có thể truy cập từ frontend

### Chatbot hiển thị nhưng không trả lời:
1. Kiểm tra AI Agent node có được cấu hình đúng
2. Xem execution logs trong n8n
3. Kiểm tra API keys cho AI models

## Features

### Đã triển khai:
- ✅ Chat window với toggle button
- ✅ Tích hợp với user context (role, name, ID)
- ✅ Hỗ trợ tiếng Việt
- ✅ Custom styling phù hợp GenCare theme
- ✅ Error handling và loading states
- ✅ Responsive design

### Có thể mở rộng:
- 📋 File upload support
- 📋 Rich media messages
- 📋 Quick reply buttons
- 📋 Integration với calendar booking
- 📋 Multi-language support

## Support

Nếu gặp vấn đề, vui lòng liên hệ team development hoặc tạo issue trong repository. 