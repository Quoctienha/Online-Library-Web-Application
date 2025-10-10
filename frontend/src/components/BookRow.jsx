import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import noImage from '../assets/no-image.jpg';

const BookRow = ({ book, handleEdit, handleDelete }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={book.coverImage ? `http://localhost:3000/uploads/covers/${book.coverImage}` : noImage}
            alt={book.title}
            className="h-16 w-12 object-cover rounded"
            onError={(e) => { e.currentTarget.src = noImage; }}
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
  );
};

export default BookRow;