
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Scene from './components/Scene';
import HandTracker from './components/HandTracker';
import UIOverlay from './components/UIOverlay';
import { GestureType, HandData, PhotoData } from './types';

const App: React.FC = () => {
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  const [handData, setHandData] = useState<HandData>({
    gesture: GestureType.NONE,
    x: 0.5,
    y: 0.5,
    z: 0,
    velocity: { x: 0, y: 0 },
    rawLandmarks: null
  });

  const prevHandY = useRef<number>(0.5);
  const lastToggleTime = useRef<number>(0);

  const handleHandData = useCallback((data: HandData) => {
    setHandData(data);
    const now = Date.now();
    const isRapidDown = (data.y - prevHandY.current) > 0.08;
    
    if (data.gesture === GestureType.CLOSED && isRapidDown && now - lastToggleTime.current > 1000) {
      setIsPowerOn(prev => !prev);
      lastToggleTime.current = now;
    }
    prevHandY.current = data.y;
  }, []);

  useEffect(() => {
    if (!audioUrl) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    audio.loop = true;
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    audioRef.current = audio;
    analyzerRef.current = analyzer;

    const updateAudioData = () => {
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      setAudioData(dataArray);
      animationFrameRef.current = requestAnimationFrame(updateAudioData);
    };

    if (isPlaying) {
      audio.play();
      updateAudioData();
    }

    return () => {
      audio.pause();
      cancelAnimationFrame(animationFrameRef.current);
      audioContext.close();
    };
  }, [audioUrl, isPlaying]);

  const toggleMusic = () => {
    if (!audioUrl) return;
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full h-screen bg-[#010102] text-white overflow-hidden select-none">
      <Scene 
        isPowerOn={isPowerOn} 
        handData={handData} 
        audioData={audioData} 
        photos={photos}
      />

      <HandTracker onHandData={handleHandData} />

      <UIOverlay 
        isPowerOn={isPowerOn} 
        handData={handData} 
        isConfigOpen={isConfigOpen}
        setIsConfigOpen={setIsConfigOpen}
        isPlaying={isPlaying}
        onToggleMusic={toggleMusic}
        onUploadMusic={(url) => { setAudioUrl(url); setIsPlaying(true); }}
        onUploadPhoto={(urls) => {
          const newPhotos = urls.map(url => ({ id: Math.random().toString(), url }));
          setPhotos(prev => [...prev, ...newPhotos].slice(-50)); // Keep last 50
        }}
      />
    </div>
  );
};

export default App;
