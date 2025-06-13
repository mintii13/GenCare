import { ReactNode } from 'react';
import Navigation from '../Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  onLoginClick?: () => void;
}

export default function Layout({ children, onLoginClick }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation onLoginClick={onLoginClick} />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
} 