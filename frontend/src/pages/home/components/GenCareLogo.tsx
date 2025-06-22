import React from 'react';
import { TestTube } from 'lucide-react';

const GenCareLogo: React.FC<{className?: string}> = ({ className }) => (
  <div className={`w-10 h-10 bg-cyan-300 rounded-full flex items-center justify-center ${className || ''}`}>
    <TestTube className="w-6 h-6 text-blue-700" />
  </div>
);

export default GenCareLogo;