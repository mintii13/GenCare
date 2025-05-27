import React from "react";

interface Service {
  title: string;
  desc: string;
  icon: string;
}

interface ServicesProps {
  title: string;
  services: Service[];
}

const Services: React.FC<ServicesProps> = ({ title, services }) => {
  return (
    <section id="services" className="bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-primary-700 mb-8">{title}</h2>
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
  );
};

export default Services; 