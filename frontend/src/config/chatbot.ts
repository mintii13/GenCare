// Config cho ChatBot
export const CHATBOT_CONFIG = {
  // Thay URL này bằng webhook URL thật của bạn
  WEBHOOK_URL: 'https://hook.eu2.make.com/your-webhook-url-here',
  
  // Fallback từ environment nếu có
  getWebhookUrl: () => {
    return import.meta.env.VITE_CHATBOX_API || CHATBOT_CONFIG.WEBHOOK_URL;
  }
}; 