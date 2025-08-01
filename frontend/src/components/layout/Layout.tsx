import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../Navigation';
import Footer from './Footer';
import ChatBot from '../common/ChatBot';

interface LayoutProps {
  children: ReactNode;
    onLoginClick?: () => void;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      
      {/* GenCare AI Chatbot */}
      <ChatBot className="gencare-chatbot" />
    </div>
  );
}