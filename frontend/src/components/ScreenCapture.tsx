import { memo } from "react";
import GlassContainer from "./GlassContainer";
import React from "react";

interface ScreenCaptureProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  error: string | null;
}

const ScreenCapture = memo(({ isRunning, onToggleRunning, error }: ScreenCaptureProps) => {
  return (
    <div className="absolute top-4 left-4">
      <GlassContainer className="p-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleRunning}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            {isRunning ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 5h10v10H5z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 5l10 5-10 5z" />
              </svg>
            )}
          </button>
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <p className="text-sm font-medium">Live</p>
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </GlassContainer>
    </div>
  );
});

export default ScreenCapture;