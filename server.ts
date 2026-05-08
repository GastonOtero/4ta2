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

      const complexPrompt = `Create a photorealistic studio portrait of a person from the first reference image, wearing the Argentina national football team jersey from the second reference image, standing in the stadium environment from the third reference image. The entire person must be fully visible and completely in the foreground, with no parts cut off or obscured.

Composition: 9:16 vertical aspect ratio optimized for Instagram Stories, subject centered horizontally and vertically, crown of head to lower hips visible, subject occupies bottom two-thirds of frame with top one-third as clean white negative space. A precise Cowboy Shot composition framed from the crown of the head to the mid-thigh. The subject must be explicitly scaled smaller and positioned in the bottom two-thirds of the frame, leaving precisely one-third (1/3) of the total height as empty negative space above the head. This 'wide-headroom' layout must be strictly maintained.

Pose and expression: Direct eye contact with camera, subtle emotionally layered expression of unshakable pride, deep-seated hope, and quiet joyful smile - deeply human, not theatrical. Eyes bright and glistening with emotion. Right hand pressed firmly and flat over heart in solemn oath posture, fingers together, palm fully in contact.

Outfit: Exact replication of Argentina national football team jersey colors, badge, stripes, and sponsor details from the second reference image.

Background: Use the stadium environment from the third reference image as-is behind the subject, no modification.

Lighting: Soft yet heroic diffused key light with gentle fill to preserve shadow depth, highlighting natural skin texture and facial detail for realism and emotional authenticity.

Technical: High-definition professional studio portrait photography, photorealistic with no illustration effects, 8K resolution, sharp focus, natural skin texture, emotionally authentic, studio-grade quality.`;

      console.log("Calling Fal.ai with", refImages.length, "images.");
      const result: any = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: {
          image_urls: refImages,
          prompt: complexPrompt,
          aspect_ratio: "9:16",
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
