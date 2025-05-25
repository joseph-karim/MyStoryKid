import React from 'react';
import { 
  Circles, 
  Oval, 
  ThreeDots, 
  TailSpin, 
  Hearts,
  ColorRing,
  ProgressBar
} from 'react-loader-spinner';

/**
 * Loading Spinner Component
 * Provides various loading animations using react-loader-spinner
 */
const LoadingSpinner = ({ 
  type = 'Circles', 
  size = 80, 
  color = '#3B82F6', 
  secondaryColor = '#E5E7EB',
  visible = true,
  wrapperClass = '',
  wrapperStyle = {},
  ariaLabel = 'Loading...',
  timeout = 0
}) => {
  const commonProps = {
    visible,
    height: size,
    width: size,
    color,
    ariaLabel,
    wrapperStyle,
    wrapperClass,
    timeout
  };

  const renderSpinner = () => {
    switch (type) {
      case 'Circles':
        return <Circles {...commonProps} />;
      
      case 'Oval':
        return <Oval {...commonProps} secondaryColor={secondaryColor} strokeWidth={2} strokeWidthSecondary={2} />;
      
      case 'ThreeDots':
        return <ThreeDots {...commonProps} radius="9" />;
      
      case 'TailSpin':
        return <TailSpin {...commonProps} />;
      
      case 'Hearts':
        return <Hearts {...commonProps} />;
      
      case 'ColorRing':
        return <ColorRing {...commonProps} />;
      
      case 'ProgressBar':
        return <ProgressBar {...commonProps} borderColor={color} barColor={secondaryColor} />;
      
      default:
        return <Circles {...commonProps} />;
    }
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center">
      {renderSpinner()}
    </div>
  );
};

/**
 * Predefined spinner configurations for common use cases
 */
export const SpinnerPresets = {
  small: { size: 40 },
  medium: { size: 80 },
  large: { size: 120 },
  
  primary: { color: '#3B82F6', secondaryColor: '#E5E7EB' },
  success: { color: '#10B981', secondaryColor: '#D1FAE5' },
  warning: { color: '#F59E0B', secondaryColor: '#FEF3C7' },
  danger: { color: '#EF4444', secondaryColor: '#FEE2E2' },
  
  bookGeneration: { 
    type: 'Circles', 
    size: 100, 
    color: '#8B5CF6', 
    secondaryColor: '#EDE9FE' 
  },
  characterCreation: { 
    type: 'Hearts', 
    size: 80, 
    color: '#EC4899', 
    secondaryColor: '#FCE7F3' 
  },
  imageProcessing: { 
    type: 'ColorRing', 
    size: 80, 
    color: '#06B6D4', 
    secondaryColor: '#CFFAFE' 
  }
};

/**
 * Loading Overlay Component
 * Displays a loading spinner with optional message over content
 */
export const LoadingOverlay = ({ 
  isLoading, 
  message = 'Loading...', 
  spinnerProps = {},
  children,
  className = '',
  overlayClassName = 'bg-white bg-opacity-75'
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center z-50 ${overlayClassName}`}>
          <LoadingSpinner {...spinnerProps} />
          {message && (
            <p className="mt-4 text-sm text-gray-600 text-center max-w-xs">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Inline Loading Component
 * Displays a small spinner inline with text
 */
export const InlineLoading = ({ 
  message = 'Loading...', 
  spinnerProps = { type: 'ThreeDots', size: 24 },
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner {...spinnerProps} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

export default LoadingSpinner; 