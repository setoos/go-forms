import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 'flat' | 'low' | 'medium' | 'high';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  elevation = 'medium',
  padding = 'medium',
  onClick
}) => {
  const elevationStyles = {
    flat: 'border border-gray-200',
    low: 'border border-gray-200 shadow-sm',
    medium: 'border border-gray-200 shadow-md',
    high: 'border border-gray-200 shadow-lg'
  };
  
  const paddingStyles = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-5',
    large: 'p-8'
  };
  
  const cursorStyle = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : '';
  
  return (
    <div 
      className={`bg-white rounded-xl ${elevationStyles[elevation]} ${paddingStyles[padding]} ${cursorStyle} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;