import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import cors from "cors";
import { fal } from "@fal-ai/client";
import dotenv from "dotenv";
dotenv.config();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});
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
                        // Check if it's actually an image (not our text placeholder)
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
            const complexPrompt = {
                "subject": {
                    "identity": "person from reference image [image_1]",
                    "framing": "crown of head to lower hips, centered horizontally",
                    "scale_within_frame": "subject occupies bottom two-thirds of vertical frame; top one-third is empty white negative space above the head",
                    "z_depth": "subject in foreground, closest to camera"
                },
                "outfit": {
                    "garment": "Argentina national football team jersey from reference image [image_2]",
                    "accuracy": "replicate exact colors, badge, stripes, and sponsor details from reference"
                },
                "background": {
                    "source": "environment from reference image [image_3]",
                    "treatment": "used as-is behind subject, no modification"
                },
                "composition": {
                    "aspect_ratio": "9:16 vertical — optimized for Instagram Stories",
                    "alignment": "centered on both axes",
                    "negative_space": "precisely one-third of total frame height left as clean white space above subject's head"
                },
                "expression_and_pose": {
                    "gaze": "direct eye contact with camera lens",
                    "expression": "subtle, emotionally layered: unshakable pride, deep-seated hope, and quiet joyful smile — not theatrical, deeply human",
                    "eyes": "bright, glistening with emotion, slightly moist — conveys authentic feeling",
                    "hand_gesture": "right hand pressed firmly and flat over heart — solemn oath posture, fingers together, palm fully in contact"
                },
                "lighting": {
                    "quality": "soft yet heroic — diffused key light, gentle fill to preserve shadow depth",
                    "intent": "highlights natural skin texture and facial detail to enhance realism and emotional authenticity"
                },
                "technical": {
                    "style": "high-definition professional studio portrait photography",
                    "realism": "photorealistic — no illustration or painterly effects",
                    "quality_tags": [
                        "8K resolution",
                        "sharp focus",
                        "natural skin texture",
                        "emotionally authentic",
                        "studio-grade"
                    ]
                }
            };
            // Call Fal.ai nano-banana edit
            // We pass the prompt as stringified JSON and the images in an array
            console.log("Calling Fal.ai with", refImages.length, "images");
            const result = await fal.subscribe("fal-ai/nano-banana/edit", {
                input: {
                    image_urls: refImages,
                    prompt: JSON.stringify(complexPrompt),
                },
                logs: true,
            });
            console.log("Fal.ai Result:", JSON.stringify(result, null, 2));
            res.json(result);
        }
        catch (error) {
            console.error("Fal.ai Error:", error);
            res.status(500).json({ error: error.message || "Failed to generate image" });
        }
    });
    // Vite middleware for development
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
