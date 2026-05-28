import express, { Request, Response } from "express";
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
  }, async (req: Request, res: Response) => {
    console.log("POST /api/generate received");
    try {
      const file = (req as any).file;
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
      const refImages: string[] = [base64Image1];
      
      const loadRefImage = (fileName: string) => {
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
        } catch (e) {
          console.warn(`Could not load reference image ${fileName}:`, e);
        }
        return null;
      };

      const base64Image2 = loadRefImage('camiseta.jpg');
      const base64Image3 = loadRefImage('fondo definitivo.png');

      if (base64Image2) refImages.push(base64Image2);
      if (base64Image3) refImages.push(base64Image3);

      const complexPrompt = `Create a photorealistic studio portrait of the person from the first reference image, wearing the exact Argentina national football team jersey from the second reference image.
Use the third reference image as the exact, unmodified background with 100% fidelity. Preserve every detail — perspective, lighting, stands, field, crowd, sky, and atmosphere — without any changes, reinterpretation, or regeneration. The background must be an identical match to the third reference image.
Composition: Strictly maintain the 9:16 vertical aspect ratio from the third reference image. Tight Cowboy Shot framing. The subject is perfectly centered and scaled to occupy the lower 75% of the frame. Exactly 25% empty space above the head. The bottom edge of the frame cuts at the mid-thigh/upper-thigh area. The top of the subject's head must be positioned exactly at the three-fourths (3/4) vertical mark of the frame. The subject's torso should dominate the bottom three-fourths of the image.
Pose and expression: Direct eye contact with the camera. Subtle, emotionally layered expression showing unshakable pride, deep hope, and a quiet joyful smile — deeply human and authentic. Eyes bright and glistening with emotion. Right hand pressed firmly and flat over the heart in a solemn oath posture, fingers together, palm fully in contact.
Outfit: Exact replication of the Argentina national football team jersey from the second reference image — colors, badge, stripes, sponsor logos, and all details must match perfectly.
Lighting: Soft heroic diffused key light with gentle fill lights, preserving natural shadow depth and highlighting realistic skin texture and facial details.
Technical: Photorealistic professional studio portrait photography, 8K resolution, sharp focus, natural skin texture, high detail, emotionally authentic, no illustration or artistic effects.
Style directives: Seamless photographic composite. Maximum background fidelity. No background modifications or hallucination. Subject fully visible, completely in foreground, no cropping or obstruction.`;

      console.log("Calling Fal.ai with", refImages.length, "images.");
      const result: any = await fal.subscribe("xai/grok-imagine-image/edit", {
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
      const imageUrl: string | undefined = images?.length > 0 ? images[0]?.url : undefined;

      if (imageUrl) {
        res.json({ image: { url: imageUrl } });
      } else {
        console.error("Could not find image URL in Fal.ai response:", responseBody);
        res.status(500).json({ error: "AI returned data in an unexpected format." });
      }
    } catch (error: any) {
      console.error("Fal.ai Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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
