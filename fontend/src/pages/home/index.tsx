import React from "react";

const services = [
  { title: "Xét nghiệm STIs", desc: "Kiểm tra các bệnh lây truyền qua đường tình dục nhanh chóng, chính xác.", icon: "🧬" },
  { title: "Tư vấn sinh sản", desc: "Đội ngũ chuyên gia tư vấn sức khỏe sinh sản, kế hoạch hóa gia đình.", icon: "👩‍⚕️" },
  { title: "Khám tổng quát", desc: "Dịch vụ khám sức khỏe tổng quát định kỳ cho mọi lứa tuổi.", icon: "🩺" },
  { title: "Theo dõi chu kì kinh nguyệt", desc: "Hỗ trợ theo dõi, nhắc nhở và tư vấn về chu kì kinh nguyệt cho phụ nữ.", icon: "📅" },
];

const blogs = [
  { title: "5 điều cần biết về sức khỏe sinh sản", desc: "Những kiến thức cơ bản giúp bạn chủ động bảo vệ sức khỏe sinh sản.", link: "#" },
  { title: "Lợi ích của xét nghiệm định kỳ", desc: "Tại sao nên kiểm tra sức khỏe thường xuyên? Cùng GenCare tìm hiểu.", link: "#" },
  { title: "Dấu hiệu cảnh báo bệnh STIs", desc: "Nhận biết sớm các triệu chứng để điều trị kịp thời.", link: "#" },
];

export function HomePage() {
  return (
    <div className="bg-neutral-50">
      {/* Banner */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12 md:py-20">
        <div className="container mx-auto flex flex-col md:flex-row items-center px-4 gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">GenCare - Chăm sóc sức khỏe chủ động</h1>
            <p className="mb-6 text-lg md:text-xl">
              Địa chỉ tin cậy cho các dịch vụ xét nghiệm, tư vấn và chăm sóc sức khỏe toàn diện.
            </p>
            <a href="#about" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded shadow transition">
              Tìm hiểu thêm
            </a>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/images/homepage.jpg"
              alt="GenCare Banner"
              className="rounded-lg shadow-lg w-full max-w-xs md:max-w-md"
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="container mx-auto py-12 px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-primary-700">Về GenCare</h2>
            <p>
              GenCare là hệ thống cơ sở y tế hiện đại, cung cấp các dịch vụ xét nghiệm, tư vấn và chăm sóc sức khỏe toàn diện cho cộng đồng.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-primary-600">Sứ mệnh</h3>
            <p>
              Mang đến dịch vụ y tế chất lượng cao, giúp mọi người chủ động bảo vệ và nâng cao sức khỏe.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-primary-600">Giá trị cốt lõi</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Chính xác & Bảo mật</li>
              <li>Chuyên nghiệp & Tận tâm</li>
              <li>Đổi mới & Hiện đại</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-primary-700 mb-8">Dịch vụ nổi bật</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((s, idx) => (
              <div key={idx} className="bg-primary-50 rounded-lg p-6 shadow hover:shadow-lg transition">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-semibold text-lg text-primary-700 mb-2">{s.title}</h3>
                <p className="text-neutral-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="container mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-center text-primary-700 mb-8">Blog mới nhất</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((b, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6 flex flex-col">
              <h3 className="font-semibold text-lg text-primary-700 mb-2">{b.title}</h3>
              <p className="text-neutral-700 flex-1">{b.desc}</p>
              <a href={b.link} className="mt-4 inline-block text-accent-600 hover:underline font-medium">
                Xem chi tiết &rarr;
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
} 