import { useState, useCallback, useEffect } from 'react';
import GlassButton from "./GlassButton";
import GlassContainer from "./GlassContainer";
import { GLASS_EFFECTS } from "../constants";

interface ScreenPermissionDialogProps {
  onPermissionGranted: (stream: MediaStream) => void;
  onClose: () => void;
}

export default function ScreenPermissionDialog({ onPermissionGranted, onClose }: ScreenPermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);

  // Handle different error scenarios
  const getErrorInfo = useCallback((err: unknown) => {
    if (!err) return { type: 'GENERAL', message: 'An unknown error occurred' };
    
    const error = err as Error;

    if (error.name === 'NotAllowedError') {
      return {
        type: 'PERMISSION_DENIED',
        message: 'Screen sharing permission was denied. Please allow screen sharing to continue.'
      };
    } else if (error.name === 'NotReadableError') {
      return {
        type: 'NOT_READABLE',
        message: 'Could not access the screen. Another application might be using it.'
      };
    } else if (error.name === 'AbortError') {
      return {
        type: 'ABORTED',
        message: 'Screen sharing was aborted. Please try again.'
      };
    } else if (error.message === 'NOT_SUPPORTED') {
      return {
        type: 'NOT_SUPPORTED',
        message: 'Screen sharing is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.'
      };
    }

    return {
      type: 'GENERAL',
      message: `Failed to access screen: ${error.message || 'Unknown error occurred'}`
    };
  }, []);

  const requestScreenAccess = useCallback(async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const mediaDevices = navigator.mediaDevices as typeof navigator.mediaDevices & { getDisplayMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream> };

      if (!mediaDevices || !mediaDevices.getDisplayMedia) {
        throw new Error('NOT_SUPPORTED');
      }

      const stream = await mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'browser',
          logicalSurface: true,
        },
        audio: false
      });

      onPermissionGranted(stream);
    } catch (err) {
      const errorInfo = getErrorInfo(err);
      setError(errorInfo);
      console.error('Error accessing screen:', err, errorInfo);
    } finally {
      setIsRequesting(false);
    }
  }, [getErrorInfo, onPermissionGranted]);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <GlassContainer 
        className="p-6 max-w-md w-full mx-4"
        bgColor={GLASS_EFFECTS.COLORS.DEFAULT_BG}
      >
        <h2 className="text-xl font-bold text-white mb-4">Screen Sharing Required</h2>
        
        <div className="mb-6">
          <p className="text-gray-200 mb-4">
            To analyze your screen, please allow screen sharing permissions when prompted by your browser.
          </p>
          
          {error && (
            <div className="bg-red-900 bg-opacity-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-100">{error.message}</p>
            </div>
          )}

          <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg mb-4">
            <h3 className="font-medium text-gray-200 mb-2">How to share your screen:</h3>
            <ol className="list-decimal list-inside text-gray-300 space-y-1 text-sm">
              <li>Click "Start Sharing" below</li>
              <li>Select the window or screen you want to share</li>
              <li>Click "Share" in the browser prompt</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <GlassButton
            onClick={onClose}
            disabled={isRequesting}
            className="px-4 py-2"
          >
            Cancel
          </GlassButton>
          <GlassButton
            onClick={requestScreenAccess}
            disabled={isRequesting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
          >
            {isRequesting ? 'Sharing...' : 'Start Sharing'}
          </GlassButton>
        </div>
      </GlassContainer>
    </div>
  );
}
