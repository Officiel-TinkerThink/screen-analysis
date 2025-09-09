import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import axios from 'axios';

interface VLMContextType {
  isLoaded: boolean;
  runInference: (video: HTMLVideoElement, prompt: string, onCaptionUpdate: (caption: string) => void) => Promise<string | null>;
}

const VLMContext = createContext<VLMContextType | undefined>(undefined);

export const useVLMContext = () => {
  const context = useContext(VLMContext);
  if (!context) {
    throw new Error('useVLMContext must be used within a VLMProvider');
  }
  return context;
};

interface VLMProviderProps {
  children: ReactNode;
}

export const VLMProvider = ({ children }: VLMProviderProps) => {
  const [isLoaded, setIsLoaded] = useState(true); // Always loaded for server-side inference

  const runInference = useCallback(async (video: HTMLVideoElement, prompt: string, onCaptionUpdate: (caption: string) => void): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          return reject(new Error('Failed to create blob from canvas'));
        }

        const formData = new FormData();
        formData.append('file', blob, 'frame.png');
        formData.append('prompt', prompt);
        formData.append('backend', 'fastvlm');

        try {
          const response = await axios.post('/api/analyze/file', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          const caption = response.data.analysis;
          onCaptionUpdate(caption);
          resolve(caption);
        } catch (error) {
          console.error('Error during inference:', error);
          reject(error);
        }
      }, 'image/png');
    });
  }, []);

  const value = {
    isLoaded,
    runInference,
  };

  return <VLMContext.Provider value={value}>{children}</VLMContext.Provider>;
};