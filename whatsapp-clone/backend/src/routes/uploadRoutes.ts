import express, { Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

export default router;
