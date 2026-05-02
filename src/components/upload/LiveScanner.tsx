"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface LiveScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export default function LiveScanner({ onCapture, onClose }: LiveScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Failed to access camera. Please check your permissions.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  function handleCapture() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to high-quality JPEG
    const base64Image = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(base64Image);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-gray-900 shadow-2xl relative">
        <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Camera className="h-4 w-4" /> Scan Invoice
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full bg-black">
          {error ? (
            <div className="flex h-full w-full items-center justify-center p-6 text-center text-red-400">
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          )}

          {/* Hidden canvas for capturing the frame */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanning Frame Overlay */}
          {!error && (
            <div className="absolute inset-0 pointer-events-none p-6">
              <div className="w-full h-full border-2 border-white/20 rounded-xl relative">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-lg -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-lg -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-lg -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-lg -mb-1 -mr-1"></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-6 text-center border-t border-white/10">
          <button
            onClick={handleCapture}
            disabled={!!error}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-teal-500 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-teal-400 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Camera className="h-5 w-5" />
            Capture Invoice
          </button>
          <p className="mt-3 text-xs text-gray-400">Position the entire invoice inside the frame</p>
        </div>
      </div>
    </div>
  );
}
