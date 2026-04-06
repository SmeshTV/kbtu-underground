import { useState, useEffect, useCallback } from 'react';
import { Shield, Terminal, Users, Lightbulb, ChevronRight, Eye, EyeOff, X, Star, User, LogIn, UserPlus, Zap, Calendar as CalendarIcon } from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import DisclaimerModal from './components/DisclaimerModal';
import GlitchText from './components/GlitchText';
import CategoryCard from './components/CategoryCard';
import QuestionModal from './components/QuestionModal';
import AuthModal from './components/AuthModal';
import Schedule from './components/Schedule';
import { categories as initialCategories, Question, Category } from './data/content';
import { supabase, getFavorites, addFavorite, removeFavorite, Favorite, submitVote, removeVote, getUserVotes, getStories, addStory, getAllVotes } from './supabase';
import { requestNotificationPermission, scheduleAllNotifications, checkUpcomingEvents } from './utils/notifications';

// Helper to get or create a unique user ID
const getUserId = (): string => {
  let userId = localStorage.getItem('kbtu-underground-userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('kbtu-underground-userId', userId);
  }
  return userId;
};

function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  
  // Easter egg state
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [easterEggCount, setEasterEggCount] = useState(0);
  
  // State for dynamic content, initialized from localStorage or initial data
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  // State for user-submitted stories, loaded from Supabase
  const [stories, setStories] = useState<Array<{ id: string; text: string; date: string; user_id: string }>>([]);
  const [newStory, setNewStory] = useState('');

  // State for user votes, loaded from Supabase
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike'>>({});

  // State for modals
  const [showMap, setShowMap] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State for favorites, loaded from Supabase
  const [favorites, setFavorites] = useState<{ questions: Question[]; categories: Category[] }>({ questions: [], categories: [] });
  const [showFavorites, setShowFavorites] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Load favorites from Supabase
  const loadFavorites = useCallback(async (userId: string) => {
    if (!userId) {
      setFavorites({ questions: [], categories: [] });
      return;
    }

    setFavoritesLoading(true);
    try {
      const favs = await getFavorites(userId);
      const questions: Question[] = [];
      const categories: Category[] = [];

      favs.forEach(fav => {
        if (fav.item_type === 'question') {
          questions.push(fav.item_data as Question);
        } else if (fav.item_type === 'category') {
          categories.push(fav.item_data as Category);
        }
      });

      setFavorites({ questions, categories });
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  // Общая функция для скачивания файлов
  const handleDownload = (fileName: string) => {
    const link = document.createElement('a');
    link.href = `/files/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ensure user ID is set
  useEffect(() => {
    getUserId();
  }, []);

  // Обновляет счётчики голосов в вопросах из Supabase
  const updateQuestionVotes = (allVotes: any[]) => {
    const voteCounts: Record<string, { likes: number; dislikes: number }> = {};
    allVotes.forEach(v => {
      if (!voteCounts[v.question_title]) {
        voteCounts[v.question_title] = { likes: 0, dislikes: 0 };
      }
      if (v.vote_type === 'like') voteCounts[v.question_title].likes++;
      else voteCounts[v.question_title].dislikes++;
    });

    const traverse = (cats: Category[]) => {
      for (const cat of cats) {
        if (cat.questions) {
          for (const q of cat.questions) {
            if (voteCounts[q.title]) {
              q.likes = voteCounts[q.title].likes;
              q.dislikes = voteCounts[q.title].dislikes;
            }
          }
        }
        if (cat.subcategories) traverse(cat.subcategories);
      }
    };

    traverse(categories);
    setCategories([...categories]);
  };

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);

      if (user) {
        // Load user's favorites from Supabase
        await loadFavorites(user.uid);

        // Load ONLY current user's votes for UI highlighting
        const myVotes = await getUserVotes(user.uid);
        const userVoteMap: Record<string, 'like' | 'dislike'> = {};
        myVotes.forEach(v => {
          userVoteMap[v.question_title] = v.vote_type;
        });
        setUserVotes(userVoteMap);

        // Load ALL votes for global counters
        const allVotes = await getAllVotes();
        updateQuestionVotes(allVotes);

        // Load all stories
        const allStories = await getStories();
        const formattedStories = allStories.map(s => ({
          id: s.id,
          text: s.text,
          date: new Date(s.created_at).toLocaleString('ru-RU'),
          user_id: s.user_id,
        }));
        setStories(formattedStories);

        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          const { data: events } = await supabase
            .from('events')
            .select('*')
            .eq('user_id', user.uid);

          if (events) {
            scheduleAllNotifications(events);

            const checkInterval = setInterval(() => {
              checkUpcomingEvents(events);
            }, 60000);

            return () => clearInterval(checkInterval);
          }
        }
      } else {
        // Clear favorites when logged out
        setFavorites({ questions: [], categories: [] });
        setUserVotes({});
        setStories([]);
      }
    });

    return () => unsubscribe();
  }, [loadFavorites]);

  // On mount, merge vote counts from localStorage into initialCategories
  useEffect(() => {
    const questionVotes = JSON.parse(localStorage.getItem('questionVotes') || '{}');
    if (Object.keys(questionVotes).length > 0) {
      const traverse = (cats: Category[]) => {
        for (const cat of cats) {
          if (cat.questions) {
            for (const q of cat.questions) {
              if (questionVotes[q.title]) {
                q.likes = questionVotes[q.title].likes;
                q.dislikes = questionVotes[q.title].dislikes;
              }
            }
          }
          if (cat.subcategories) traverse(cat.subcategories);
        }
      };
      traverse(initialCategories);
      setCategories([...initialCategories]);
    }
  }, []);

  // Modified useEffect for disclaimer to ensure content visibility
  useEffect(() => {
    const disclaimerAccepted = localStorage.getItem('disclaimerAccepted');
    if (disclaimerAccepted === 'true') {
      setShowDisclaimer(false);
      // Add slight delay to ensure content renders after disclaimer check
      setTimeout(() => setIsContentVisible(true), 100);
    } else {
      setShowDisclaimer(true);
      setIsContentVisible(false);
    }
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleSelectStart = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard?.writeText('');
      }
    };
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  const handleDisclaimerAccept = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setShowDisclaimer(false);
    setTimeout(() => setIsContentVisible(true), 500);
  };

  const handleCategoryClick = (categoryId: string) => {
    setNavigationPath([...navigationPath, categoryId]);
  };

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
  };

  const handleBack = () => {
    const newPath = [...navigationPath];
    newPath.pop();
    setNavigationPath(newPath);
  };

  const handleHomeClick = () => {
    setNavigationPath([]);
    setSearchTerm('');
  };

  const getCurrentCategory = (): Category | null => {
    let current: Category | null = null;
    let searchIn = categories;
    for (const pathId of navigationPath) {
      current = searchIn.find(cat => cat.id === pathId) || null;
      if (!current) break;
      searchIn = current.subcategories || [];
    }
    return current;
  };

  const getCurrentQuestions = (): Question[] => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return [];
    if (currentCategory.id === 'academic' && currentCategory.subcategories) {
      let questions: Question[] = currentCategory.questions ? [...currentCategory.questions] : [];
      currentCategory.subcategories.forEach(subcat => {
        if (subcat.id !== 'disciplines' && subcat.questions) {
          questions = questions.concat(subcat.questions);
        }
      });
      return questions;
    }
    return currentCategory.questions || [];
  };

  const getCurrentSubcategories = (): Category[] => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return [];
    if (currentCategory.id === 'academic' && currentCategory.subcategories) {
      return currentCategory.subcategories;
    }
    return currentCategory.subcategories || [];
  };

  const getQuestionsCount = (category: Category): number => {
    if (category.id === 'academic' && category.subcategories) {
      let count = category.questions ? category.questions.length : 0;
      category.subcategories.forEach(subcat => {
        if (subcat.id !== 'disciplines' && subcat.questions) {
          count += subcat.questions.length;
        }
      });
      return count;
    }
    return category.questions ? category.questions.length : 0;
  };

  const getSubcategoriesCount = (category: Category): number => {
    return category.subcategories ? category.subcategories.length : 0;
  };

  const filterQuestions = (questions: Question[]) => {
    if (!searchTerm.trim()) return questions;
    const term = searchTerm.toLowerCase().replace(/^#/, '');
    return questions.filter(q =>
      q.title.toLowerCase().includes(term) ||
      q.preview.toLowerCase().includes(term) ||
      (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  };

  const filterCategories = (cats: Category[]) => {
    if (!searchTerm.trim()) return cats;
    const term = searchTerm.toLowerCase().replace(/^#/, '');
    return cats.filter(cat =>
      cat.title.toLowerCase().includes(term) ||
      cat.description.toLowerCase().includes(term) ||
      (cat.questions && cat.questions.some(q =>
        q.title.toLowerCase().includes(term) ||
        q.preview.toLowerCase().includes(term) ||
        (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))
      )) ||
      (cat.subcategories && cat.subcategories.some(sub =>
        sub.title.toLowerCase().includes(term) ||
        sub.description.toLowerCase().includes(term)
      ))
    );
  };

  const highlight = (text: string, term: string) => {
    if (!term) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), match => `<mark class="bg-yellow-400 text-black rounded px-1">${match}</mark>`);
  };

  const handleHashtagClick = (tag: string) => {
    setSearchTerm(`#${tag}`);
    setNavigationPath([]);
  };

  function deepSearch(term: string, cats: Category[]) {
    const foundQuestions: Array<{ question: Question; path: string[] }> = [];
    const foundCategories: Array<{ category: Category; path: string[] }> = [];
    function searchCategory(cat: Category, path: string[]) {
      const lowerTerm = term.toLowerCase();
      if (cat.title.toLowerCase().includes(lowerTerm) || cat.description.toLowerCase().includes(lowerTerm)) {
        foundCategories.push({ category: cat, path });
      }
      if (cat.questions) {
        cat.questions.forEach(q => {
          if (q.title.toLowerCase().includes(lowerTerm) || q.preview.toLowerCase().includes(lowerTerm) || q.content.toLowerCase().includes(lowerTerm) || (q.tags && q.tags.some(tag => tag.toLowerCase().includes(term)))) {
            foundQuestions.push({ question: q, path: [...path, cat.title] });
          }
        });
      }
      if (cat.subcategories) {
        cat.subcategories.forEach(sub => searchCategory(sub, [...path, cat.title]));
      }
    }
    cats.forEach(cat => searchCategory(cat, []));
    return { foundQuestions, foundCategories };
  }

  const toggleFavoriteQuestion = async (question: Question) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const isFavorite = favorites.questions.some(q => q.title === question.title);

    if (isFavorite) {
      await removeFavorite(currentUser.uid, 'question', question.title);
      setFavorites(fav => ({
        ...fav,
        questions: fav.questions.filter(q => q.title !== question.title)
      }));
    } else {
      await addFavorite(currentUser.uid, 'question', question.title, question);
      setFavorites(fav => ({
        ...fav,
        questions: [...fav.questions, question]
      }));
    }
  };

  const toggleFavoriteCategory = async (category: Category) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const isFavorite = favorites.categories.some(c => c.id === category.id);

    if (isFavorite) {
      await removeFavorite(currentUser.uid, 'category', category.id);
      setFavorites(fav => ({
        ...fav,
        categories: fav.categories.filter(c => c.id !== category.id)
      }));
    } else {
      await addFavorite(currentUser.uid, 'category', category.id, category);
      setFavorites(fav => ({
        ...fav,
        categories: [...fav.categories, category]
      }));
    }
  };

  const currentCategory = getCurrentCategory();
  const isAtRoot = navigationPath.length === 0;
  const searchActive = !!searchTerm.trim();
  const searchTermClean = searchTerm.toLowerCase().replace(/^#/, '');
  const searchResults = searchActive ? deepSearch(searchTermClean, categories) : null;

  // Helper function to find the path to a question
  const findQuestionPath = (questionTitle: string): string[] => {
    const searchInCategories = (cats: Category[], currentPath: string[]): string[] | null => {
      for (const cat of cats) {
        const newPath = [...currentPath, cat.id];
        
        // Check if question is in this category
        if (cat.questions && cat.questions.some(q => q.title === questionTitle)) {
          return newPath;
        }
        
        // Check subcategories
        if (cat.subcategories) {
          const found = searchInCategories(cat.subcategories, newPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    return searchInCategories(categories, []) || [];
  };

  // Navigate to a favorite question
  const navigateToFavoriteQuestion = (question: Question) => {
    const path = findQuestionPath(question.title);
    if (path.length > 0) {
      setNavigationPath(path);
      setSelectedQuestion(question);
    } else {
      // If path not found, just open the question
      setSelectedQuestion(question);
    }
    setShowFavorites(false);
  };

  // Navigate to a favorite category
  const navigateToFavoriteCategory = (category: Category) => {
    const path = [category.id];
    setNavigationPath(path);
    setShowFavorites(false);
  };

  const handleVote = async (questionTitle: string, voteType: 'like' | 'dislike') => {
    if (!isAuthenticated || !currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Обновляем локально для мгновенного UI
    let updatedQuestion: Question | null = null;
    let questionFound = false;

    const traverse = (cats: Category[]) => {
      for (const cat of cats) {
        if (cat.questions) {
          for (const q of cat.questions) {
            if (q.title === questionTitle) {
              questionFound = true;
              const currentVote = userVotes[questionTitle];
              let likes = q.likes || 0;
              let dislikes = q.dislikes || 0;

              if (currentVote === voteType) {
                // Снимаем голос
                voteType === 'like' ? likes-- : dislikes--;
                setUserVotes(prev => { const next = {...prev}; delete next[questionTitle]; return next; });
              } else {
                // Меняем голос или ставим новый
                if (currentVote === 'like') likes--;
                if (currentVote === 'dislike') dislikes--;
                voteType === 'like' ? likes++ : dislikes++;
                setUserVotes(prev => ({ ...prev, [questionTitle]: voteType }));
              }
              q.likes = likes < 0 ? 0 : likes;
              q.dislikes = dislikes < 0 ? 0 : dislikes;
              updatedQuestion = q;
              return;
            }
          }
        }
        if (cat.subcategories && !questionFound) {
          traverse(cat.subcategories);
        }
      }
    };

    traverse(categories);
    setCategories([...categories]);

    // Сохраняем в Supabase
    const currentVote = userVotes[questionTitle];
    if (currentVote === voteType) {
      // Снимаем голос — удаляем из БД
      await removeVote(currentUser.uid, questionTitle);
    } else {
      // Ставим/меняем голос
      await submitVote(currentUser.uid, questionTitle, voteType);
    }
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStory.trim() && currentUser) {
      const savedStory = await addStory(currentUser.uid, newStory.trim());
      if (savedStory) {
        const story = {
          id: savedStory.id,
          text: savedStory.text,
          date: new Date(savedStory.created_at).toLocaleString('ru-RU'),
          user_id: savedStory.user_id,
        };
        setStories(prev => [story, ...prev]);
        setNewStory('');
      }
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEasterEgg = () => {
    setEasterEggCount(prev => prev + 1);
    setShowEasterEgg(true);
    
    setTimeout(() => setShowEasterEgg(false), 3000);
    
    if (easterEggCount >= 4) {
      document.body.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        document.body.style.animation = '';
        setEasterEggCount(0);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20">
        <div className="absolute inset-0 bg-black animate-pulse"></div>
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-green-400 text-xs font-mono animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            101010
          </div>
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${isContentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <header className="border-b border-cyan-500/30 bg-black/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Terminal 
                    className="w-8 h-8 text-cyan-400 animate-pulse cursor-pointer hover:text-purple-400 transition-colors" 
                    onClick={handleEasterEgg}
                  />
                  {showEasterEgg && (
                    <div className="absolute -top-2 -right-2 pointer-events-none">
                      <Zap className="w-6 h-6 text-yellow-400 animate-bounce" />
                      <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  )}
                </div>
                <GlitchText 
                  text="KBTU UNDERGROUND" 
                  className="text-2xl font-bold cursor-pointer hover:text-purple-400 transition-colors" 
                  onClick={handleHomeClick}
                />
              </div>
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-sm text-cyan-400 max-w-[150px] md:max-w-none">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{currentUser?.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                    >
                      Выйти
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Войти</span>
                  </button>
                )}
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Фанатский проект</span>
                </div>
              </div>
            </div>
          </div>
          <nav className="flex justify-center flex-wrap gap-x-4 gap-y-2 px-4 py-2 bg-black/70 border-t border-cyan-500/20">
            <button onClick={() => setShowAnnouncements(true)} className="text-sm text-cyan-400 hover:underline">Объявления</button>
            <button onClick={() => setShowCalendar(true)} className="text-sm text-purple-400 hover:underline">Календарь</button>
            {isAuthenticated && (
              <button onClick={() => setShowSchedule(true)} className="text-sm text-yellow-400 hover:underline flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                Расписание
              </button>
            )}
            {isAuthenticated && (
              <button onClick={() => setShowFavorites(true)} className="text-sm text-amber-400 hover:underline flex items-center gap-1">
                <Star className="w-4 h-4" />
                Избранное
              </button>
            )}
            <button onClick={() => setShowMap(true)} className="text-sm text-green-400 hover:underline">Карта</button>
            <button onClick={() => setShowStories(true)} className="text-sm text-pink-400 hover:underline">Истории</button>
            <button onClick={() => setShowDocs(true)} className="text-sm text-blue-400 hover:underline">Документы</button>
            <button onClick={() => setShowChat(true)} className="text-sm text-gray-400 hover:underline">Чат</button>
            <button onClick={() => setShowDisclaimer(true)} className="text-sm text-red-400 hover:underline">О проекте</button>
          </nav>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="mb-6 flex justify-center">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                id="search-input"
                name="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Поиск по словам или хэштегам..."
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-cyan-400 focus:outline-none pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400"
                  onClick={() => setSearchTerm('')}
                  aria-label="Очистить поиск"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {searchActive ? (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-cyan-400 text-center mb-4">Результаты поиска</h2>
              {searchResults && searchResults.foundQuestions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">Вопросы:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {searchResults.foundQuestions.map(({ question, path }, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedQuestion(question)}
                        className="group bg-gray-900/50 border border-gray-700 rounded-lg p-6 cursor-pointer
                          hover:border-cyan-500/50 hover:bg-gray-800/50 transition-all duration-300
                          hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between">
                          <h3
                            className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors"
                            dangerouslySetInnerHTML={{ __html: highlight(question.title, searchTermClean) }}
                          />
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <p
                          className="text-gray-400 mt-2 text-sm"
                          dangerouslySetInnerHTML={{ __html: highlight(question.preview, searchTermClean) }}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Вкладка: {path.join(' > ')}</span>
                          {question.tags && (
                            <span className="ml-2">Теги: {question.tags.map(tag => (
                              <span 
                                key={tag}
                                className="cursor-pointer hover:text-cyan-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHashtagClick(tag);
                                }}
                              >
                                #{tag}
                              </span>
                            )).reduce((prev, curr, index) => index === 0 ? [curr] : [...prev, ', ', curr], [] as React.ReactNode[])}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {searchResults && searchResults.foundCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-2">Вкладки и категории:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {searchResults.foundCategories.map(({ category, path }, idx) => (
                      <CategoryCard
                        key={category.id + idx}
                        category={category}
                        onClick={() => {
                          let currentSubCats = initialCategories;
                          const pathIds = path.map(title => {
                            const found = currentSubCats.find(c => c.title === title);
                            if (found) {
                              currentSubCats = found.subcategories || [];
                              return found.id;
                            }
                            return null;
                          }).filter((id): id is string => !!id);

                          const newPath = [...pathIds, category.id];
                          setNavigationPath(newPath);
                          setSearchTerm('');
                        }}
                        questionsCount={getQuestionsCount(category)}
                        subcategoriesCount={getSubcategoriesCount(category)}
                        onToggleFavorite={() => toggleFavoriteCategory(category)}
                        isFavorite={favorites.categories.some(c => c.id === category.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {searchResults && searchResults.foundQuestions.length === 0 && searchResults.foundCategories.length === 0 && (
                <div className="text-center text-gray-400 text-lg mt-8">Ничего не найдено по запросу "{searchTerm}"</div>
              )}
            </div>
          ) : isAtRoot ? (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Добро пожаловать в Underground</h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">Неофициальный источник информации о студенческой жизни КБТУ</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {filterCategories(categories).map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => handleCategoryClick(category.id)}
                    questionsCount={getQuestionsCount(category)}
                    subcategoriesCount={getSubcategoriesCount(category)}
                    onToggleFavorite={() => toggleFavoriteCategory(category)}
                    isFavorite={favorites.categories.some(c => c.id === category.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <button onClick={handleBack} className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  <span>Назад</span>
                </button>
              </div>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  {currentCategory?.icon}
                  <h2 className="text-3xl font-bold text-cyan-400">{currentCategory?.title}</h2>
                </div>
                <p className="text-gray-300">{currentCategory?.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {filterCategories(getCurrentSubcategories()).map((subcategory) => (
                  <CategoryCard
                    key={subcategory.id}
                    category={subcategory}
                    onClick={() => handleCategoryClick(subcategory.id)}
                    questionsCount={getQuestionsCount(subcategory)}
                    subcategoriesCount={getSubcategoriesCount(subcategory)}
                    onToggleFavorite={() => toggleFavoriteCategory(subcategory)}
                    isFavorite={favorites.categories.some(c => c.id === subcategory.id)}
                  />
                ))}
                {filterQuestions(getCurrentQuestions()).map((question, index) => (
                  <div key={index} onClick={() => handleQuestionClick(question)} className="group bg-gray-900/50 border border-gray-700 rounded-lg p-6 cursor-pointer hover:border-cyan-500/50 hover:bg-gray-800/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">{question.title}</h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">{question.preview}</p>
                    <div className="flex items-center space-x-4 mt-4 text-sm">
                      <button onClick={(e) => { e.stopPropagation(); handleVote(question.title, 'like'); }} className={`flex items-center gap-1 transition-colors ${userVotes[question.title] === 'like' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
                        👍 {question.likes || 0}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleVote(question.title, 'dislike'); }} className={`flex items-center gap-1 transition-colors ${userVotes[question.title] === 'dislike' ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}>
                        👎 {question.dislikes || 0}
                      </button>
                      {!isAuthenticated && (
                        <span className="text-xs text-gray-500">Войдите для голосования</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-sm mt-16">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Eye className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-400">Контент защищен от копирования</span>
              </div>
              <p className="text-xs text-gray-500">
                © 2025 KBTU Underground. Неофициальный фанатский проект.<br />
                Вся информация предоставляется "как есть" без гарантий.
              </p>
            </div>
          </div>
        </footer>
      </div>

      <QuestionModal
        question={selectedQuestion}
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        onVote={handleVote}
        onToggleFavorite={() => selectedQuestion && toggleFavoriteQuestion(selectedQuestion)}
        isFavorite={selectedQuestion ? favorites.questions.some(q => q.title === selectedQuestion.title) : false}
        likes={selectedQuestion?.likes || 0}
        dislikes={selectedQuestion?.dislikes || 0}
        onHashtagClick={handleHashtagClick}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {showDisclaimer && (
        <DisclaimerModal
          isOpen={showDisclaimer}
          onAccept={handleDisclaimerAccept}
        />
      )}

      {showAnnouncements && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">Объявления</h2>
            <div className="mb-4 text-center text-xl text-gray-300">СКОРО!</div>
            <button 
              className="mt-4 bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
              onClick={() => handleDownload('Announcements.pdf')}
            >
              Скачать объявления
            </button>
            <button 
              onClick={() => setShowAnnouncements(false)} 
              className="mt-4 ml-4 text-red-400 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Календарь событий</h2>
            <div className="mb-4">[Календарь событий будет здесь]</div>
            <button
              className="mt-4 bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
              onClick={() => handleDownload('AcademicCalendar.pdf')}
            >
              Скачать Академический календарь
            </button>
            <button
              onClick={() => setShowCalendar(false)}
              className="mt-4 ml-4 text-red-400 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showSchedule && currentUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg p-4 md:p-8 max-w-7xl w-full my-8 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6 sticky top-0 bg-gray-900 pb-4 z-10">
              <h2 className="text-xl md:text-2xl font-bold text-yellow-400">Мое расписание</h2>
              <button
                onClick={() => setShowSchedule(false)}
                className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <Schedule user={currentUser} />
          </div>
        </div>
      )}

      {showMap && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-green-400">Карта КБТУ</h2>
            <div className="mb-4">Скоро...</div>
            <button 
              className="mt-4 bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
              onClick={() => handleDownload('KBTUMap.pdf')}
            >
              Скачать карту
            </button>
            <button 
              onClick={() => setShowMap(false)} 
              className="mt-4 ml-4 text-red-400 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showStories && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">Истории</h2>
            <div className="mb-4 text-center text-xl text-gray-300">СКОРО!</div>
            <button 
              className="mt-4 bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
              onClick={() => handleDownload('StudentStories.pdf')}
            >
              Скачать истории
            </button>
            <button 
              onClick={() => setShowStories(false)} 
              className="mt-4 ml-4 text-red-400 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showDocs && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Документы</h2>
            <div className="mb-4 flex flex-col gap-2">
              <button 
                className="bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
                onClick={() => handleDownload('StudentHandbook.pdf')}
              >
                Скачать Студенческий справочник
              </button>
              <button 
                className="bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
                onClick={() => handleDownload('UniversityRules.pdf')}
              >
                Скачать Правила университета
              </button>
              <button 
                className="bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
                onClick={() => handleDownload('AdmissionGuide.pdf')}
              >
                Скачать Руководство по поступлению
              </button>
            </div>
            <button 
              onClick={() => setShowDocs(false)} 
              className="mt-4 text-red-400 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-400">Чат</h2>
            <div className="mb-4">Скоро...</div>
            <button 
              className="mt-4 bg-cyan-400 text-black px-4 py-2 rounded font-bold hover:bg-cyan-300 transition-colors"
              onClick={() => handleDownload('ChatGuidelines.pdf')}
            >
              Скачать правила чата
            </button>
            <button 
              onClick={() => setShowChat(false)} 
              className="mt-4 ml-4 text-red-400 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {showFavorites && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full flex flex-col max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">
                {favoritesLoading ? 'Загрузка...' : 'Избранное'}
              </h2>
              <button
                onClick={() => setShowFavorites(false)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {favoritesLoading ? (
              <div className="text-center text-gray-400 py-8">Загрузка избранного...</div>
            ) : !currentUser ? (
              <div className="text-center text-gray-400 py-8">Войдите в аккаунт для просмотра избранного</div>
            ) : (
              <div className="w-full space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Категории:</h3>
                  {favorites.categories.length > 0 ? (
                    <div className="space-y-2">
                      {favorites.categories.map(c => (
                        <button
                          key={c.id}
                          onClick={() => navigateToFavoriteCategory(c)}
                          className="w-full text-left px-4 py-2 bg-gray-800/50 border border-gray-700 rounded hover:border-purple-500 hover:bg-gray-700/50 text-purple-300 hover:text-purple-200 transition-all flex items-center justify-between group"
                        >
                          <span>{c.title}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Нет избранных категорий.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-3">Вопросы:</h3>
                  {favorites.questions.length > 0 ? (
                    <div className="space-y-2">
                      {favorites.questions.map(q => (
                        <button
                          key={q.title}
                          onClick={() => navigateToFavoriteQuestion(q)}
                          className="w-full text-left px-4 py-2 bg-gray-800/50 border border-gray-700 rounded hover:border-cyan-500 hover:bg-gray-700/50 text-cyan-300 hover:text-cyan-200 transition-all flex items-center justify-between group"
                        >
                          <span>{q.title}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Нет избранных вопросов.</p>
                  )}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowFavorites(false)}
              className="mt-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors self-end"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-40">
          <button className="bg-cyan-400 text-black px-4 py-2 rounded-full shadow-lg flex items-center gap-2" onClick={() => setShowFavorites(true)}>
            <Star className="w-5 h-5" />
            <span>Избранное ({favorites.questions.length + favorites.categories.length})</span>
          </button>
        </div>
      )}

      {showEasterEgg && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 animate-pulse"></div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            >
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          ))}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text animate-pulse">
              {easterEggCount >= 5 ? '🎉 СЕКРЕТНЫЙ РЕЖИМ! 🎉' : '⚡ ПАСХАЛКА! ⚡'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;