import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, bookAPI } from '../services/api';
import { toast, Slide } from 'react-toastify';
import { PlusIcon } from '@heroicons/react/24/outline';
import StatsSection from '../components/StatsSection';
import BooksTable from '../components/BooksTable';
import BookFormModal from '../components/BookFormModal';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({ totalBooks: 0, totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    publishYear: '',
    pageCount: '',
    language: 'Vietnamese'
  });

  const [files, setFiles] = useState({
    coverImage: null,
    pdfFile: null
  });

  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    if (!isAdmin || !isAdmin()) {
      navigate('/');
      return;
    }
    fetchBooks();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isAdmin]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await bookAPI.getAll({ limit: 100 });
      setBooks(res.data.books || []);
    } catch (error) {
      toast.error('Không thể tải danh sách sách', {
        position: "top-left",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data || { totalBooks: 0, totalDownloads: 0 });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: chosen } = e.target;
    if (!chosen || chosen.length === 0) return;
    const file = chosen[0];
    setFiles(prev => ({ ...prev, [name]: file }));

    if (name === 'coverImage') {
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      category: '',
      publishYear: '',
      pageCount: '',
      language: 'Vietnamese'
    });
    setFiles({ coverImage: null, pdfFile: null });
    setEditingBook(null);
    setCoverPreview(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!editingBook && (!files.coverImage || !files.pdfFile)) {
      toast.error('Vui lòng tải lên ảnh bìa và file PDF', {
        position: "top-left",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
      return;
    }
    if (!formData.title || !formData.author || !formData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc', {
        position: "top-left",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
      return;
    }

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    if (files.coverImage) submitData.append('coverImage', files.coverImage);
    if (files.pdfFile) submitData.append('pdfFile', files.pdfFile);

    try {
      setSubmitting(true);
      if (editingBook) {
        await adminAPI.updateBook(editingBook._id, submitData);
        toast.success('Cập nhật sách thành công', {
          position: "top-left",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Slide,
        });
      } else {
        await adminAPI.createBook(submitData);
        toast.success('Thêm sách thành công', {
          position: "top-left",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Slide,
        });
      }
      closeModal();
      await fetchBooks();
      await fetchStats();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra', {
        position: "top-left",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      category: book.category || '',
      publishYear: book.publishYear || '',
      pageCount: book.pageCount || '',
      language: book.language || 'Vietnamese'
    });
    if (book.coverImage) {
      setCoverPreview(`http://localhost:3000/uploads/covers/${book.coverImage}`);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sách này?')) return;
    try {
      await adminAPI.deleteBook(id);
      toast.success('Xóa sách thành công', {
        position: "top-left",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
      fetchBooks();
      fetchStats();
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa sách', {
        position: "top-left",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        transition: Slide,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quản trị sách</h1>
        <StatsSection stats={stats} />
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Thêm sách mới
        </button>
      </div>

      <BooksTable books={books} handleEdit={handleEdit} handleDelete={handleDelete} />

      <BookFormModal
        showModal={showModal}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        formData={formData}
        handleInputChange={handleInputChange}
        handleFileChange={handleFileChange}
        coverPreview={coverPreview}
        files={files}
        editingBook={editingBook}
        submitting={submitting}
      />
    </div>
  );
};

export default AdminDashboard;