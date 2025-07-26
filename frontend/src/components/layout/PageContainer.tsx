import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  /**
   * Top padding preset
   * - 'none': no top padding
   * - 'small': pt-4 sm:pt-6 lg:pt-8  
   * - 'medium': pt-6 sm:pt-8 lg:pt-12 (default)
   * - 'large': pt-8 sm:pt-12 lg:pt-16
   * - 'xl': pt-12 sm:pt-16 lg:pt-20
   */
  topPadding?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  /**
   * Bottom padding preset
   */
  bottomPadding?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  /**
   * Max width of container
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  /**
   * Background color
   */
  background?: 'white' | 'gray-50' | 'gray-100' | 'transparent';
  /**
   * Custom className
   */
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  topPadding = 'medium',
  bottomPadding = 'medium',
  maxWidth = '7xl',
  background = 'gray-50',
  className = ''
}) => {
  // Top padding classes - optimized for sticky header (h-14 = 56px)
  const topPaddingClasses = {
    none: '',
    small: 'pt-2 sm:pt-3 lg:pt-4',
    medium: 'pt-4 sm:pt-6 lg:pt-8', 
    large: 'pt-6 sm:pt-8 lg:pt-12',
    xl: 'pt-8 sm:pt-12 lg:pt-16'
  };

  // Bottom padding classes
  const bottomPaddingClasses = {
    none: '',
    small: 'pb-4 sm:pb-6 lg:pb-8',
    medium: 'pb-4 sm:pb-6 lg:pb-10',
    large: 'pb-8 sm:pb-12 lg:pb-16',
    xl: 'pb-12 sm:pb-16 lg:pb-20'
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  // Background classes
  const backgroundClasses = {
    white: 'bg-white',
    'gray-50': 'bg-gray-50',
    'gray-100': 'bg-gray-100',
    transparent: 'bg-transparent'
  };

  return (
    <div className={`min-h-screen ${backgroundClasses[background]}`}>
      <div className={`
        ${maxWidthClasses[maxWidth]} 
        mx-auto 
        px-4 sm:px-6 lg:px-8 
        ${topPaddingClasses[topPadding]} 
        ${bottomPaddingClasses[bottomPadding]}
        ${className}
      `}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer; 