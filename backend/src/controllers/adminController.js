import fs from 'fs';
import path from 'path';
import Book from '../models/Book.js';
import { getRootDir } from '../config/multerConfig.js';

// Create a new book
export const createBook = async (req, res) => {
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
      bookLanguage: language || 'Vietnamese',
      uploadedBy: req.user._id
    });

    res.status(201).json({ 
      message: 'Thêm sách thành công', 
      book 
    });
  } catch (error) {
    console.error('Create book error:', error);
    
    // Delete uploaded files if book creation fails
    const rootDir = getRootDir();
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
};

// Update an existing book
export const updateBook = async (req, res) => {
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
    book.bookLanguage = language || book.bookLanguage;

    const rootDir = getRootDir();
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
      const oldPdfPath = path.join(rootDir, 'Uploads/pdfs', book.pdfFile);
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
};

// Delete a book
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    const rootDir = getRootDir();
    // Delete cover image
    const coverPath = path.join(rootDir, 'uploads/covers', book.coverImage);
    if (fs.existsSync(coverPath)) {
      fs.unlinkSync(coverPath);
    }

    // Delete PDF file
    const pdfPath = path.join(rootDir, 'Uploads/pdfs', book.pdfFile);
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({ message: 'Xóa sách thành công' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa sách' });
  }
};

// Get admin statistics
export const getStats = async (req, res) => {
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
};