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
      const result: any = await fal.subscribe("xai/grok-imagine-image/edit", {
        input: {
          image_urls: refImages,
          prompt: complexPrompt,
          aspect_ratio: "9:16",
          output_format: "jpeg",
        } as any,
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
