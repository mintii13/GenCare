import React from "react";

interface BlogPost {
  title: string;
  desc: string;
  link: string;
}

interface BlogProps {
  title: string;
  blogs: BlogPost[];
}

const Blog: React.FC<BlogProps> = ({ title, blogs }) => {
  return (
    <section id="blog" className="container mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold text-center text-primary-700 mb-8">{title}</h2>
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
  );
};

export default Blog; 