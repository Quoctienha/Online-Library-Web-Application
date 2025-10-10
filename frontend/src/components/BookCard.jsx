import React from 'react';
import { Link } from 'react-router-dom';
import noImage from '../assets/no-image.jpg';

const BookCard = ({ book }) => {
  return (
    <Link
      to={`/books/${book._id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-200">
        <img
          src={`http://localhost:3000/uploads/covers/${book.coverImage}`}
          alt={book.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = noImage;
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">{book.author}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{book.category}</span>
          <span>{book.downloadCount} lượt tải</span>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;