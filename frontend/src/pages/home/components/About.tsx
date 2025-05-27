import React from "react";
import { Link } from "react-router-dom";

interface AboutProps {
  title: string;
  description: string;
  missionTitle: string;
  mission: string;
  valuesTitle: string;
  values: string[];
  linkText: string;
  linkTo: string;
}

const About: React.FC<AboutProps> = ({
  title,
  description,
  missionTitle,
  mission,
  valuesTitle,
  values,
  linkText,
  linkTo
}) => {
  return (
    <section id="about" className="container mx-auto py-12 px-4">
      <div className="grid md:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-primary-700">{title}</h2>
          <p>{description}</p>
          <Link to={linkTo} className="mt-4 inline-block text-accent-600 hover:underline font-medium">
            {linkText} &rarr;
          </Link>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-primary-600">{missionTitle}</h3>
          <p>{mission}</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-primary-600">{valuesTitle}</h3>
          <ul className="list-disc list-inside space-y-1">
            {values.map((value, index) => (
              <li key={index}>{value}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default About; 