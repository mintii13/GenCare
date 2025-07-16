import React from 'react';
import logo from '../../../assets/logo/logo.png';

const GenCareLogo: React.FC<{className?: string}> = ({ className }) => (
  <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden ${className || ''}`}>
    <img src={logo} alt="GenCare Logo" className="w-14 h-14 object-contain" />
  </div>
);

export default GenCareLogo;