import React from "react";

interface Note {
  text: string;
}

interface ImportantNotesProps {
  title: string;
  notes: Note[];
}

const ImportantNotes: React.FC<ImportantNotesProps> = ({ title, notes }) => {
  return (
    <section className="container mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">{title}</h2>
        <ul className="space-y-4">
          {notes.map((note, index) => (
            <li key={index} className="flex items-start">
              <span className="text-accent-600 mr-2">•</span>
              <p>{note.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ImportantNotes; 