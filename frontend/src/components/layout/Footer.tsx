import React from 'react';

const Footer = () => (
  <footer className="bg-blue-900 text-white py-6 px-4">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <div className="font-bold text-lg mb-1">GENCARE</div>
        <div className="text-sm">Hệ thống Sức khỏe Sinh sản Toàn diện</div>
        <div className="text-xs mt-1">Hotline: <a href="tel:19006789" className="underline hover:text-cyan-300">1900 6789</a> | Email: <a href="mailto:support@gencare.vn" className="underline hover:text-cyan-300">support@gencare.vn</a></div>
      </div>
      <div className="text-xs text-center md:text-right text-gray-200">
        © 2024 GenCare Vietnam. All rights reserved.<br />
        <a href="#" className="hover:text-cyan-300 underline mx-1">Chính sách bảo mật</a>|
        <a href="#" className="hover:text-cyan-300 underline mx-1">Điều khoản</a>
      </div>
    </div>
  </footer>
);

export default Footer;
