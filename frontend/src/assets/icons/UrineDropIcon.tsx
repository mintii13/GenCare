import * as React from 'react';

const UrineDropIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={48}
    height={48}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="urineGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe259" />
        <stop offset="100%" stopColor="#ffa751" />
      </linearGradient>
    </defs>
    <path
      d="M24 4C24 4 10 22 10 32C10 39.1797 16.8203 46 24 46C31.1797 46 38 39.1797 38 32C38 22 24 4 24 4Z"
      fill="url(#urineGradient)"
      stroke="#eab308"
      strokeWidth={2}
    />
    <ellipse cx="24" cy="36" rx="7" ry="4" fill="#fff" fillOpacity={0.18} />
  </svg>
);

export default UrineDropIcon; 