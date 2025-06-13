import React from "react";
import { Link } from "react-router-dom";
import { TestTube, ArrowRight, Calendar, Shield, User, ChevronDown } from "lucide-react";
import AuthRequiredButton from "../../../components/auth/AuthRequiredButton";

const Banner: React.FC = () => {
  const scrollToNextSection = () => {
    const nextSection = document.querySelector('#services-section');
    if (nextSection) {
      nextSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback: scroll down by viewport height
      window.scrollBy({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 py-20 md:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-medium">
              <Shield className="text-green-300 w-4 h-4" />
              Được tin tưởng bởi 10,000+ khách hàng
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                Gen<span className="text-cyan-300">Care</span>
              </h1>
              <h2 className="text-2xl md:text-4xl font-semibold text-white/95 leading-relaxed">
                Chăm sóc sức khỏe
                <br />
                <span className="text-cyan-200">chủ động & chuyên nghiệp</span>
              </h2>
            </div>

            {/* Value Proposition */}
            <p className="text-xl text-white/90 max-w-2xl leading-relaxed">
              Đặt lịch xét nghiệm và tư vấn sức khỏe trực tuyến với đội ngũ chuyên gia hàng đầu. 
              Bảo mật tuyệt đối, kết quả chính xác, hỗ trợ 24/7.
            </p>

            {/* Key Features */}
            <div className="flex flex-wrap gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="text-cyan-300 w-5 h-5" />
                <span>Đặt lịch online</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="text-cyan-300 w-5 h-5" />
                <span>Bảo mật cao</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="text-cyan-300 w-5 h-5" />
                <span>Chuyên gia tận tâm</span>
              </div>
            </div>

                         {/* Call to Action */}
             <div className="flex flex-col sm:flex-row gap-4 pt-4">
               <Link
                 to="/test-packages"
                 className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-blue-700 font-semibold px-8 py-4 rounded-xl shadow-lg text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
               >
                 <TestTube className="w-5 h-5 group-hover:scale-110 transition-transform" />
                 Xem gói xét nghiệm
               </Link>
               <AuthRequiredButton
                 redirectTo="/dashboard/customer"
                 message="Vui lòng đăng nhập để sử dụng dịch vụ tư vấn!"
                 successMessage="Đăng nhập thành công! Chuyển đến trang tư vấn..."
                 className="group inline-flex items-center justify-center gap-3 border-2 border-white/80 hover:bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 transform hover:-translate-y-1"
               >
                 Tư vấn miễn phí
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </AuthRequiredButton>
             </div>

            {/* Social Proof */}
            <div className="pt-8">
              <p className="text-white/70 text-sm mb-4">Được đánh giá cao bởi:</p>
              <div className="flex items-center gap-8 opacity-60">
                <div className="h-8 w-20 bg-white/20 rounded"></div>
                <div className="h-8 w-20 bg-white/20 rounded"></div>
                <div className="h-8 w-20 bg-white/20 rounded"></div>
              </div>
            </div>
          </div>

          {/* Right Content - Image/Visual */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Image Container */}
              <div className="relative w-full max-w-lg">
                <div className="aspect-[4/3] bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-8">
                  {/* Placeholder for actual image */}
                  <div className="w-full h-full bg-white/10 rounded-2xl flex items-center justify-center">
                    <div className="text-center space-y-4">
                                             <div className="w-16 h-16 bg-cyan-300 rounded-full mx-auto flex items-center justify-center">
                         <TestTube className="w-8 h-8 text-blue-700" />
                       </div>
                      <p className="text-white font-medium">GenCare Platform</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-cyan-400 text-blue-800 px-4 py-2 rounded-lg font-semibold shadow-lg">
                  ✨ Mới
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold shadow-lg">
                  🏆 #1 Tin cậy
                </div>
              </div>

              {/* Background Glow */}
              <div className="absolute inset-0 bg-cyan-400/20 rounded-3xl blur-3xl -z-10 scale-110"></div>
            </div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-white/20">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">10K+</div>
            <div className="text-white/70">Khách hàng</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-white/70">Chuyên gia</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">99.9%</div>
            <div className="text-white/70">Độ chính xác</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">24/7</div>
            <div className="text-white/70">Hỗ trợ</div>
          </div>
                 </div>
       </div>

       {/* Scroll Down Indicator */}
       <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-float">
         <button
           onClick={scrollToNextSection}
           className="group flex flex-col items-center gap-3 text-white/90 hover:text-white transition-all duration-500 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg p-2"
           aria-label="Cuộn xuống để xem thêm thông tin"
         >
           {/* Text indicator */}
           <div className="flex flex-col items-center gap-1">
             <span className="text-sm font-medium tracking-wide opacity-90 group-hover:opacity-100 transition-opacity">
               Xem thêm
             </span>
             <div className="w-6 h-px bg-white/60 group-hover:bg-white transition-colors"></div>
           </div>
           
           {/* Double chevron with custom animation */}
           <div className="relative flex flex-col items-center animate-scroll-bounce">
             <div className="absolute inset-0 bg-white/10 rounded-full blur-xl scale-150 group-hover:scale-200 transition-transform duration-500"></div>
             <ChevronDown className="w-7 h-7 relative z-10 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg" />
             <ChevronDown className="w-7 h-7 -mt-4 relative z-10 opacity-50 group-hover:opacity-70 group-hover:scale-125 transition-all duration-300 delay-75 drop-shadow-lg" />
           </div>
         </button>
       </div>

              {/* Custom Styles */}
       <style>{`
         @keyframes blob {
           0% { transform: translate(0px, 0px) scale(1); }
           33% { transform: translate(30px, -50px) scale(1.1); }
           66% { transform: translate(-20px, 20px) scale(0.9); }
           100% { transform: translate(0px, 0px) scale(1); }
         }
         @keyframes scrollBounce {
           0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
           40% { transform: translateY(-8px); }
           60% { transform: translateY(-4px); }
         }
         @keyframes floatUpDown {
           0%, 100% { transform: translateY(0px); }
           50% { transform: translateY(-10px); }
         }
         .animate-blob {
           animation: blob 7s infinite;
         }
         .animate-scroll-bounce {
           animation: scrollBounce 2s infinite;
         }
         .animate-float {
           animation: floatUpDown 3s ease-in-out infinite;
         }
         .animation-delay-2000 {
           animation-delay: 2s;
         }
         .animation-delay-4000 {
           animation-delay: 4s;
         }
       `}</style>
     </section>
   );
 };

 export default Banner;