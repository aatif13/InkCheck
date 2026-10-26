import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { authMiddleware } from '../auth.js';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Simple color extraction from image buffer by sampling RGB
function sampleImageColors(buffer: Buffer): string[] {
  // Sample hex colors from various chunks of the buffer or provide representative sampled palette
  const sampledHexes = new Set<string>();
  
  // Sample 40 positions across the buffer
  const step = Math.max(1, Math.floor(buffer.length / 50));
  for (let i = 20; i < buffer.length - 3; i += step) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    
    // Convert to hex
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    sampledHexes.add(hex);
    if (sampledHexes.size >= 5) break;
  }

  return Array.from(sampledHexes);
}

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const file = req.file;
  const ext = path.extname(file.originalname).toLowerCase();
  let extractedText = '';
  let format: 'text' | 'document' | 'image' = 'document';
  let colors: string[] = [];

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text || '';
      format = 'document';
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = result.value || '';
      format = 'document';
    } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      format = 'image';
      const imgBuffer = fs.readFileSync(file.path);
      colors = sampleImageColors(imgBuffer);
      extractedText = `[Uploaded Image: ${file.originalname}]`;
    } else if (['.txt', '.md', '.markdown'].includes(ext)) {
      extractedText = fs.readFileSync(file.path, 'utf8');
      format = 'text';
    } else {
      extractedText = fs.readFileSync(file.path, 'utf8');
      format = 'text';
    }

    res.json({
      success: true,
      filename: file.filename,
      originalName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      size: file.size,
      format,
      extractedText: extractedText.trim(),
      sampledColors: colors
    });
  } catch (err: any) {
    console.error('File parsing error:', err);
    res.status(500).json({
      error: 'Failed to process and extract text from file',
      details: err.message
    });
  }
});

export default router;
