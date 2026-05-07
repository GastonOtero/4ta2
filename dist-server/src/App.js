import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { motion, AnimatePresence } from 'motion/react';
import { Play, CloudUpload, ShieldCheck, Loader2, Download, RotateCcw } from 'lucide-react';
import React, { useState, useRef } from 'react';
export default function App() {
    const [isHovered, setIsHovered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        await processImage(file);
    };
    const processImage = async (file) => {
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
                }
                catch (e) {
                    errorMessage = `Server returned non-JSON error: ${text.slice(0, 100)}...`;
                }
                throw new Error(errorMessage);
            }
            const data = await response.json();
            // Fal.ai gemini result structure usually has images array
            if (data.images && data.images.length > 0) {
                setResultImage(data.images[0].url);
            }
            else if (data.image && data.image.url) {
                setResultImage(data.image.url);
            }
            else {
                throw new Error('No image was returned from the AI');
            }
        }
        catch (err) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred');
        }
        finally {
            setIsProcessing(false);
        }
    };
    const reset = () => {
        setResultImage(null);
        setError(null);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
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
    return (_jsx("div", { id: "main-container", className: "bg-background text-on-background font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen overflow-x-hidden", children: _jsxs("main", { children: [_jsxs("section", { id: "hero", className: "relative min-h-[60vh] flex items-center hero-gradient pt-20 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-10" }), _jsx("div", { className: "absolute inset-0 opacity-20 z-0", children: _jsx("img", { alt: "Wide angle shot of a massive modern soccer stadium filled with fans", className: "w-full h-full object-cover", src: "https://lh3.googleusercontent.com/aida/ADBb0uivVQKgSxi8EzJbJLw6Mwzs9tptDN5QqYwn-n5M35bbrojW9DK0HvVqFnzJxTW-3cqhuzxbIleEY9vGaToAYAgeTVuJwu0LuKPbg8aDZa3RON-TwLJ7eZuSQpRAv2D72P3buZIPxt4udGjiEJFK5H_x4NOwVry8CEFI7kVR3f7Zn-6x2NJj9uAq-1UZDjeiKvdwzU4tYQ0yZ9nqzfsMrmQAJseIsGbYH8Aq2-6EeEKjVbchgdB_TsrGoTiy2NTSTCIGdNZEyjbboIo", referrerPolicy: "no-referrer" }) }), _jsxs(motion.div, { className: "max-w-7xl mx-auto px-6 text-center w-full relative z-20", initial: "hidden", animate: "visible", variants: containerVariants, children: [_jsx(motion.h1, { variants: itemVariants, className: "text-6xl lg:text-9xl font-normal font-display mb-6 tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] glimmer-text leading-tight", style: { fontSize: 'clamp(4rem, 10vw, 8rem)', transform: 'translateY(-10%)' }, children: "VAMOS POR LA CUARTA" }), _jsx(motion.p, { variants: itemVariants, className: "text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed font-medium", children: "Viv\u00ED la magia de la IA y s\u00E9 parte del camino del campe\u00F3n." })] })] }), !resultImage && (_jsx("section", { id: "video-section", className: "relative min-h-[60vh] flex items-center bg-white sun-of-may-bg py-24", children: _jsx("div", { className: "max-w-5xl mx-auto px-6 w-full", children: _jsxs(motion.div, { id: "video-player", className: "relative w-full aspect-video bg-surface-container rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/30 flex items-center justify-center group cursor-pointer", whileHover: { scale: 1.02 }, onHoverStart: () => setIsHovered(true), onHoverEnd: () => setIsHovered(false), children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" }), _jsx("img", { alt: "Stadium atmosphere background for video", className: "absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXioJ29dRu_tItqcGH7wwuTN7a2qWIdvtSVAdIZ35-PRL9KPBRQ9yVBhqaKayN-1GG8g263Z56A4mynJqKpJWlxC0YKR7LzLSRPMPckXvUrPwWC2FfGeMhw8ySIgalawkB0JkBF7W6WJmB6vOdpfU6v2MeYiMN8P1kg4R5Sl06o52jjfP-y0Pz5z4G7soNMQVCl7QavJxPRX-V3LwOn4SnnnA8iZjQc94520xccQEJQKPQi4-_gPXsctAAl4uxmjTvMCYM6B-Q5wxm", referrerPolicy: "no-referrer" }), _jsx(motion.div, { className: "relative z-10 w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl", animate: { scale: isHovered ? 1.1 : 1 }, children: _jsx(Play, { className: "text-primary w-10 h-10 fill-primary" }) }), _jsxs("div", { className: "absolute bottom-8 left-8 right-8 z-10 flex justify-between items-end", children: [_jsxs("div", { className: "text-on-surface", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-widest opacity-60 mb-1", children: "Trailer Oficial" }), _jsx("h4", { className: "text-xl font-bold font-headline", children: "El Camino a la Gloria" })] }), _jsx("div", { className: "flex gap-2", children: _jsx("span", { className: "px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-on-surface border border-white/30", children: "4K ULTRA HD" }) })] })] }) }) })), _jsxs("section", { id: "upload-section", className: "relative min-h-[80vh] flex flex-col hero-gradient border-t border-white/20", children: [_jsx("div", { className: "flex-grow flex items-center justify-center py-20 px-6", children: _jsx("div", { className: "max-w-4xl mx-auto w-full", children: _jsx(AnimatePresence, { mode: "wait", children: isProcessing ? (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 }, className: "glass-card border border-white/60 rounded-[1.5rem] p-12 shadow-xl text-center space-y-6", children: [_jsxs("div", { className: "relative w-32 h-32 mx-auto", children: [_jsx("div", { className: "absolute inset-0 border-4 border-primary/20 rounded-full" }), _jsx(motion.div, { className: "absolute inset-0 border-4 border-primary border-t-transparent rounded-full", animate: { rotate: 360 }, transition: { repeat: Infinity, duration: 1, ease: "linear" } }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center text-primary", children: _jsx(Loader2, { className: "w-12 h-12" }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-2xl font-bold font-headline text-primary", children: "Procesando tu camino..." }), _jsx("p", { className: "text-on-surface-variant", children: "Estamos creando tu retrato legendario con IA." }), _jsx("div", { className: "h-1 w-48 bg-primary/20 mx-auto rounded-full mt-4 overflow-hidden", children: _jsx(motion.div, { className: "h-full bg-primary", animate: { x: ["-100%", "100%"] }, transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }) })] })] }, "processing")) : resultImage ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "glass-card border border-white/60 rounded-[1.5rem] p-6 shadow-2xl space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-3xl font-black font-headline text-primary mb-2", children: "\u00A1EL CAMPE\u00D3N EST\u00C1 AQU\u00CD!" }), _jsx("p", { className: "text-on-surface-variant", children: "Tu retrato del camino a la cuarta estrella." })] }), _jsxs("div", { className: "relative group rounded-xl overflow-hidden shadow-inner bg-black/5", children: [_jsx("img", { src: resultImage, alt: "AI Generated Champion", className: "w-full h-auto max-h-[70vh] object-contain mx-auto", referrerPolicy: "no-referrer" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6", children: _jsxs("a", { href: resultImage, download: "campeon.png", target: "_blank", rel: "noreferrer", className: "bg-white text-primary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-fixed transition-colors", children: [_jsx(Download, { className: "w-4 h-4" }), " Descargar"] }) })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs("button", { onClick: reset, className: "flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-bold px-8 py-3 rounded-lg hover:bg-primary/5 transition-all", children: [_jsx(RotateCcw, { className: "w-5 h-5" }), " Intentar con otra"] }), _jsx("button", { className: "primary-gradient-bg text-on-primary font-bold px-10 py-3 rounded-lg shadow-lg hover:shadow-primary/30 active:scale-95 transition-all", onClick: () => window.open(`https://twitter.com/intent/tweet?text=Mirá mi retrato para el camino a la cuarta estrella! 🇦🇷&url=${encodeURIComponent(resultImage)}`, '_blank'), children: "Compartir en redes" })] })] }, "result")) : (_jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -inset-4 bg-primary/5 rounded-[2rem] blur-2xl group-hover:bg-primary/10 transition-all duration-500" }), _jsxs("div", { className: "relative glass-card border border-white/60 rounded-[1.5rem] p-8 shadow-xl", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h3", { className: "text-2xl font-bold font-headline text-primary", children: "Empez\u00E1 tu camino" }), _jsx("p", { className: "text-sm text-on-surface-variant", children: "Procesamiento r\u00E1pido, resultados cinematogr\u00E1ficos" })] }), error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-3", children: [_jsx("span", { className: "font-bold", children: "Error:" }), " ", error] })), _jsxs("div", { id: "dropzone", className: "border-2 border-dashed border-primary/20 rounded-xl bg-white/30 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-white/80 cursor-pointer group/upload", onClick: handleUploadClick, children: [_jsx("input", { type: "file", ref: fileInputRef, className: "hidden", accept: "image/jpeg,image/png", onChange: handleFileChange }), _jsx("div", { className: "w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 transition-transform", children: _jsx(CloudUpload, { className: "text-primary w-8 h-8" }) }), _jsx("p", { className: "text-on-surface font-semibold mb-1", children: "Arrastr\u00E1 y solt\u00E1 tu foto" }), _jsx("p", { className: "text-xs text-on-surface-variant mb-6", children: "Los retratos en alta resoluci\u00F3n funcionan mejor (JPG, PNG)" }), _jsx("button", { className: "primary-gradient-bg text-on-primary font-bold px-8 py-3 rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto", children: "Seleccionar Archivo" })] }), _jsxs("div", { className: "mt-6 flex items-center gap-3 text-xs text-on-surface-variant justify-center", children: [_jsx(ShieldCheck, { className: "w-4 h-4 text-primary" }), "Tu privacidad es nuestra prioridad. Las fotos se procesan y eliminan en 24 horas."] })] })] })) }) }) }), _jsx("footer", { id: "main-footer", className: "w-full py-12 border-t border-primary/10 mt-auto", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-4 md:mb-0", children: _jsx("div", { className: "font-headline font-black text-primary text-xl", children: "Vamos por la cuarta" }) }), _jsx("div", { className: "text-on-surface-variant font-body text-sm", children: "\u00A9 2024 Vamos por la cuarta. Hecho para los campeones." })] }) })] })] }) }));
}
