import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative max-w-2xl mx-4 bg-gray-900 border border-red-500/50 rounded-lg shadow-2xl shadow-red-500/20 animate-pulse">
        {/* Glitch effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-yellow-500/10 rounded-lg animate-pulse"></div>
        
        <div className="relative p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-400 animate-bounce" />
            <h2 className="text-2xl font-bold text-red-400">ВНИМАНИЕ!</h2>
            <AlertTriangle className="w-8 h-8 text-red-400 animate-bounce" />
          </div>

          {/* Warning text */}
          <div className="space-y-4 text-center">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <p className="text-lg text-white leading-relaxed">
                Вся информация на сайте предоставляется <span className="text-red-400 font-bold">"как есть"</span>.
              </p>
              <p className="text-lg text-white leading-relaxed mt-2">
                Никто, кроме вас, не несет ответственности за использование этой информации.
              </p>
              <p className="text-lg text-white leading-relaxed mt-2">
                <span className="text-yellow-400 font-bold">Читайте на свой риск</span> - данные могут быть неточными!
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Это неофициальный фанатский проект</span>
            </div>
          </div>

          {/* Accept button */}
          <div className="flex justify-center">
            <button
              onClick={onAccept}
              className="group relative px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600
                       text-white font-bold rounded-lg hover:from-cyan-500 hover:to-purple-500
                       transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                       hover:shadow-cyan-500/25"
            >
              <span className="relative z-10">Я согласен(а)</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400
                            rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Additional warning */}
          <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-4">
            Нажимая "Я согласен(а)", вы подтверждаете, что понимаете риски и принимаете полную ответственность 
            за использование информации с данного сайта.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;