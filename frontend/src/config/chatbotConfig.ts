
export interface ChatbotConfig {
  webhookUrl: string;
  webhookConfig: {
    method: string;
    headers: Record<string, string>;
  };
  target: string;
  mode: 'window' | 'fullscreen';
  chatInputKey: string;
  chatSessionKey: string;
  loadPreviousSession: boolean;
  metadata: Record<string, any>;
  showWelcomeScreen: boolean;
  defaultLanguage: string;
  initialMessages: string[];
  i18n: {
    [key: string]: {
      title: string;
      subtitle: string;
      footer: string;
      getStarted: string;
      inputPlaceholder: string;
    };
  };
  allowFileUploads: boolean;
  allowedFilesMimeTypes: string;
}

// Cấu hình mặc định cho chatbot GenCare
export const defaultChatbotConfig: ChatbotConfig = {
  // Sử dụng webhook URL từ environment helper function
  webhookUrl: import.meta.env.VITE_CHATBOX_API,
  
  webhookConfig: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },

  target: '#gencare-chatbot',
  mode: 'window',
  chatInputKey: 'chatInput',
  chatSessionKey: 'sessionId',
  loadPreviousSession: false,
  
  metadata: {},
  showWelcomeScreen: true,
  defaultLanguage: 'vi',
  
  initialMessages: [
    'Xin chào! Tôi là GenBot Assistant ',
    'Tôi có thể giúp bạn về các vấn đề sức khỏe, đặt lịch khám, và tư vấn y tế.',
    'Bạn cần hỗ trợ gì hôm nay?'
  ],

  i18n: {
    vi: {
      title: 'GenCare AI Assistant',
      subtitle: 'Hỗ trợ sức khỏe 24/7',
      footer: 'Powered by GenCare Healthcare',
      getStarted: 'Bắt đầu trò chuyện',
      inputPlaceholder: 'Nhập tin nhắn của bạn...'
    },
    en: {
      title: 'GenCare AI Assistant', 
      subtitle: '24/7 Healthcare Support',
      footer: 'Powered by GenCare Healthcare',
      getStarted: 'Start chatting',
      inputPlaceholder: 'Type your message...'
    }
  },

  allowFileUploads: false,
  allowedFilesMimeTypes: ''
};

// Hàm tạo cấu hình chatbot với user context
export const createChatbotConfig = (user?: any): ChatbotConfig => {
  const config = { ...defaultChatbotConfig };
  
  // Thêm metadata về user nếu có
  if (user) {
    config.metadata = {
      userId: user.id,
      userRole: user.role,
      userName: user.name || user.fullName,
      userEmail: user.email,
      sessionStart: new Date().toISOString()
    };
  }

  return config;
}; 