import axiosInstance from './axiosInstance';

export const bookAPI = {
  getAll: (params) => axiosInstance.get('/api/books', { params }),
  getById: (id) => axiosInstance.get(`/api/books/${id}`),
  download: (id) => axiosInstance.post(`/api/books/${id}/download`),
  getCategories: () => axiosInstance.get('/api/books/categories/list')
};

export const adminAPI = {
  createBook: (formData) => axiosInstance.post('/api/admin/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateBook: (id, formData) => axiosInstance.put(`/api/admin/books/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteBook: (id) => axiosInstance.delete(`/api/admin/books/${id}`),
  getStats: () => axiosInstance.get('/api/admin/stats')
};