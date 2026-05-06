import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Square, RefreshCcw, Activity, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

const App = () => {
  // --- State Management ---
  const [isRecording, setIsRecording] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [healthStatus, setHealthStatus] = useState('idle'); // 'idle', 'healthy', 'fault'
  const [baselineData, setBaselineData] = useState(null);
  const [currentDeviation, setCurrentDeviation] = useState(0);
  const [threshold, setThreshold] = useState(2500); // Initial empirical threshold
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Audio Refs ---
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Core Calculus: Fourier Analysis & Deviation ---
  const calculateDeviation = (currentFrequencies, baselineFrequencies) => {
    if (!baselineFrequencies) return 0;
    
    let sumSquaredError = 0;
    // We compare frequency bins (N-th partial sums)
    // In audio engineering, we focus on the higher frequencies for mechanical wear
    for (let i = 0; i < currentFrequencies.length; i++) {
      const diff = currentFrequencies[i] - baselineFrequencies[i];
      sumSquaredError += diff * diff;
    }
    
    // Normalize by the number of bins
    return Math.sqrt(sumSquaredError / currentFrequencies.length);
  };

  const startAudio = async (mode = 'monitor') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Wake up the audioContext incase it was suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // FFT Size: High resolution for detecting specific harmonic shifts
      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);

      setIsRecording(true);
      setErrorMsg(null);

      if (mode === 'calibrate') {
        runCalibration();
      } else {
        runMonitoring();
      }
    } catch (err) {
      setErrorMsg("Microphone access denied. Please allow mic access to use PumpSense.");
    }
  };

  const runCalibration = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let samples = [];
    let startTime = Date.now();

    const capture = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      samples.push(new Uint8Array(dataArray));

      // Record for 3 seconds to get a stable baseline
      if (Date.now() - startTime < 3000) {
        animationFrameRef.current = requestAnimationFrame(capture);
        drawWaveform(dataArray);
      } else {
        // Average the samples to create a "Pure" baseline
        const avgBaseline = new Float32Array(dataArray.length);
        for (let i = 0; i < dataArray.length; i++) {
          const sum = samples.reduce((acc, curr) => acc + curr[i], 0);
          avgBaseline[i] = sum / samples.length;
        }
        setBaselineData(avgBaseline);
        setIsCalibrated(true);
        stopAudio();
      }
    };
    capture();
  };

  const runMonitoring = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const monitor = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      
      if (baselineData) {
        const deviation = calculateDeviation(dataArray, baselineData);
        setCurrentDeviation(deviation);
        
        // Threshold check: Green/Red Light Logic
        if (deviation > threshold) {
          setHealthStatus('fault');
        } else {
          setHealthStatus('healthy');
        }
      }

      drawWaveform(dataArray);
      animationFrameRef.current = requestAnimationFrame(monitor);
    };
    monitor();
  };

  const stopAudio = () => {
    setIsRecording(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.suspend();
    setHealthStatus('idle');
  };

  const drawWaveform = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = healthStatus === 'fault' ? '#ef4444' : '#10b981';
    ctx.lineWidth = 2;

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 255.0;
      const y = height - (v * height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
  };

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 font-sans">
      
      {/* Header */}
      <header className="w-full max-w-md flex flex-col items-center mb-10 text-center">
        <div className="bg-emerald-500/10 p-3 rounded-full mb-4">
          <Activity className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">PumpSense</h1>
        <p className="text-slate-400 mt-2">Acoustic Health Monitoring for Irrigation</p>
      </header>

      {/* Main Status Display */}
      <main className="w-full max-w-md bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        
        {/* The "Light" Indicator */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${
            !isCalibrated ? 'bg-slate-800 animate-pulse' :
            healthStatus === 'fault' ? 'bg-red-500 shadow-red-500/50' :
            healthStatus === 'healthy' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-800'
          }`}>
            {healthStatus === 'fault' ? (
              <AlertTriangle className="w-16 h-16 text-white" />
            ) : isCalibrated ? (
              <ShieldCheck className="w-16 h-16 text-white" />
            ) : (
              <Activity className="w-16 h-16 text-slate-600" />
            )}
          </div>
          
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold">
              {!isCalibrated ? "Pending Calibration" : 
               healthStatus === 'fault' ? "MECHANICAL FAULT" : 
               healthStatus === 'healthy' ? "System Healthy" : "Ready to Monitor"}
            </h2>
            <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-mono">
               {isRecording ? "Live Analysis Active" : "Standby"}
            </p>
          </div>
        </div>

        {/* Real-time Spectrum Visualization */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs text-slate-500 font-mono">FOURIER SPECTRUM (PSD)</span>
            <span className="text-xs font-mono text-emerald-500">
              Dev: {currentDeviation.toFixed(1)}
            </span>
          </div>
          <div className="bg-black/40 rounded-xl overflow-hidden border border-slate-800">
            <canvas ref={canvasRef} width={400} height={120} className="w-full block" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 gap-3">
          {!isCalibrated ? (
            <button 
              onClick={() => startAudio('calibrate')}
              disabled={isRecording}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
            >
              <RefreshCcw className={`w-5 h-5 ${isRecording ? 'animate-spin' : ''}`} />
              {isRecording ? "Capturing Baseline..." : "Step 1: Set Baseline"}
            </button>
          ) : (
            <>
              {isRecording ? (
                <button 
                  onClick={stopAudio}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Stop Monitoring
                </button>
              ) : (
                <button 
                  onClick={() => startAudio('monitor')}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Live Check
                </button>
              )}
              <button 
                onClick={() => { setBaselineData(null); setIsCalibrated(false); stopAudio(); }}
                className="text-slate-500 text-sm hover:text-slate-300 py-2 flex items-center justify-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" />
                Reset Calibration
              </button>
            </>
          )}
        </div>
        
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-xs text-center flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </main>

      {/* Info Card */}
      <section className="w-full max-w-md mt-10">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-900/10 border border-emerald-900/20">
          <Info className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
          <div className="text-sm">
            <h3 className="font-semibold text-emerald-400">How it works</h3>
            <p className="text-slate-400 mt-1 leading-relaxed">
              PumpSense records the <strong>Fourier coefficients</strong> of your pump. Any mechanical change shifts the <strong>partial sums</strong> of the sound wave, allowing us to detect faults before they cause permanent damage.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-8 text-slate-600 text-xs">
        &copy; 2026 PumpSense Engineering • MUST Integral Calculus Project
      </footer>
    </div>
  );
};

export default App;