import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Book from '../models/Book.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// ES6 __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory (backend/)
const rootDir = path.join(__dirname, '../../');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Đường dẫn tuyệt đối đến uploads folder
    const uploadPath = file.fieldname === 'coverImage' 
      ? path.join(rootDir, 'uploads/covers')
      : path.join(rootDir, 'uploads/pdfs');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'coverImage') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'), false);
    }
  } else if (file.fieldname === 'pdfFile') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF'), false);
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Apply admin middleware to all routes
router.use(verifyToken, isAdmin);

// @route   POST /api/admin/books
router.post('/books', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.coverImage || !req.files.pdfFile) {
      return res.status(400).json({ message: 'Vui lòng tải lên ảnh bìa và file PDF' });
    }

    const { title, author, description, category, publishYear, pageCount, language } = req.body;

    const book = await Book.create({
      title,
      author,
      description,
      category,
      coverImage: req.files.coverImage[0].filename,
      pdfFile: req.files.pdfFile[0].filename,
      publishYear: publishYear || undefined,
      pageCount: pageCount || undefined,
      language: language || 'Vietnamese',
      uploadedBy: req.user._id
    });

    res.status(201).json({ 
      message: 'Thêm sách thành công', 
      book 
    });
  } catch (error) {
    console.error('Create book error:', error);
    
    // Delete uploaded files if book creation fails
    if (req.files) {
      if (req.files.coverImage) {
        const coverPath = path.join(rootDir, 'uploads/covers', req.files.coverImage[0].filename);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }
      if (req.files.pdfFile) {
        const pdfPath = path.join(rootDir, 'uploads/pdfs', req.files.pdfFile[0].filename);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      }
    }
    
    res.status(500).json({ message: 'Lỗi khi thêm sách' });
  }
});

// @route   PUT /api/admin/books/:id
router.put('/books/:id', upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    const { title, author, description, category, publishYear, pageCount, language } = req.body;

    book.title = title || book.title;
    book.author = author || book.author;
    book.description = description || book.description;
    book.category = category || book.category;
    book.publishYear = publishYear || book.publishYear;
    book.pageCount = pageCount || book.pageCount;
    book.language = language || book.language;

    // Update cover image if new one uploaded
    if (req.files && req.files.coverImage) {
      const oldCoverPath = path.join(rootDir, 'uploads/covers', book.coverImage);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
      book.coverImage = req.files.coverImage[0].filename;
    }

    // Update PDF file if new one uploaded
    if (req.files && req.files.pdfFile) {
      const oldPdfPath = path.join(rootDir, 'uploads/pdfs', book.pdfFile);
      if (fs.existsSync(oldPdfPath)) {
        fs.unlinkSync(oldPdfPath);
      }
      book.pdfFile = req.files.pdfFile[0].filename;
    }

    await book.save();

    res.json({ 
      message: 'Cập nhật sách thành công', 
      book 
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật sách' });
  }
});

// @route   DELETE /api/admin/books/:id
router.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    // Delete cover image
    const coverPath = path.join(rootDir, 'uploads/covers', book.coverImage);
    if (fs.existsSync(coverPath)) {
      fs.unlinkSync(coverPath);
    }

    // Delete PDF file
    const pdfPath = path.join(rootDir, 'uploads/pdfs', book.pdfFile);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa sách' });
  }
});

// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalDownloads = await Book.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);

    res.json({
      totalBooks,
      totalDownloads: totalDownloads[0]?.total || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;