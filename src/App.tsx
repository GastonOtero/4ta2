/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { Play, CloudUpload, ShieldCheck, Loader2, Download, RotateCcw } from 'lucide-react';
import React, { useState, useRef, ChangeEvent } from 'react';
import heroBg from './assets/estadio copa.jpg';

export default function App() {
  const [isHovered, setIsHovered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', transform: 'translateY(-8%)' }}
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
                        className="border-2 border-dashed border-primary/20 rounded-xl bg-white/30 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-white/80 cursor-pointer group/upload"
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
                        <p className="text-on-surface font-semibold mb-1">Subí tu foto</p>
                        <p className="text-xs text-on-surface-variant mb-6"></p>
                        <button className="primary-gradient-bg text-on-primary font-bold px-8 py-3 rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto">
                          Seleccionar Archivo
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

        {/* Lowered Mockup Video */}
        {!resultImage && (
          <section id="video-section" className="relative min-h-[60vh] flex items-center bg-white sun-of-may-bg py-16 sm:py-24">
            <div className="max-w-5xl mx-auto px-6 w-full">
              <motion.div 
                id="video-player"
                className="relative w-full aspect-video bg-surface-container rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/30 flex items-center justify-center group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
                <img 
                  alt="Stadium atmosphere background for video" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXioJ29dRu_tItqcGH7wwuTN7a2qWIdvtSVAdIZ35-PRL9KPBRQ9yVBhqaKayN-1GG8g263Z56A4mynJqKpJWlxC0YKR7LzLSRPMPckXvUrPwWC2FfGeMhw8ySIgalawkB0JkBF7W6WJmB6vOdpfU6v2MeYiMN8P1kg4R5Sl06o52jjfP-y0Pz5z4G7soNMQVCl7QavJxPRX-V3LwOn4SnnnA8iZjQc94520xccQEJQKPQi4-_gPXsctAAl4uxmjTvMCYM6B-Q5wxm" 
                  referrerPolicy="no-referrer"
                />
                <motion.div 
                  className="relative z-10 w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl"
                  animate={{ scale: isHovered ? 1.1 : 1 }}
                >
                  <Play className="text-primary w-10 h-10 fill-primary" />
                </motion.div>
                <div className="absolute bottom-8 left-8 right-8 z-10 flex justify-between items-end">
                  <div className="text-on-surface">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Trailer Oficial</p>
                    <h4 className="text-xl font-bold font-headline">El Camino a la Gloria</h4>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-on-surface border border-white/30">4K ULTRA HD</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

          <footer id="main-footer" className="w-full py-12 border-t border-primary/10 mt-auto">
            <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto">
              <div className="mb-4 md:mb-0">
                <div className="font-headline font-black text-primary text-xl">Vamos por la cuarta</div>
              </div>
              <div className="text-on-surface-variant font-body text-sm">
                © 2024 Vamos por la cuarta. Hecho para los campeones.
              </div>
            </div>
          </footer>
      </main>
    </div>
  );
}


