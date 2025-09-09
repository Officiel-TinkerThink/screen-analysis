import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
    const image = canvas.toDataURL('image/jpeg').split(',')[1]; // Get base64 part

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          prompt,
          backend: 'fastvlm',
          stream: true,
        }),
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullCaption = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6);
            if (jsonStr.trim()) {
              try {
                const data = JSON.parse(jsonStr);
                if (data.analysis) {
                  fullCaption += data.analysis;
                  onCaptionUpdate(fullCaption);
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Failed to parse JSON from stream:', jsonStr);
              }
            }
          }
        }
      }
      return fullCaption;
    } catch (error) {
      console.error('Error during streaming inference:', error);
      throw error;
    }
  }, []);

  const value = {
    isLoaded,
    runInference,
  };

  return <VLMContext.Provider value={value}>{children}</VLMContext.Provider>;
};
