import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { motion, AnimatePresence } from 'motion/react';
import { Play, CloudUpload, ShieldCheck, Loader2, Download, RotateCcw } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
const mpPublicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-e0b0e5bc-6202-4b2a-8d76-e17f7de7517c';
console.log("Initializing Mercado Pago with Public Key:", mpPublicKey);
initMercadoPago(mpPublicKey);
export default function App() {
    const [isHovered, setIsHovered] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultImage, setResultImage] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const [downloadToken, setDownloadToken] = useState(null);
    const [paymentError, setPaymentError] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
    const [preferenceId, setPreferenceId] = useState(null);
    const [isLoadingPreference, setIsLoadingPreference] = useState(false);
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
        setDownloadToken(null);
        setPaymentError(null);
        setIsPaying(false);
        setPreferenceId(null);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        const paymentId = params.get('payment_id');
        const preferenceId = params.get('preference_id');
        if (status === 'approved' && paymentId) {
            const verifyPayment = async () => {
                setIsVerifyingPayment(true);
                setPaymentError(null);
                try {
                    const response = await fetch('/api/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            paymentId,
                            preferenceId: preferenceId || sessionStorage.getItem('mp_preference_id')
                        }),
                    });
                    const data = await response.json();
                    if (response.ok && data.status === 'approved') {
                        setDownloadToken(data.downloadToken);
                        setResultImage(data.imageUrl);
                    }
                    else {
                        throw new Error(data.error || data.detail || 'El pago no pudo ser verificado.');
                    }
                }
                catch (err) {
                    console.error(err);
                    setPaymentError(err.message || 'Error al verificar el pago con Mercado Pago.');
                }
                finally {
                    setIsVerifyingPayment(false);
                    // Clear query params to avoid re-triggering and clean the URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    sessionStorage.removeItem('mp_preference_id');
                }
            };
            verifyPayment();
        }
        else if (status === 'failed') {
            setPaymentError('El pago fue rechazado. Por favor, intenta de nuevo.');
            window.history.replaceState({}, document.title, window.location.pathname);
            sessionStorage.removeItem('mp_preference_id');
        }
        else if (status === 'pending') {
            setPaymentError('El pago está pendiente de confirmación.');
            window.history.replaceState({}, document.title, window.location.pathname);
            sessionStorage.removeItem('mp_preference_id');
        }
    }, []);
    useEffect(() => {
        const fetchPreference = async () => {
            if (!resultImage || downloadToken) {
                setPreferenceId(null);
                return;
            }
            setIsLoadingPreference(true);
            setPaymentError(null);
            console.log("Fetching payment preference for image:", resultImage);
            try {
                const response = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: resultImage }),
                });
                if (!response.ok) {
                    throw new Error('No se pudo crear la preferencia de pago.');
                }
                const data = await response.json();
                if (data.preferenceId) {
                    console.log("Successfully created payment preference ID:", data.preferenceId);
                    setPreferenceId(data.preferenceId);
                    sessionStorage.setItem('mp_preference_id', data.preferenceId);
                }
                else {
                    throw new Error('Falta el ID de preferencia de Mercado Pago.');
                }
            }
            catch (err) {
                console.error("Error creating payment preference:", err);
                setPaymentError(err.message || 'Error al conectar con Mercado Pago.');
            }
            finally {
                setIsLoadingPreference(false);
            }
        };
        fetchPreference();
    }, [resultImage, downloadToken]);
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
    return (_jsxs("div", { id: "main-container", className: "bg-background text-on-background font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen overflow-x-hidden", children: [isVerifyingPayment && (_jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6", children: _jsxs("div", { className: "glass-card border border-white/60 rounded-[1.5rem] p-12 max-w-md w-full shadow-2xl text-center space-y-6", children: [_jsxs("div", { className: "relative w-32 h-32 mx-auto", children: [_jsx("div", { className: "absolute inset-0 border-4 border-primary/20 rounded-full" }), _jsx(motion.div, { className: "absolute inset-0 border-4 border-primary border-t-transparent rounded-full", animate: { rotate: 360 }, transition: { repeat: Infinity, duration: 1, ease: "linear" } }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center text-primary", children: _jsx(ShieldCheck, { className: "w-12 h-12" }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-2xl font-bold font-headline text-primary", children: "Verificando tu pago..." }), _jsx("p", { className: "text-on-surface-variant", children: "Estamos confirmando la transacci\u00F3n de forma segura con Mercado Pago." }), _jsx("p", { className: "text-xs text-on-surface-variant/70", children: "Esto tomar\u00E1 s\u00F3lo unos segundos. Por favor no cierres esta ventana." })] })] }) })), _jsxs("main", { children: [_jsxs("section", { id: "hero", className: "relative min-h-[60vh] flex items-center hero-gradient pt-20 overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-10" }), _jsx("div", { className: "absolute inset-0 opacity-20 z-0", children: _jsx("img", { alt: "Wide angle shot of a massive modern soccer stadium filled with fans", className: "w-full h-full object-cover", src: "https://lh3.googleusercontent.com/aida/ADBb0uivVQKgSxi8EzJbJLw6Mwzs9tptDN5QqYwn-n5M35bbrojW9DK0HvVqFnzJxTW-3cqhuzxbIleEY9vGaToAYAgeTVuJwu0LuKPbg8aDZa3RON-TwLJ7eZuSQpRAv2D72P3buZIPxt4udGjiEJFK5H_x4NOwVry8CEFI7kVR3f7Zn-6x2NJj9uAq-1UZDjeiKvdwzU4tYQ0yZ9nqzfsMrmQAJseIsGbYH8Aq2-6EeEKjVbchgdB_TsrGoTiy2NTSTCIGdNZEyjbboIo", referrerPolicy: "no-referrer" }) }), _jsxs(motion.div, { className: "max-w-7xl mx-auto px-6 text-center w-full relative z-20", initial: "hidden", animate: "visible", variants: containerVariants, children: [_jsx(motion.h1, { variants: itemVariants, className: "text-6xl lg:text-9xl font-normal font-display mb-6 tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] glimmer-text leading-tight", style: { fontSize: 'clamp(4rem, 10vw, 8rem)', transform: 'translateY(-10%)' }, children: "VAMOS POR LA CUARTA" }), _jsx(motion.p, { variants: itemVariants, className: "text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed font-medium", children: "Viv\u00ED la magia de la IA y s\u00E9 parte del camino del campe\u00F3n." })] })] }), !resultImage && (_jsx("section", { id: "video-section", className: "relative min-h-[60vh] flex items-center bg-white sun-of-may-bg py-24", children: _jsx("div", { className: "max-w-5xl mx-auto px-6 w-full", children: _jsxs(motion.div, { id: "video-player", className: "relative w-full aspect-video bg-surface-container rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/30 flex items-center justify-center group cursor-pointer", whileHover: { scale: 1.02 }, onHoverStart: () => setIsHovered(true), onHoverEnd: () => setIsHovered(false), children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" }), _jsx("img", { alt: "Stadium atmosphere background for video", className: "absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay", src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXioJ29dRu_tItqcGH7wwuTN7a2qWIdvtSVAdIZ35-PRL9KPBRQ9yVBhqaKayN-1GG8g263Z56A4mynJqKpJWlxC0YKR7LzLSRPMPckXvUrPwWC2FfGeMhw8ySIgalawkB0JkBF7W6WJmB6vOdpfU6v2MeYiMN8P1kg4R5Sl06o52jjfP-y0Pz5z4G7soNMQVCl7QavJxPRX-V3LwOn4SnnnA8iZjQc94520xccQEJQKPQi4-_gPXsctAAl4uxmjTvMCYM6B-Q5wxm", referrerPolicy: "no-referrer" }), _jsx(motion.div, { className: "relative z-10 w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl", animate: { scale: isHovered ? 1.1 : 1 }, children: _jsx(Play, { className: "text-primary w-10 h-10 fill-primary" }) }), _jsxs("div", { className: "absolute bottom-8 left-8 right-8 z-10 flex justify-between items-end", children: [_jsxs("div", { className: "text-on-surface", children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-widest opacity-60 mb-1", children: "Trailer Oficial" }), _jsx("h4", { className: "text-xl font-bold font-headline", children: "El Camino a la Gloria" })] }), _jsx("div", { className: "flex gap-2", children: _jsx("span", { className: "px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-on-surface border border-white/30", children: "4K ULTRA HD" }) })] })] }) }) })), _jsxs("section", { id: "upload-section", className: "relative min-h-[80vh] flex flex-col hero-gradient border-t border-white/20", children: [_jsx("div", { className: "flex-grow flex items-center justify-center py-20 px-6", children: _jsx("div", { className: "max-w-4xl mx-auto w-full", children: _jsx(AnimatePresence, { mode: "wait", children: isProcessing ? (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.05 }, className: "glass-card border border-white/60 rounded-[1.5rem] p-12 shadow-xl text-center space-y-6", children: [_jsxs("div", { className: "relative w-32 h-32 mx-auto", children: [_jsx("div", { className: "absolute inset-0 border-4 border-primary/20 rounded-full" }), _jsx(motion.div, { className: "absolute inset-0 border-4 border-primary border-t-transparent rounded-full", animate: { rotate: 360 }, transition: { repeat: Infinity, duration: 1, ease: "linear" } }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center text-primary", children: _jsx(Loader2, { className: "w-12 h-12" }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-2xl font-bold font-headline text-primary", children: "Procesando tu camino..." }), _jsx("p", { className: "text-on-surface-variant", children: "Estamos creando tu retrato legendario con IA." }), _jsx("div", { className: "h-1 w-48 bg-primary/20 mx-auto rounded-full mt-4 overflow-hidden", children: _jsx(motion.div, { className: "h-full bg-primary", animate: { x: ["-100%", "100%"] }, transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }) })] })] }, "processing")) : resultImage ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "glass-card border border-white/60 rounded-[1.5rem] p-6 shadow-2xl space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-3xl font-black font-headline text-primary mb-2", children: !downloadToken ? '🔒 PAGA PARA DESCARGAR TU RETRATO' : '✅ ¡EL CAMPEÓN ESTÁ AQUÍ!' }), _jsx("p", { className: "text-on-surface-variant", children: !downloadToken ? 'Hacé tu pago seguro para descargar tu retrato en alta calidad.' : 'Tu retrato del camino a la cuarta estrella.' })] }), _jsxs("div", { className: "relative group rounded-xl overflow-hidden shadow-inner bg-black/5", children: [_jsx("img", { src: resultImage, alt: "AI Generated Champion", className: `w-full h-auto max-h-[70vh] object-contain mx-auto transition-all duration-500 ${!downloadToken ? 'blur-md select-none pointer-events-none' : ''}`, referrerPolicy: "no-referrer" }), downloadToken && (_jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6", children: _jsxs("a", { href: `/api/download?token=${downloadToken}`, className: "bg-white text-primary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-fixed transition-colors", children: [_jsx(Download, { className: "w-4 h-4" }), " Descargar"] }) }))] }), !downloadToken && (_jsxs("div", { className: "max-w-md mx-auto p-6 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 space-y-4 text-center", children: [isLoadingPreference ? (_jsxs("div", { className: "flex items-center justify-center py-4 gap-3 text-primary", children: [_jsx(Loader2, { className: "w-6 h-6 animate-spin" }), _jsx("span", { className: "font-semibold text-sm", children: "Cargando bot\u00F3n de pago..." })] })) : preferenceId ? (_jsx("div", { id: "walletBrick_container", className: "w-full min-h-[48px]", children: _jsx(Wallet, { initialization: { preferenceId }, onReady: () => console.log("Mercado Pago Wallet Brick loaded successfully!"), onError: (error) => console.error("Mercado Pago Wallet Brick Error:", error) }) })) : (_jsxs("div", { className: "text-center py-2", children: [_jsx("p", { className: "text-red-500 text-sm font-semibold mb-2", children: paymentError || 'No se pudo cargar el botón de pago.' }), _jsx("button", { onClick: () => {
                                                                        const img = resultImage;
                                                                        setResultImage(null);
                                                                        setTimeout(() => setResultImage(img), 50);
                                                                    }, className: "text-xs text-primary underline font-medium hover:text-primary-container transition-colors", children: "Intentar cargar nuevamente" })] })), _jsx("p", { className: "text-xs text-on-surface-variant font-medium", children: "Monto total: $1000 ARS \u2022 Procesamiento seguro por Mercado Pago" }), paymentError && !isLoadingPreference && !preferenceId && (_jsx("p", { className: "text-red-500 text-sm mt-2 text-center font-semibold", children: paymentError }))] })), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs("button", { onClick: reset, className: "flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-bold px-8 py-3 rounded-lg hover:bg-primary/5 transition-all", children: [_jsx(RotateCcw, { className: "w-5 h-5" }), " Intentar con otra"] }), downloadToken && (_jsxs(_Fragment, { children: [_jsxs("a", { href: `/api/download?token=${downloadToken}`, className: "primary-gradient-bg text-on-primary font-bold px-10 py-3 rounded-lg shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2", children: [_jsx(Download, { className: "w-5 h-5" }), " Descargar Retrato"] }), _jsx("button", { className: "border-2 border-primary/20 text-primary font-bold px-10 py-3 rounded-lg hover:bg-primary/5 active:scale-95 transition-all", onClick: () => window.open(`https://twitter.com/intent/tweet?text=Mirá mi retrato para el camino a la cuarta estrella! 🇦🇷&url=${encodeURIComponent(resultImage)}`, '_blank'), children: "Compartir en redes" })] }))] })] }, "result")) : (_jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -inset-4 bg-primary/5 rounded-[2rem] blur-2xl group-hover:bg-primary/10 transition-all duration-500" }), _jsxs("div", { className: "relative glass-card border border-white/60 rounded-[1.5rem] p-8 shadow-xl", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h3", { className: "text-2xl font-bold font-headline text-primary", children: "Empez\u00E1 tu camino" }), _jsx("p", { className: "text-sm text-on-surface-variant", children: "Procesamiento r\u00E1pido, resultados cinematogr\u00E1ficos" })] }), error && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-3", children: [_jsx("span", { className: "font-bold", children: "Error:" }), " ", error] })), _jsxs("div", { id: "dropzone", className: "border-2 border-dashed border-primary/20 rounded-xl bg-white/30 p-12 text-center transition-all duration-300 hover:border-primary/50 hover:bg-white/80 cursor-pointer group/upload", onClick: handleUploadClick, children: [_jsx("input", { type: "file", ref: fileInputRef, className: "hidden", accept: "image/jpeg,image/png", onChange: handleFileChange }), _jsx("div", { className: "w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 transition-transform", children: _jsx(CloudUpload, { className: "text-primary w-8 h-8" }) }), _jsx("p", { className: "text-on-surface font-semibold mb-1", children: "Arrastr\u00E1 y solt\u00E1 tu foto" }), _jsx("p", { className: "text-xs text-on-surface-variant mb-6", children: "Los retratos en alta resoluci\u00F3n funcionan mejor (JPG, PNG)" }), _jsx("button", { className: "primary-gradient-bg text-on-primary font-bold px-8 py-3 rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto", children: "Seleccionar Archivo" })] }), _jsxs("div", { className: "mt-6 flex items-center gap-3 text-xs text-on-surface-variant justify-center", children: [_jsx(ShieldCheck, { className: "w-4 h-4 text-primary" }), "Tu privacidad es nuestra prioridad. Las fotos se procesan y eliminan en 24 horas."] })] })] })) }) }) }), _jsx("footer", { id: "main-footer", className: "w-full py-12 border-t border-primary/10 mt-auto", children: _jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto", children: [_jsx("div", { className: "mb-4 md:mb-0", children: _jsx("div", { className: "font-headline font-black text-primary text-xl", children: "Vamos por la cuarta" }) }), _jsx("div", { className: "text-on-surface-variant font-body text-sm", children: "\u00A9 2024 Vamos por la cuarta. Hecho para los campeones." })] }) })] })] })] }));
}
