import React from "react";
import { Link } from "react-router-dom";
import BannerImage from '../../../assets/images/homepage.jpg';

const Banner: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-400 py-16 md:py-28 overflow-hidden shadow-xl">
      <div className="container mx-auto flex flex-col md:flex-row items-center px-4 gap-12 relative z-10">
        {/* LEFT: TEXT */}
        <div className="flex-1 md:pr-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-lg text-left leading-tight">
            <span className="block text-white">GenCare</span>
            <span className="block text-white">Chăm sóc sức khỏe chủ động</span>
          </h1>
          <p className="mb-8 text-lg md:text-2xl font-medium text-white/90 max-w-xl text-left">
            Đặt lịch xét nghiệm y tế nhanh chóng, bảo mật và chuyên nghiệp. Đội ngũ chuyên gia tận tâm, kết quả chính xác, hỗ trợ tư vấn miễn phí.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:justify-start mt-4">
            <Link
              to="/test-packages"
              className="inline-block bg-white/90 hover:bg-white text-blue-700 font-bold px-8 py-4 rounded-xl shadow-lg text-lg transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 animate-fade-in-up border-2 border-white"
            >
              Xem các gói xét nghiệm
            </Link>
            <Link
              to="/about"
              className="inline-block border-2 border-white/80 hover:bg-white hover:text-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow text-lg transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 animate-fade-in-up"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
        {/* RIGHT: IMAGE */}
        <div className="flex-1 flex justify-center md:justify-end animate-fade-in">
          <div className="relative w-full max-w-xs md:max-w-lg aspect-[4/3]">
            <img
              src={BannerImage}
              alt="GenCare Banner"
              className="rounded-3xl shadow-2xl w-full h-full object-cover border-4 border-white/40 bg-white"
              style={{ minHeight: 220 }}
            />
            {/* Hiệu ứng bóng mờ phía sau */}
            <div className="absolute -inset-4 rounded-3xl bg-blue-300/30 blur-2xl z-[-1]" />
          </div>
        </div>
      </div>
      {/* Hiệu ứng nền động */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-300 rounded-full opacity-20 blur-3xl z-0 animate-pulse-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-700 rounded-full opacity-20 blur-3xl z-0 animate-pulse-slow" />
      {/* CSS animation */}
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .animate-fade-in {
          animation: fadeIn 1.2s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s infinite alternate;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseSlow {
          from { opacity: 0.2; }
          to { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
};

export default Banner; 