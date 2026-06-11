/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Play, CloudUpload, ShieldCheck, Loader2, Download, RotateCcw, X, Sparkles, Share2, Info } from 'lucide-react';
import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import heroBg from './assets/estadio copa.jpg';

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showIntroModal, setShowIntroModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vamos_intro_seen') !== 'true';
    }
    return true;
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const closeIntroModal = () => {
    if (dontShowAgain) {
      localStorage.setItem('vamos_intro_seen', 'true');
    }
    setShowIntroModal(false);
  };

  useEffect(() => {
    if (showIntroModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showIntroModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeIntroModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dontShowAgain]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImage(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server error response:", text);
        let errorMessage = "Failed to generate image";
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server returned non-JSON error: ${text.slice(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Fal.ai gemini result structure usually has images array
      if (data.images && data.images.length > 0) {
        setResultImage(data.images[0].url);
      } else if (data.image && data.image.url) {
        setResultImage(data.image.url);
      } else {
        throw new Error('No image was returned from the AI');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setResultImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div id="main-container" className="bg-background text-on-background font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen overflow-x-hidden">
      <AnimatePresence>
        {showIntroModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeIntroModal}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="hero-gradient text-on-background rounded-2xl max-w-3xl w-full border border-white/60 shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={closeIntroModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 text-on-surface-variant hover:text-on-surface transition-colors z-10 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable Container */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 pr-6">
                  <h2 className="text-3xl sm:text-4xl font-normal font-display tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)] text-primary glimmer-text">
                    VAMOS POR LA CUARTA
                  </h2>
                  <p className="text-sm text-on-surface-variant font-medium">
                    Subí tu foto y empezá a alentar al campeón
                  </p>
                </div>

                {/* Video Section */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-white/60 bg-slate-950">
                  <video
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Instructions Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-white/60 border border-white/40 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <CloudUpload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-on-surface">1. Subí tu foto</h4>
                      <p className="text-xs text-on-surface-variant">
                        Una selfie clara y de frente para lograr el mejor parecido.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-white/60 border border-white/40 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-on-surface">2. Procesá con IA</h4>
                      <p className="text-xs text-on-surface-variant">
                        Nuestra IA te vestirá y ambientará como un verdadero campeón.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-white/60 border border-white/40 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-on-surface">3. Compartí la gloria</h4>
                      <p className="text-xs text-on-surface-variant">
                        Descargá tu retrato y compartilo en redes para alentar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-white/40 border-t border-primary/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <label className="flex items-center gap-3 text-sm text-on-surface-variant cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-primary/20 bg-white text-primary focus:ring-primary focus:ring-offset-white cursor-pointer"
                  />
                  No volver a mostrar
                </label>
                <button
                  onClick={closeIntroModal}
                  className="primary-gradient-bg text-on-primary font-bold px-8 py-3 rounded-lg shadow-lg hover:shadow-primary/30 active:scale-95 transition-all w-full sm:w-auto cursor-pointer text-center"
                >
                  ¡Comenzar ahora!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <main>
        {/* Top Third: Hero Section */}
        <section id="hero" className="relative min-h-[45vh] sm:min-h-[55vh] flex items-center hero-gradient pt-16 sm:pt-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-10"></div>
          <div className="absolute inset-0 opacity-30 z-0">
            <img 
              alt="Hero background with stadium-inspired gradient" 
              className="w-full h-full object-cover" 
              src={heroBg}
            />
          </div>
          <motion.div 
            className="max-w-7xl mx-auto px-6 text-center w-full relative z-20"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 
              variants={itemVariants}
              className="text-5xl sm:text-6xl md:text-7xl font-normal font-display mb-6 tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] glimmer-text leading-tight"
              style={{ fontSize: 'clamp(5.25rem, 14vw, 9.625rem)', transform: 'translateY(-8%)' }}
            >
              VAMOS POR LA CUARTA
            </motion.h1>
          </motion.div>
        </section>

        {/* Upload/Result Interface */}
        <section id="upload-section" className="relative min-h-[80vh] flex flex-col hero-gradient border-t border-white/20">
          <div className="flex-grow flex items-center justify-center py-16 sm:py-20 px-6">
            <div className="max-w-4xl mx-auto w-full">
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="glass-card border border-white/60 rounded-[1.5rem] p-12 shadow-xl text-center space-y-6"
                  >
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <motion.div 
                        className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <Loader2 className="w-12 h-12" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold font-headline text-primary">Procesando tu camino...</h3>
                      <p className="text-on-surface-variant">Estamos creando tu retrato legendario con IA.</p>
                      <div className="h-1 w-48 bg-primary/20 mx-auto rounded-full mt-4 overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card border border-white/60 rounded-[1.5rem] p-6 shadow-2xl space-y-6"
                  >
                    <div className="text-center">
                      <h3 className="text-3xl font-black font-headline text-primary mb-2">¡EL CAMPEÓN ESTÁ AQUÍ!</h3>
                      <p className="text-on-surface-variant">Tu retrato del camino a la cuarta estrella.</p>
                    </div>
                    <div className="relative group rounded-xl overflow-hidden shadow-inner bg-black/5">
                      <img 
                        src={resultImage} 
                        alt="AI Generated Champion" 
                        className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                        <a 
                          href={resultImage} 
                          download="campeon.png"
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white text-primary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-fixed transition-colors"
                        >
                          <Download className="w-4 h-4" /> Descargar
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={reset}
                        className="flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-bold px-8 py-3 rounded-lg hover:bg-primary/5 transition-all"
                      >
                        <RotateCcw className="w-5 h-5" /> Intentar con otra
                      </button>
                      <button 
                        className="primary-gradient-bg text-on-primary font-bold px-10 py-3 rounded-lg shadow-lg hover:shadow-primary/30 active:scale-95 transition-all"
                        onClick={() => window.open(`https://twitter.com/intent/tweet?text=Mirá mi retrato para el camino a la cuarta estrella! 🇦🇷&url=${encodeURIComponent(resultImage)}`, '_blank')}
                      >
                        Compartir en redes
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>
                    <div className="relative glass-card border border-white/60 rounded-[1.5rem] p-8 shadow-xl">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold font-headline text-primary">Sumate a alentar al campeón</h3>
                      </div>
                      
                      {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-3">
                          <span className="font-bold">Error:</span> {error}
                        </div>
                      )}

                      <div 
                        id="dropzone"
                        className="border-2 border-dashed border-primary/20 rounded-xl bg-white p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-white/80 cursor-pointer group/upload"
                        onClick={handleUploadClick}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/jpeg,image/png"
                          onChange={handleFileChange}
                        />
                        <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 transition-transform">
                          <CloudUpload className="text-primary w-8 h-8" />
                        </div>
                        <button className="primary-gradient-bg text-on-primary font-bold px-8 py-3 rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto">
                          Subí tu foto
                        </button>
                      </div>
                      <div className="mt-6 flex items-center gap-3 text-xs text-on-surface-variant justify-center">
                      </div>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Lowered Mockup Video removed per request */}

          <footer id="main-footer" className="w-full py-12 border-t border-primary/10 mt-auto">
            <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-4">
              <div className="mb-4 md:mb-0">
                <div className="font-headline font-black text-primary text-xl">Vamos por la cuarta</div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-on-surface-variant font-body text-sm">
                <button
                  onClick={() => setShowIntroModal(true)}
                  className="hover:text-primary transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  Cómo funciona
                </button>
                <span className="hidden sm:inline opacity-30">|</span>
                <span>© 2024 Vamos por la cuarta. Hecho para los campeones.</span>
              </div>
            </div>
          </footer>
      </main>
    </div>
  );
}


