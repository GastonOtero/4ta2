"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var vite_1 = require("vite");
var path_1 = require("path");
var fs_1 = require("fs");
var multer_1 = require("multer");
var cors_1 = require("cors");
var client_1 = require("@fal-ai/client");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});
function startServer() {
    return __awaiter(this, void 0, void 0, function () {
        var app, PORT, vite, distPath_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    app = (0, express_1.default)();
                    PORT = parseInt(process.env.PORT || "3000");
                    app.use((0, cors_1.default)());
                    app.use(express_1.default.json({ limit: '50mb' }));
                    // Health check
                    app.get("/api/health", function (req, res) {
                        res.json({ status: "ok", time: new Date().toISOString() });
                    });
                    // API Route for image generation
                    app.post("/api/generate", function (req, res, next) {
                        upload.single('image')(req, res, function (err) {
                            if (err) {
                                console.error("Multer error:", err);
                                return res.status(400).json({ error: "Upload error: ".concat(err.message) });
                            }
                            next();
                        });
                    }, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var file, base64Image1, refImages, loadRefImage, base64Image2, base64Image3, complexPrompt, result, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log("POST /api/generate received");
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    file = req.file;
                                    console.log("File received:", file ? "".concat(file.originalname, " (").concat(file.size, " bytes)") : "No file");
                                    if (!file) {
                                        return [2 /*return*/, res.status(400).json({ error: "No image uploaded" })];
                                    }
                                    if (!process.env.FAL_KEY) {
                                        return [2 /*return*/, res.status(500).json({ error: "FAL_KEY is not configured" })];
                                    }
                                    base64Image1 = "data:".concat(file.mimetype, ";base64,").concat(file.buffer.toString('base64'));
                                    refImages = [base64Image1];
                                    loadRefImage = function (fileName) {
                                        try {
                                            var filePath = path_1.default.join(process.cwd(), 'reference-images', fileName);
                                            if (fs_1.default.existsSync(filePath)) {
                                                var buffer = fs_1.default.readFileSync(filePath);
                                                // Check if it's actually an image (not our text placeholder)
                                                if (buffer.length < 500) {
                                                    console.warn("File ".concat(fileName, " seems too small to be an image, skipping."));
                                                    return null;
                                                }
                                                var ext = path_1.default.extname(fileName).toLowerCase().replace('.', '');
                                                var mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
                                                return "data:".concat(mimeType, ";base64,").concat(buffer.toString('base64'));
                                            }
                                        }
                                        catch (e) {
                                            console.warn("Could not load reference image ".concat(fileName, ":"), e);
                                        }
                                        return null;
                                    };
                                    base64Image2 = loadRefImage('camiseta.jpg');
                                    base64Image3 = loadRefImage('fondo definitivo.png');
                                    if (base64Image2)
                                        refImages.push(base64Image2);
                                    if (base64Image3)
                                        refImages.push(base64Image3);
                                    complexPrompt = "Create a photorealistic studio portrait of a person from the first reference image, wearing the Argentina national football team jersey from the second reference image, standing in the stadium environment from the third reference image. The entire person must be fully visible and completely in the foreground, with no parts cut off or obscured.\n\nComposition: 9:16 vertical aspect ratio optimized for Instagram Stories, subject centered horizontally and vertically, crown of head to lower hips visible, subject occupies bottom three-fourths of frame with top one-fourth as clean white negative space. A precise Cowboy Shot composition framed from the crown of the head to the mid-thigh. The subject must be explicitly scaled smaller and positioned in the bottom three-fourths of the frame, leaving precisely one-fourth (1/4) of the total height as empty negative space above the head. This 'wide-headroom' layout must be strictly maintained.\n\nPose and expression: Direct eye contact with camera, subtle emotionally layered expression of unshakable pride, deep-seated hope, and quiet joyful smile - deeply human, not theatrical. Eyes bright and glistening with emotion. Right hand pressed firmly and flat over heart in solemn oath posture, fingers together, palm fully in contact.\n\nOutfit: Exact replication of Argentina national football team jersey colors, badge, stripes, and sponsor details from the second reference image.\n\nBackground: Use the stadium environment from the third reference image as-is behind the subject, no modification.\n\nLighting: Soft yet heroic diffused key light with gentle fill to preserve shadow depth, highlighting natural skin texture and facial detail for realism and emotional authenticity.\n\nTechnical: High-definition professional studio portrait photography, photorealistic with no illustration effects, 8K resolution, sharp focus, natural skin texture, emotionally authentic, studio-grade quality.";
                                    // Call Fal.ai gemini-2.5-flash-image
                                    // We pass the prompt as stringified JSON and the images in an array
                                    console.log("Calling Fal.ai with", refImages.length, "images");
                                    return [4 /*yield*/, client_1.fal.subscribe("fal-ai/gemini-25-flash-image/edit", {
                                            input: {
                                                image_urls: refImages,
                                                prompt: complexPrompt,
                                            },
                                            logs: true,
                                        })];
                                case 2:
                                    result = _a.sent();
                                    console.log("Fal.ai Result:", JSON.stringify(result, null, 2));
                                    res.json(result);
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_1 = _a.sent();
                                    console.error("Fal.ai Error:", error_1);
                                    res.status(500).json({ error: error_1.message || "Failed to generate image" });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    if (!(process.env.NODE_ENV !== "production")) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, vite_1.createServer)({
                            server: { middlewareMode: true },
                            appType: "spa",
                        })];
                case 1:
                    vite = _a.sent();
                    app.use(vite.middlewares);
                    return [3 /*break*/, 3];
                case 2:
                    distPath_1 = path_1.default.join(process.cwd(), 'dist');
                    app.use(express_1.default.static(distPath_1));
                    app.get('*', function (req, res) {
                        res.sendFile(path_1.default.join(distPath_1, 'index.html'));
                    });
                    _a.label = 3;
                case 3:
                    app.listen(PORT, "0.0.0.0", function () {
                        console.log("Server running on http://localhost:".concat(PORT));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
startServer();
