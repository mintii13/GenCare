import * as React from 'react';

const SwabIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={48}
    height={48}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g>
      <rect x="18" y="32" width="12" height="8" rx="2" fill="#6366f1" />
      <rect x="22" y="8" width="4" height="20" rx="2" fill="#818cf8" />
      <ellipse cx="24" cy="8" rx="4" ry="4" fill="#a5b4fc" />
      <rect x="14" y="40" width="20" height="4" rx="2" fill="#6366f1" />
    </g>
  </svg>
);

export default SwabIcon; 