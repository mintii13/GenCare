import React from 'react';
import logo from '../../../assets/logo/logo.png';

const GenCareLogo: React.FC<{className?: string}> = ({ className = '' }) => (
  <img
    src={logo}
    alt="GenCare Logo"
    className={`object-contain block ${className}`.trim()}
    style={{ maxHeight: '100%', maxWidth: '100%' }}
  />
);

export default GenCareLogo;