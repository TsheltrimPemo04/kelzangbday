import PixelAnimator from "./PixelAnimator";
import cake1 from "./assets/cake1.png";
import cake2 from "./assets/cake2.png";
import cake3 from "./assets/cake3.png";
import cake100 from "./assets/100.png";
import cake80 from "./assets/80.png";
import cake60 from "./assets/60.png";
import cake40 from "./assets/40.png";
import cake20 from "./assets/20.png";
import birthdayText from "./assets/birthdaytext.png";
import "./App.css";
import Confetti from "./Confetti";
import { useEffect, useRef, useState, useCallback } from "react";
import birthdaySong from "./assets/bdayaudo.mp3";
import kelz1 from "./assets/kelz1.jpeg";
import kelz2 from "./assets/kelz2.jpeg";
import kelz3 from "./assets/kelz3.jpeg";
import kelz4 from "./assets/kelz4.jpeg";
import kelz5 from "./assets/kelz5.jpeg";
import kelz6 from "./assets/kelz6.jpeg";
import kelz7 from "./assets/kelz7.jpeg";
import kelz8 from "./assets/kelz8.jpeg";
import kelz9 from "./assets/kelz9.jpeg";
import kelz10 from "./assets/kelz10.jpeg";

const kelzImages = [
  kelz1, kelz2, kelz3, kelz4, kelz5,
  kelz6, kelz7, kelz8, kelz9, kelz10,
];

export default function App() {
  const audioRef = useRef(null);
  const [staticFrame, setStaticFrame] = useState(null);
  const [showKelz, setShowKelz] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const rafRef = useRef(null);

  // --- Autoplay Background Song ---
  useEffect(() => {
    const playAudio = async () => {
      try { await audioRef.current.play(); }
      catch (err) { console.log("Autoplay blocked:", err); }
    };
    playAudio();
  }, []);

  // --- Function wrapped with useCallback (IMPORTANT FIX) ---
  const startMicMonitoring = useCallback(async () => {
    if (micStreamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 3.0;
      gainNodeRef.current = gainNode;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      source.connect(gainNode);
      gainNode.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const loop = () => {
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);

        const frames = pickStaticFrame(rms);
        setStaticFrame(prev => prev === frames ? prev : frames);

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);

    } catch (err) {
      console.warn("Mic Permission Denied:", err);
    }
  }, []);

  // --- Start mic monitoring on page load ---
  useEffect(() => {
    startMicMonitoring();
    return () => stopMicMonitoring();
  }, [startMicMonitoring]);

  const handleCakeClick = () => audioRef.current.play();

  // --- Image Slideshow ---
  useEffect(() => {
    if (!showKelz) return;
    const timer = setInterval(() => {
      setPhotoIndex((idx) => (idx + 1) % kelzImages.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [showKelz]);

  // --- Fireworks trigger ---
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (staticFrame === cake20) {
      stopMicMonitoring(false);
      setCelebrating(true);
    }
  }, [staticFrame]);

  // --- Map mic volume to cake image ---
  const pickStaticFrame = (rms) => {
    if (rms < 0.02) return null;
    if (rms >= 0.30) return cake20;
    if (rms >= 0.22) return cake40;
    if (rms >= 0.15) return cake60;
    if (rms >= 0.08) return cake80;
    return cake100;
  };

  // --- Stop mic ---
  const stopMicMonitoring = (reset = true) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;

    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (reset) setStaticFrame(null);
  };

  return (
    <div className="App">
      <audio ref={audioRef} src={birthdaySong} loop />

      <img src={birthdayText} alt="Happy Birthday" className="birthdayText" draggable={false} />

      <div className="cakeLoop">
        <PixelAnimator
          className="cake"
          frames={staticFrame ? [staticFrame] : [cake1, cake2, cake3]}
          fps={3}
          scale={4}
          mode="img"
          onClick={handleCakeClick}
          tabIndex={0}
        />
      </div>

      {celebrating && (
        <Confetti
          pieces={48}
          duration={8000}
          onDone={() => {
            setCelebrating(false);
            setTimeout(() => {
              setPhotoIndex(0);
              setShowKelz(true);
            }, 250);
          }}
        />
      )}

      {showKelz && (
        <div className="kelz-overlay" role="dialog" tabIndex={-1}>
          <div className="kelz-banner kelz-banner-top">Wish you a happy 21st</div>
          <div className="kelz-card">
            <img className="kelz-photo" src={kelzImages[photoIndex]} alt="Kelz" />
          </div>
          <div className="kelz-banner kelz-banner-bottom">December 3rd 2025</div>
        </div>
      )}
    </div>
  );
}