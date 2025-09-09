import { useState, useCallback } from "react";
import LoadingScreen from "./components/LoadingScreen";
import CaptioningView from "./components/CaptioningView";
import WelcomeScreen from "./components/WelcomeScreen";
import ScreenPermissionDialog from "./components/ScreenPermissionDialog";
import type { AppState } from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState>("requesting-permission");
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const handlePermissionGranted = useCallback((stream: MediaStream) => {
    setScreenStream(stream);
    setAppState("welcome");
  }, []);

  const handleStart = useCallback(() => {
    setAppState("loading");
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setAppState("captioning");
  }, []);

  return (
    <div className="App relative h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gray-900" />

      {appState !== "captioning" && <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" />}

      {appState === "requesting-permission" && <ScreenPermissionDialog onPermissionGranted={handlePermissionGranted} />}

      {appState === "welcome" && <WelcomeScreen onStart={handleStart} />}

      {appState === "loading" && <LoadingScreen onComplete={handleLoadingComplete} />}

      {appState === "captioning" && screenStream && <CaptioningView screenStream={screenStream} />}
    </div>
  );
}
