import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookAPI } from '../services/api';
import { toast, Slide } from 'react-toastify';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchBookDetail();
  }, [id]);

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      const res = await bookAPI.getById(id);
      setBook(res.data);
    } catch (error) {
      toast.error('Không thể tải thông tin sách', {
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
      
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để tải sách', {
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
      
      navigate('/login');
      return;
    }

    try {
      setDownloading(true);
      const res = await bookAPI.download(id);
      
      // Open PDF in new tab
      window.open(res.data.downloadUrl, '_blank');
      toast.success('Đang tải xuống...', {
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
      
      // Refresh book detail to update download count
      fetchBookDetail();
    } catch (error) {
      toast.error('Không thể tải xuống sách', {
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
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Không tìm thấy sách</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Quay lại
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Left side - Cover Image */}
          <div className="md:w-1/3 p-8 bg-gray-50">
            <img
              src={`http://localhost:3000/uploads/covers/${book.coverImage}`}
              alt={book.title}
              className="w-full rounded-lg shadow-md"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
              }}
            />
            
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full mt-6 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {downloading ? 'Đang tải...' : 'Tải xuống PDF'}
            </button>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Lượt tải:</span>
                <span className="font-semibold text-gray-900">{book.downloadCount}</span>
              </div>
              
              {book.pageCount && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Số trang:</span>
                  <span className="font-semibold text-gray-900">{book.pageCount}</span>
                </div>
              )}
              
              {book.publishYear && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Năm xuất bản:</span>
                  <span className="font-semibold text-gray-900">{book.publishYear}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Ngôn ngữ:</span>
                <span className="font-semibold text-gray-900">{book.bookLanguage}</span>
              </div>
            </div>
          </div>

          {/* Right side - Book Info */}
          <div className="md:w-2/3 p-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {book.category}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {book.title}
            </h1>

            <p className="text-xl text-gray-700 mb-6">
              Tác giả: <span className="font-semibold">{book.author}</span>
            </p>

            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Mô tả
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-500">
                Được tải lên bởi: {book.uploadedBy?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500">
                Ngày tải lên: {new Date(book.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;