import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadandIngest, queryDocument } from "../controllers/documentControllers";

const router = Router();

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50MB);
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed!"));
        }   
    }
});

router.post("/upload", upload.single("pdf"), uploadandIngest);
router.post("/query", queryDocument);

export default router;