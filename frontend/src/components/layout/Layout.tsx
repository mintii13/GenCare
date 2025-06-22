import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  onLoginClick?: () => void;
}

export default function Layout({ children, onLoginClick }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onLoginClick={onLoginClick} />
      <main className={`flex-grow ${isHomePage ? '' : 'pt-16'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}