import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, bookAPI } from '../services/api';
import { toast, Slide } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
    // set preview to existing cover path if available
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
            <h3 className="text-gray-500 text-sm font-medium">Tổng số sách</h3>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.totalBooks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Tổng lượt tải</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalDownloads}</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Thêm sách mới
        </button>
      </div>

      {/* Books Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sách</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tác giả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thể loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt tải</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Chưa có sách nào</td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={book.coverImage ? `http://localhost:3000/uploads/covers/${book.coverImage}` : 'https://via.placeholder.com/48x64?text=No+Image'}
                          alt={book.title}
                          className="h-16 w-12 object-cover rounded"
                          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/48x64?text=No+Image'; }}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{book.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{book.author}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.downloadCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(book)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Chỉnh sửa">
                        <PencilIcon className="h-5 w-5 inline" />
                      </button>
                      <button onClick={() => handleDelete(book._id)} className="text-red-600 hover:text-red-900" title="Xóa">
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{editingBook ? 'Cập nhật sách' : 'Thêm sách mới'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input type="text" name="title" required value={formData.title} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input type="text" name="author" required value={formData.author} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                  <select name="language" value={formData.language} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Vietnamese</option>
                    <option>English</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Năm xuất bản</label>
                  <input type="number" name="publishYear" value={formData.publishYear} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số trang</label>
                  <input type="number" name="pageCount" value={formData.pageCount} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh bìa {editingBook ? '(bỏ qua để giữ nguyên)' : <span className="text-red-500">*</span>}</label>
                  <input type="file" accept="image/*" name="coverImage" onChange={handleFileChange}
                    className="w-full" />
                  {coverPreview && (
                    <img src={coverPreview} alt="Preview" className="mt-2 h-28 object-contain rounded" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/128x180?text=No+Image'; }} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File PDF {editingBook ? '(bỏ qua để giữ)' : <span className="text-red-500">*</span>}</label>
                  <input type="file" accept="application/pdf" name="pdfFile" onChange={handleFileChange} className="w-full" />
                  {files.pdfFile && <div className="mt-2 text-sm text-gray-500 truncate">{files.pdfFile.name}</div>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-md border border-gray-300">Hủy</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? (editingBook ? 'Đang cập nhật...' : 'Đang thêm...') : (editingBook ? 'Cập nhật' : 'Thêm sách')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
