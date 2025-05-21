import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        <div className="font-bold text-2xl text-primary-600">GenCare</div>
        <nav className="hidden md:flex gap-8 text-neutral-700 font-medium">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <Link to="/blog" className="hover:text-primary-600">Blog</Link>
          <Link to="/services" className="hover:text-primary-600">Dịch vụ</Link>
          <Link to="/register" className="hover:text-primary-600">Đăng ký</Link>
          <Link to="/auth/login" className="hover:text-primary-600">Đăng nhập</Link>
        </nav>
        <button className="md:hidden p-2 rounded hover:bg-neutral-100">
          <span className="sr-only">Open menu</span>
          <svg width={24} height={24} fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth={2} strokeLinecap="round"/></svg>
        </button>
      </div>
    </header>
  );
} 