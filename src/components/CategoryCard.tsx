import React from 'react';
import { Star } from 'lucide-react';

interface CategoryCardProps {
  category: any;
  onClick: () => void;
  questionsCount?: number;
  subcategoriesCount?: number;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onClick,
  questionsCount = 0,
  subcategoriesCount = 0,
  onToggleFavorite,
  isFavorite,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when favoriting
    onToggleFavorite();
  };

  return (
    <div
      className="group bg-gray-900/50 border border-gray-700 rounded-lg p-6 cursor-pointer
        hover:border-cyan-500/50 hover:bg-gray-800/50 transition-all duration-300
        hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          {category.icon}
          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
            {category.title}
          </h3>
        </div>
        <button
          onClick={handleFavoriteClick}
          className={`p-1 rounded-full transition-colors ${
            isFavorite ? 'text-yellow-400 bg-yellow-400/20' : 'text-gray-500 hover:bg-gray-700'
          }`}
          aria-label="Toggle favorite"
        >
          <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      
      {/* TL;DR for long descriptions */}
      <p className="text-gray-400 text-sm mb-2">
        {category.tldr || (category.description.length > 120
          ? `${category.description.slice(0, 120)}...`
          : category.description)}
      </p>

      {/* Counts and ratings */}
      <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
        <div className="flex space-x-4">
          <span className="flex items-center space-x-1">
            <span>Вопросов:</span>
            <span className="text-lg font-bold text-cyan-400">{questionsCount}</span>
          </span>
          <span className="flex items-center space-x-1">
            <span>Вкладок:</span>
            <span className="text-lg font-bold text-purple-400">{subcategoriesCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;