import React from 'react';
import { 
  CircleLoader, 
  ClipLoader, 
  BeatLoader, 
  ClimbingBoxLoader, 
  HashLoader,
  RingLoader,
  BarLoader
} from 'react-spinners';

/**
 * Loading Spinner Component
 * Provides various loading animations using react-loader-spinner
 */
const LoadingSpinner = ({ 
  type = 'CircleLoader', 
  size = 80, 
  color = '#3B82F6', 
  secondaryColor = '#E5E7EB',
  loading = true,
  cssOverride = {},
  ariaLabel = 'Loading...'
}) => {
  const commonProps = {
    loading,
    size,
    color,
    cssOverride: { ...cssOverride, display: 'block', margin: '0 auto' },
    'aria-label': ariaLabel
  };

  const renderSpinner = () => {
    switch (type) {
      case 'CircleLoader':
        return <CircleLoader {...commonProps} />;
      
      case 'ClipLoader':
        return <ClipLoader {...commonProps} />;
      
      case 'BeatLoader':
        return <BeatLoader {...commonProps} />;
      
      case 'ClimbingBoxLoader':
        return <ClimbingBoxLoader {...commonProps} />;
      
      case 'HashLoader':
        return <HashLoader {...commonProps} />;
      
      case 'RingLoader':
        return <RingLoader {...commonProps} />;
      
      case 'BarLoader':
        return <BarLoader {...commonProps} width={size * 2} height={size / 10} />;
      
      default:
        return <CircleLoader {...commonProps} />;
    }
  };

  if (!loading) return null;

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
  
  primary: { color: '#3B82F6' },
  success: { color: '#10B981' },
  warning: { color: '#F59E0B' },
  danger: { color: '#EF4444' },
  
  bookGeneration: { 
    type: 'CircleLoader', 
    size: 100, 
    color: '#8B5CF6'
  },
  characterCreation: { 
    type: 'HashLoader', 
    size: 80, 
    color: '#EC4899'
  },
  imageProcessing: { 
    type: 'RingLoader', 
    size: 80, 
    color: '#06B6D4'
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
          <LoadingSpinner loading={true} {...spinnerProps} />
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
  spinnerProps = { type: 'BeatLoader', size: 24 },
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner loading={true} {...spinnerProps} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

export default LoadingSpinner; 