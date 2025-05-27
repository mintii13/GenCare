import React from "react";
import { Link } from "react-router-dom";

interface BannerProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  imageUrl: string;
  imageAlt: string;
}

const Banner: React.FC<BannerProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  imageUrl,
  imageAlt
}) => {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12 md:py-20">
      <div className="container mx-auto flex flex-col md:flex-row items-center px-4 gap-8">
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{title}</h1>
          <p className="mb-6 text-lg md:text-xl">
            {description}
          </p>
          <Link to={buttonLink} className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 rounded shadow transition">
            {buttonText}
          </Link>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="rounded-lg shadow-lg w-full max-w-xs md:max-w-md"
          />
        </div>
      </div>
    </section>
  );
};

export default Banner; 