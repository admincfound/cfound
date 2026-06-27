'use client';
// CropModal.tsx — Professional photo cropper modal using react-easy-crop

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, RotateCw, RefreshCw, ZoomIn, ZoomOut, Crop } from 'lucide-react';
import type { CropArea } from './cropUtils';

interface CropModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

// Lazy import getCroppedImg to avoid SSR issues
async function getCroppedImg(imageSrc: string, pixelCrop: CropArea, rotation: number): Promise<Blob> {
  const { getCroppedImg: _get } = await import("@/app/lib/cropUtils");
  return _get(imageSrc, pixelCrop, rotation);
}

export default function CropModal({ imageSrc, onCropComplete, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((c: { x: number; y: number }) => setCrop(c), []);
  const onZoomChange = useCallback((z: number) => setZoom(z), []);

  const onCropAreaChange = useCallback(
    (_: unknown, pixels: CropArea) => setCroppedAreaPixels(pixels),
    []
  );

  const handleRotateLeft = () => setRotation((r) => r - 90);
  const handleRotateRight = () => setRotation((r) => r + 90);
  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleCropAndUpload = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(blob);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="crop-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      >
        {/* Modal card */}
        <motion.div
          key="crop-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(15, 15, 25, 0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Crop size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px] leading-tight">Crop Profile Photo</h3>
                <p className="text-white/40 text-[11px]">Drag to reposition • Scroll to zoom</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          {/* Crop area */}
          <div className="relative w-full" style={{ height: 360 }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaChange}
              style={{
                containerStyle: { background: '#0a0a12' },
                cropAreaStyle: {
                  border: '2px solid rgba(59,130,246,0.8)',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                },
              }}
            />
          </div>

          {/* Controls */}
          <div className="px-6 py-5 space-y-4 border-t border-white/10">
            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <ZoomOut size={15} className="text-white/50 flex-shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3B82F6 ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.2) ${((zoom - 1) / 2) * 100}%)`,
                  accentColor: '#3B82F6',
                }}
              />
              <ZoomIn size={15} className="text-white/50 flex-shrink-0" />
              <span className="text-white/40 text-[11px] w-10 text-right tabular-nums">
                {zoom.toFixed(1)}×
              </span>
            </div>

            {/* Rotation + Reset buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRotateLeft}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-colors border border-white/10"
              >
                <RotateCcw size={13} />
                Rotate Left
              </button>
              <button
                onClick={handleRotateRight}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-colors border border-white/10"
              >
                <RotateCw size={13} />
                Rotate Right
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition-colors border border-white/10 ml-auto"
              >
                <RefreshCw size={13} />
                Reset
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl border border-white/15 text-white/70 hover:text-white hover:bg-white/8 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropAndUpload}
                disabled={processing}
                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crop size={15} />
                    Crop & Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}