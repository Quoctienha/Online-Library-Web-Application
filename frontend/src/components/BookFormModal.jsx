import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import noImage from '../assets/no-image.jpg';

const BookFormModal = ({
  showModal,
  closeModal,
  handleSubmit,
  formData,
  handleInputChange,
  handleFileChange,
  coverPreview,
  files,
  editingBook,
  submitting
}) => {
  if (!showModal) return null;

  return (
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
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tác giả <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="author"
              required
              value={formData.author}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả (500 ký tự) <span className="text-red-500">*</span>
            </label>
            <textarea
              maxLength="500"
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thể loại<span className="text-red-500">*</span></label>
              <input
                type="text"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Vietnamese</option>
                <option>English</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Năm xuất bản</label>
              <input
                type="number"
                name="publishYear"
                value={formData.publishYear}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số trang</label>
              <input
                type="number"
                name="pageCount"
                value={formData.pageCount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh bìa {editingBook ? '(bỏ qua để giữ nguyên)' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                accept="image/*"
                name="coverImage"
                onChange={handleFileChange}
                className="w-full"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Preview"
                  className="mt-2 h-28 object-contain rounded"
                  onError={(e) => { e.currentTarget.src = noImage; }}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File PDF {editingBook ? '(bỏ qua để giữ)' : <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                accept="application/pdf"
                name="pdfFile"
                onChange={handleFileChange}
                className="w-full"
              />
              {files.pdfFile && <div className="mt-2 text-sm text-gray-500 truncate">{files.pdfFile.name}</div>}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-md border border-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (editingBook ? 'Đang cập nhật...' : 'Đang thêm...') : (editingBook ? 'Cập nhật' : 'Thêm sách')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookFormModal;