import React from 'react';
import { X, Info, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Question } from '../data/content';

interface QuestionModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onHashtagClick: (tag: string) => void;
  onVote: (questionTitle: string, voteType: 'like' | 'dislike') => void; // Добавлено
  onToggleFavorite: (question: Question) => void; // Добавлено
  isFavorite: boolean; // Добавлено
  likes?: number; // Добавлено
  dislikes?: number; // Добавлено
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  question,
  isOpen,
  onClose,
  onHashtagClick,
  onVote,
  onToggleFavorite,
  isFavorite,
  likes = 0,
  dislikes = 0,
}) => {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 border border-cyan-500/30 
                    rounded-lg shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">{question.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Image if exists */}
          {question.image && (
            <div className="mb-6">
              <img 
                src={question.image} 
                alt={question.title}
                className="w-full h-64 object-cover rounded-lg border border-gray-700"
              />
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed whitespace-pre-line">
              {question.content}
            </div>
            
            {question.links && question.links.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-semibold text-cyan-400">Полезные ссылки:</h3>
                <div className="space-y-2">
                  {question.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg
                               hover:border-cyan-500/50 hover:bg-gray-700/50 transition-all duration-300
                               text-cyan-400 hover:text-cyan-300"
                    >
                      {link.icon && (
                        <span className="text-cyan-400">
                          {link.icon}
                        </span>
                      )}
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {question.tags && question.tags.length > 0 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 
                               rounded-full text-sm text-purple-300 cursor-pointer
                               hover:bg-purple-800/40 hover:border-purple-400/50 transition-all"
                      onClick={() => {
                        onHashtagClick(tag);
                        onClose();
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vote and Favorite Section */}
            <div className="mt-6 flex items-center space-x-4">
              <button
                onClick={() => onVote(question.title, 'like')}
                className="flex items-center space-x-2 bg-green-600/30 border border-green-500/50 rounded-lg px-3 py-1 hover:bg-green-500/50 transition-colors"
              >
                <ThumbsUp className="w-5 h-5" />
                <span>{likes}</span>
              </button>
              <button
                onClick={() => onVote(question.title, 'dislike')}
                className="flex items-center space-x-2 bg-red-600/30 border border-red-500/50 rounded-lg px-3 py-1 hover:bg-red-500/50 transition-colors"
              >
                <ThumbsDown className="w-5 h-5" />
                <span>{dislikes}</span>
              </button>
              <button
                onClick={() => onToggleFavorite(question)}
                className={`p-2 rounded-full ${isFavorite ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-500 hover:bg-gray-700'}`}
              >
                <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;