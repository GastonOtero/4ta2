import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import cors from "cors";
import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
import crypto from 'crypto';
dotenv.config();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});
// A temporary server cache to keep track of active, valid download tokens
// For production scale, map this out to a Firestore database instead!
const validDownloadTokens = new Map();
async function startServer() {
    const app = express();
    const PORT = parseInt(process.env.PORT || "3000");
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    // Health check
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", time: new Date().toISOString() });
    });
    // API Route for image generation
    app.post("/api/generate", (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) {
                console.error("Multer error:", err);
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            next();
        });
    }, async (req, res) => {
        console.log("POST /api/generate received");
        try {
            const file = req.file;
            console.log("File received:", file ? `${file.originalname} (${file.size} bytes)` : "No file");
            if (!file) {
                return res.status(400).json({ error: "No image uploaded" });
            }
            if (!process.env.FAL_KEY) {
                return res.status(500).json({ error: "FAL_KEY is not configured" });
            }
            // Convert uploaded image to base64 data URI
            const base64Image1 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            // Try to load reference images from the repository
            const refImages = [base64Image1];
            const loadRefImage = (fileName) => {
                try {
                    const filePath = path.join(process.cwd(), 'reference-images', fileName);
                    if (fs.existsSync(filePath)) {
                        const buffer = fs.readFileSync(filePath);
                        if (buffer.length < 500) {
                            console.warn(`File ${fileName} seems too small to be an image, skipping.`);
                            return null;
                        }
                        const ext = path.extname(fileName).toLowerCase().replace('.', '');
                        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
                        return `data:${mimeType};base64,${buffer.toString('base64')}`;
                    }
                }
                catch (e) {
                    console.warn(`Could not load reference image ${fileName}:`, e);
                }
                return null;
            };
            const base64Image2 = loadRefImage('camiseta.jpg');
            const base64Image3 = loadRefImage('fondo definitivo.png');
            if (base64Image2)
                refImages.push(base64Image2);
            if (base64Image3)
                refImages.push(base64Image3);
            const complexPrompt = `Create a photorealistic studio portrait of the exact person from the first reference image (no hat, no additional accessories), wearing the Argentina national football team jersey from the second reference image.
Use the third reference image as the exact, pixel-perfect, unmodified background. Do not change, reinterpret, regenerate, or stylize the background in any way. Copy it with 100% fidelity — identical flag, stars, stadium, lighting, perspective, crowd, and atmosphere. Maximum background adherence.
Composition: Strictly 9:16 vertical aspect ratio matching the third reference image. Tight Cowboy Shot. Subject perfectly centered, occupying the lower 75% of the frame. Exactly 25% empty space above the subject's head. Frame cuts at mid-thigh/upper-thigh. Top of head positioned exactly at the 3/4 vertical mark.
Pose and expression: Direct eye contact with camera. Subtle, authentic expression of pride, hope, and quiet joyful smile. Eyes bright and emotional. Right hand placed flat over the heart, fingers together, palm fully contacting the chest in solemn gesture.
Critical subject instructions:

Use the exact face, hair, glasses, and features from the first reference image.
No hat, no cowboy hat, no headwear of any kind.
No additional accessories.
Hair, glasses, and facial features must match the first reference precisely.

Outfit: Exact Argentina national team jersey from the second reference image — perfect colors, stripes, badges, sponsors, and fit.
Lighting: Soft diffused heroic key light with gentle fill, natural skin texture, realistic shadows.
Technical: Photorealistic 8K studio portrait, sharp focus, natural skin details, seamless photographic composite, emotionally authentic.
Strict directives:

No creative additions to the subject (especially no hats).
Zero background modification or hallucination.
Maximum fidelity to all three reference images.
Subject fully visible and in foreground.`;
            console.log("Calling Fal.ai with", refImages.length, "images.");
            const result = await fal.subscribe("xai/grok-imagine-image/edit", {
                input: {
                    image_urls: refImages,
                    prompt: complexPrompt,
                    aspect_ratio: "9:16",
                    output_format: "jpeg",
                },
                logs: true,
            });
            console.log("Raw Fal.ai Result:", JSON.stringify(result, null, 2));
            const responseBody = result?.data ?? result;
            const images = responseBody?.images ?? responseBody?.output?.images;
            const imageUrl = images?.length > 0 ? images[0]?.url : undefined;
            if (imageUrl) {
                res.json({ image: { url: imageUrl } });
            }
            else {
                console.error("Could not find image URL in Fal.ai response:", responseBody);
                res.status(500).json({ error: "AI returned data in an unexpected format." });
            }
        }
        catch (error) {
            console.error("Fal.ai Error:", error);
            res.status(500).json({ error: error.message || "Failed to generate image" });
        }
    });
    // 1. Payment processing endpoint
    app.post('/api/process-payment', async (req, res) => {
        const { paymentData, imageUrl } = req.body;
        try {
            const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'YOUR_MERCADO_PAGO_PRIVATE_ACCESS_TOKEN';
            // Send request directly to Mercado Pago API using your Private Access Token
            const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': crypto.randomUUID() // Mandatory safety parameter for MP
                },
                body: JSON.stringify({
                    token: paymentData.token,
                    issuer_id: paymentData.issuer_id,
                    payment_method_id: paymentData.payment_method_id,
                    transaction_amount: paymentData.transaction_amount,
                    installments: paymentData.installments,
                    description: 'Descarga de Retrato Camiseta Argentina',
                    payer: {
                        email: paymentData.payer.email,
                        identification: paymentData.payer.identification
                    }
                })
            });
            const paymentResult = await mpResponse.json();
            if (paymentResult.status === 'approved') {
                // Create a secure, random dynamic token for the download
                const downloadToken = crypto.randomBytes(32).toString('hex');
                // Store the token mapped to the image URL, expiring in 15 minutes
                validDownloadTokens.set(downloadToken, {
                    imageUrl: imageUrl,
                    expiresAt: Date.now() + 15 * 60 * 1000
                });
                res.status(200).json({
                    status: 'approved',
                    downloadToken: downloadToken
                });
            }
            else {
                res.status(400).json({
                    status: paymentResult.status,
                    detail: paymentResult.status_detail || 'Pago rechazado o pendiente.'
                });
            }
        }
        catch (error) {
            console.error('Mercado Pago Gateway Error:', error);
            res.status(500).json({ error: 'Internal server payment error' });
        }
    });
    // 2. Token-gated download endpoint
    app.get('/api/download', async (req, res) => {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            res.status(401).send('Acceso denegado: Token ausente.');
            return;
        }
        const tokenRecord = validDownloadTokens.get(token);
        // Validate existence and expiration timestamps
        if (!tokenRecord || Date.now() > tokenRecord.expiresAt) {
            res.status(403).send('Enlace de descarga inválido o expirado.');
            return;
        }
        try {
            // Fetch the target image from cloud storage (e.g., fal.ai or Cloudflare R2 bucket)
            const imageResponse = await fetch(tokenRecord.imageUrl);
            if (!imageResponse.ok)
                throw new Error('Failed to fetch image binary source');
            // Force download headers instead of opening inline script assets
            res.setHeader('Content-Disposition', 'attachment; filename="mi-retrato-campeon.jpg"');
            res.setHeader('Content-Type', 'image/jpeg');
            // Stream the image file buffer down to the client connection frame
            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            // Optional: Delete the token immediately after use to prevent re-use sharing
            validDownloadTokens.delete(token);
            res.send(buffer);
            return;
        }
        catch (err) {
            console.error('Download Streaming Error:', err);
            res.status(500).send('Error al procesar la descarga de su archivo.');
        }
    });
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer();
