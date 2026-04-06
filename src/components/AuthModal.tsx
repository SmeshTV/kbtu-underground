import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Для анимации модалки
import { X, Mail, Lock, UserPlus, LogIn, Check, XCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Валидация email в реальном времени
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  // Таймер повторной отправки письма
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError('Подтвердите email! Проверьте почту.');
          await auth.signOut();
          setLoading(false);
          return;
        }
        onAuthSuccess();
      } else {
        if (password !== confirmPassword) {
          setError('Пароли не совпадают');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Пароль должен содержать минимум 6 символов');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await auth.signOut();
        setSuccessMessage('Письмо отправлено! Проверьте почту.');
        setResendTimer(60); // Таймер 60 секунд
        resetForm();
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setError(err.code === 'auth/email-already-in-use' ? 'Email уже зарегистрирован' :
        err.code === 'auth/invalid-email' ? 'Неверный формат email' :
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' ? 'Неверный email или пароль' :
        err.code === 'auth/weak-password' ? 'Слишком простой пароль' :
        err.code === 'auth/invalid-credential' ? 'Неверный email или пароль' :
        `Ошибка: ${err.code || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Сброс формы
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  // Переключение режима
  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    resetForm();
  };

  // Повторная отправка письма
  const resendVerification = async () => {
    if (resendTimer === 0) {
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setSuccessMessage('Письмо повторно отправлено!');
        setResendTimer(60);
      } catch (err) {
        setError('Ошибка при отправке письма.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Восстановление пароля
  const handleResetPassword = async () => {
  if (!email) {
    setError('Введите email для сброса пароля.');
    return;
  }
  setLoading(true);
  setError('');
  try {
    await sendPasswordResetEmail(auth, email);
    setSuccessMessage('Ссылка для сброса пароля отправлена на email!');
  } catch (err: any) {
    console.error('Reset Password Error:', err.code, err.message);
    setError(
      err.code === 'auth/invalid-email'
        ? 'Неверный формат email.'
        : err.code === 'auth/user-not-found'
        ? 'Пользователь с таким email не найден.'
        : err.code === 'auth/network-request-failed'
        ? 'Ошибка сети. Проверьте подключение.'
        : err.code === 'auth/operation-not-allowed'
        ? 'Сброс пароля отключён в настройках Firebase.'
        : err.code === 'auth/missing-action-code'
        ? 'Action URL для сброса пароля не настроен.'
        : 'Ошибка при отправке ссылки. Проверьте настройки.'
    );
  } finally {
    setLoading(false);
  }
};

  // Обработчик Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) handleSubmit(e);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative max-w-md w-full mx-4 bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                {isLoginMode ? (
                  <>
                    <LogIn className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Вход</h2>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold text-white">Регистрация</h2>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
                  {successMessage}
                  {!isLoginMode && resendTimer > 0 && (
                    <span> (Повторить через {resendTimer}s)</span>
                  )}
                  {!isLoginMode && resendTimer === 0 && (
                    <button
                      type="button"
                      onClick={resendVerification}
                      className="ml-2 text-green-300 hover:text-green-200"
                    >
                      Повторить
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white
                             focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="example@mail.com"
                    required
                    disabled={loading}
                  />
                  {email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailValid ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white
                             focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Введите пароль"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white
                               focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="Подтвердите пароль"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center
                          ${isLoginMode
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                  } hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {loading ? 'Загрузка...' : isLoginMode ? 'Войти' : 'Зарегистрироваться'}
              </button>

              {isLoginMode && (
  <button
    type="button"
    onClick={handleResetPassword}
    disabled={loading}
    className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
  >
    Забыли пароль?
  </button>
)}

              <div className="text-center">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  {isLoginMode ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                </button>
              </div>
            </form>

            {/* Info */}
            <div className="px-6 pb-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
                <p>ℹ️ После регистрации проверьте почту и подтвердите email</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;