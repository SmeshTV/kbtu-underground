import React from 'react';
import { Users, Lightbulb, BookOpen, Coffee, MessagesSquare, Instagram, Send, MessageCircle, Shield, ScreenShare, FolderArchive } from 'lucide-react';

export interface Question {
  title: string;
  preview: string;
  content: string;
  tags?: string[];
  image?: string;
  links?: Array<{
    title: string;
    url: string;
    icon?: React.ReactNode;
  }>;
  reviews?: Array<{ author?: string; text: string; rating?: number }>;

  likes?: number;
  dislikes?: number;
  tldr?: string;
  favorite?: boolean;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  questions?: Question[];
  subcategories?: Category[];
  reviews?: Array<{ author?: string; text: string; rating?: number }>;

  likes?: number;
  dislikes?: number;
  tldr?: string;
  favorite?: boolean;
}

export const categories: Category[] = [
  {
    id: 'clubs',
    title: 'Клубы и организации',
    description: 'Всё о студенческих клубах КБТУ, как вступить и что они предлагают',
    icon: <Users className="w-6 h-6" />,
    reviews: [
      { author: 'Аноним', text: 'Очень полезная категория!', rating: 5 }
    ],
    likes: 12,
    dislikes: 2,
    tldr: 'Всё о клубах и организациях КБТУ.',
    favorite: false,
    subcategories: [
      {
        id: 'clubs-list',
        title: 'Клубы',
        description: 'Список всех клубов КБТУ с подробной информацией',
        icon: <Users className="w-6 h-6" />,
        reviews: [{ text: 'Клубы реально активные!', rating: 4 }],
        likes: 8,
        dislikes: 1,
        tldr: 'Список всех клубов КБТУ.',
        favorite: false,
        questions: [
          {
            title: 'Geek Cultural Club KBTU',
            preview: 'Присоединяйтесь к клубу гиков KBTU, где собираются фанаты игр, аниме и сериалов! Общайтесь, делитесь страстью и погружайтесь в любимую культуру',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['Гики', 'Игры', 'Аниме', 'Сериалы', 'ПопКультура', 'Сообщество'],
            links: [
              {
                title: '@geek.club.kbtu',
                url: 'https://www.instagram.com/geek.club.kbtu/',
                icon: <Instagram className="w-4 h-4" />
              },
              {
                title: 'GCC KBTU',
                url: 'https://t.me/+soK-YBpWpR43OWY6',
                icon: <Send className="w-4 h-4" />
              },
              {
                title: 'KBTU G.E.E.K',
                url: 'https://discord.gg/FCAu67haMr',
                icon: <MessagesSquare className="w-4 h-4" />
              }
            ],
            reviews: [
              { author: 'Student', text: 'Лучший клуб для гиков!', rating: 5 }
            ],
            likes: 0,
            dislikes: 0,
            tldr: 'Клуб для фанатов игр, аниме и сериалов. Общайтесь и делитесь страстью к поп-культуре.',
            favorite: false,
          },
          {
            title: 'BookJourney Club',
            preview: 'Погрузитесь в мир книг с BookJourney Club! Обсуждаем любимые произведения, делимся мыслями и вдохновляем друг друга на новые литературные открытия, а также проводим яркие мероприятия, связанные с книгами, фильмами и философией',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['КнижныйКлуб', 'BookJourney', 'Литература', 'Чтение', 'Философия', 'Фильмы', 'Мероприятия', 'Сообщество'],
            likes: 0,
            dislikes: 0,
            tldr: 'Книжный клуб для обсуждения произведений, фильмов и философии.',
          },
          {
            title: 'KBTU CYBERSPORT',
            preview: 'Присоединяйтесь к геймерскому коммьюнити KBTU CYBERSPORT! 🎮 Здесь собираются фанаты киберспорта, чтобы соревноваться, общаться и прокачивать свои навыки в любимых играх',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['Киберспорт', 'Геймеры', 'Игры', 'Турниры', 'Сообщество'],
            links: [
              {
                title: 'KBTU CYBERSPORT | Важное',
                url: 'https://t.me/KBTUCyberSport',
                icon: <Send className="w-4 h-4" />
              },
              {
                title: 'Лс Президента клуба',
                url: 'https://t.me/dsmbkv',
                icon: <Send className="w-4 h-4" />
              }
            ],
            likes: 0,
            dislikes: 0,
            tldr: 'Сообщество для фанатов киберспорта. Соревнуйтесь и прокачивайте навыки.',
          },
          {
            title: '7s Growth Lab',
            preview: 'Телеграмм канал организации КБТУ 7s Growth Lab',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['???'],
            links: [
              {
                title: '7s Growth Lab',
                url: 'https://t.me/svnstrqoqoqoqo',
                icon: <Send className="w-4 h-4" />
              },
              {
                title: 'Лс Президента клуба',
                url: 'https://t.me/aiiigeera',
                icon: <Send className="w-4 h-4" />
              },
              {
                title: 'Лс Президента клуба',
                url: 'https://t.me/sevenstragen',
                icon: <Send className="w-4 h-4" />
              }
            ]
          },
          {
            title: 'КазБрит',
            preview: 'Основная инфа, фотки, анонсы, новости, презентации и архив для текущего и будущего поколения',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['???'],
            links: [
              {
                title: 'IDC KBTU',
                url: 'https://t.me/idckazbrit',
                icon: <Send className="w-4 h-4" />
              }
            ]
          },
          {
            title: 'AI KBTU Initiative ИИ',
            preview: 'Сообщество студентов и преподавателей КБТУ, заинтересованных в ИИ. Вместе изучаем Artificial Intelligence, ходим на митапы, приглашаем гостевых спикеров и участвуем в AI competitions.',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['???'],
            links: [
              {
                title: 'AI KBTU Initiative ИИ',
                url: 'https://t.me/ai_kbtu',
                icon: <Send className="w-4 h-4" />
              }
            ]
          },
          {
            title: 'Өрен',
            preview: '',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['???'],
            links: [
              {
                title: 'Өрен',
                url: 'https://t.me/orenkbtu',
                icon: <Send className="w-4 h-4" />
              }
            ]
          },
          {
            title: 'Вестник Элитарного Клуба',
            preview: 'Канал для анонсов! Вторник | 17.00 - 20.00 | Своя Игра, Брейн-ринг. Пятница | 17.00 - 21:00 | Что? Где? Когда?',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['???'],
            links: [
              {
                title: 'Вестник Элитарного Клуба',
                url: 'https://t.me/elitarny_club',
                icon: <Send className="w-4 h-4" />
              },
              {
                title: 'Флудильня Элитарки',
                url: 'https://t.me/joinchat/CFEGnRBQxfl-pv93WMPzzg',
                icon: <Send className="w-4 h-4" />
              },
              {
                title: 'Discord',
                url: 'https://discord.gg/VgKZ5UgA',
                icon: <MessagesSquare className="w-4 h-4" />
              }
            ]
          },
          {
            title: 'Возможности startup-course.com',
            preview: 'События, мероприятия, мастер-классы, конкурсы и стартап-движ. От Идеи до Технологического Бизнеса',
            image: 'https://images.unsplash.com/photo-1665789318391-6057c533005e?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHF1ZXN0aW9ufGVufDB8fDB8fHww',
            content: `Слоган:
Описание клуба:
Уникальные фишки:
Чем выделяетесь:
Чем занимаетесь:
Атмосфера клуба:
Кто ваши участники:
Почему стоит присоединиться:
Как присоединиться:
Достижения или факты:`,
            tags: ['???'],
            links: [
              {
                title: '📢 Возможности 🚀 startup-course.com 💰',
                url: 'https://t.me/startup_course_com',
                icon: <MessagesSquare className="w-4 h-4" />
              },
              {
                title: 'Образовалка',
                url: 'https://startup-course.com/1',
                icon: <ScreenShare className="w-4 h-4" />
              },
              {
                title: 'Больше информаций',
                url: 'https://StartUp.vg',
                icon: <FolderArchive className="w-4 h-4" />
              },
              {
                title: 'startup_course_com',
                url: 'https://instagram.com/startup_course_com',
                icon: <Instagram className="w-4 h-4" />
              },
              {
                title: 'VladimiR🚀 startup.vg 🗣 (Contact)',
                url: 'https://t.me/KokTis',
                icon: <MessagesSquare className="w-4 h-4" />
              }
            ]
          }
        ]
      },
      {
        id: 'president',
        title: 'Президент и посты',
        description: 'Всё о выборах президента и других постах в клубах и организациях',
        icon: <Users className="w-6 h-6" />,
        questions: [
          {
            title: 'Как стать президентом?',
            preview: 'Порядок баллотирования и выборов президента школы/организации',
            content: `Скоро...`,
            tags: ['президент', 'выборы', 'баллотирование', 'студенческое самоуправление'],
            tldr: 'Чтобы стать президентом, нужно быть активным, подать заявку в сентябре, представить программу и победить в голосовании.',
          }
        ]
      },
      {
        id: 'org-list',
        title: 'Организации',
        description: 'Список студенческих организаций КБТУ',
        icon: <Users className="w-6 h-6" />,
        questions: [
          {
            title: 'Что такое студенческие организации?',
            preview: 'Пояснение о студенческих организациях КБТУ',
            content: `Скоро...`,
            tags: ['организации', 'студенческая жизнь', 'структура'],
            tldr: 'Студенческие организации — это официальные, более формальные объединения для защиты прав и интересов студентов.',
          },
          {
            title: 'Как вступить в организацию?',
            preview: 'Пошаговая инструкция по вступлению в студенческую организацию',
            content: `Скоро...`,
            tags: ['организации', 'вступление', 'студенческая жизнь'],
            tldr: 'Найдите организацию, свяжитесь с ней, заполните анкету и пройдите собеседование.',
          }
        ]
      }
    ],
    questions: [
      {
        title: 'Как вступить в студенческий клуб?',
        preview: 'Пошаговое руководство по вступлению в клубы КБТУ',
        content: `Скоро...`,
        tags: ['клубы', 'вступление', 'студенческая жизнь'],
        links: [
          {
            title: 'Официальный сайт КБТУ',
            url: 'https://kbtu.kz'
          }
        ],
        tldr: 'Изучите клубы, посетите презентации, подайте заявку, пройдите собеседование и активно участвуйте.',
      },
      {
        title: 'Какие клубы самые активные?',
        preview: 'Рейтинг самых активных студенческих организаций',
        content: `Скоро...`,
        tags: ['рейтинг', 'активность', 'клубы'],
        tldr: 'Самые активные: IT Club, Business Club, Debate Club, Photography Club, Volunteer Club. Проверяйте их соцсети и мероприятия.',
      },
      {
        title: 'Можно ли создать свой клуб?',
        preview: 'Процедура создания нового студенческого клуба в КБТУ',
        content: `Скоро...`,
        tags: ['создание клуба', 'регистрация', 'документы'],
        tldr: 'Да, можно. Нужно собрать 10+ студентов, найти куратора, подготовить документы (устав, план) и подать заявку в студенческий офис.',
      }
    ]
  },
  {
    id: 'tips',
    title: 'Советы и лайфхаки',
    description: 'Полезные советы для успешной учебы и студенческой жизни',
    icon: <Lightbulb className="w-6 h-6" />,
    subcategories: [
      {
        id: 'psychologist',
        title: 'Консультация у психолога',
        description: 'Вопросы о консультациях у психолога',
        icon: <Lightbulb className="w-6 h-6" />,
        questions: [
          {
            title: 'На сколько все анонимно?',
            preview: 'Вся информация о консультации у психолога',
            content: 'Все 100 процентов анонимно.',
            tags: ['психолог', 'анонимность']
          },
          {
            title: 'Сколько стоит поход к психологу?',
            preview: 'Стоимость и ограничения консультаций',
            content: 'Ограничения сколько раз ходить нету и это бесплатно.',
            tags: ['психолог', 'бесплатно']
          }
        ]
      },
      {
        id: 'apps-books',
        title: 'Приложения и книги',
        description: 'Полезные приложения и книги для студентов',
        icon: <Lightbulb className="w-6 h-6" />,
        questions: [
          {
            title: 'Как найти кабинет?',
            preview: 'Где найти нужный кабинет?',
            content: 'Есть приложение KBTU map в AppStore и в Play Market.',
            tags: ['приложение', 'карта', 'кабинет']
          },
          {
            title: 'Как во всем этом разобраться?',
            preview: 'Где найти инструкцию по учебе?',
            content: 'Есть книга HandBook.',
            tags: ['книга', 'инструкция']
          }
        ]
      }
    ],
    questions: [
      {
        title: 'Как успешно сдать сессию?',
        preview: 'Проверенные стратегии подготовки к экзаменам',
        content: `Скоро...`,
        tags: ['сессия', 'экзамены', 'подготовка', 'учеба'],
        tldr: 'Планируйте подготовку за месяц, используйте технику Pomodoro, активно повторяйте материал, соблюдайте режим сна и питания, управляйте стрессом.',
      },
      {
        title: 'Где лучше всего учиться в КБТУ?',
        preview: 'Обзор лучших мест для учебы в университете',
        content: `Скоро...`,
        tags: ['места для учебы', 'библиотека', 'кампус'],
        tldr: 'Лучшие места: библиотека (тихо), коворкинг (групповая работа), кафетерий (неформально), пустые аудитории (полная тишина).',
      },
      {
        title: 'Как найти стажировку?',
        preview: 'Гайд по поиску и получению стажировки для студентов КБТУ',
        content: `Скоро...`,
        tags: ['стажировка', 'карьера', 'поиск работы', 'резюме'],
        tldr: 'Ищите через карьерный центр КБТУ, hh.kz, LinkedIn и networking. Подготовьте качественное резюме и сопроводительное письмо, тренируйтесь перед собеседованием.',
      }
    ]
  },
  {
    id: 'military',
    title: 'Военная кафедра',
    description: 'Всё о военной кафедре КБТУ',
    icon: <Shield className="w-6 h-6" />,
    questions: [
      {
        title: 'Когда начнется военная кафедра?',
        preview: 'Сроки начала военной кафедры',
        content: `Вам придет сообщение об этом на почту, примерно во втором семестре готовишь документы, до второго семестра пока можете не волноваться.`,
        tags: ['военная кафедра', 'документы', 'почта']
      },
      {
        title: 'Как пройти военную кафедру?',
        preview: 'Порядок прохождения военной кафедры',
        content: '',
        tags: ['военная кафедра', 'прохождение']
      }
    ]
  },
  {
    id: 'academic',
    title: 'Учебные вопросы',
    description: 'Всё об учебном процессе, предметах и академических требованиях',
    icon: <BookOpen className="w-6 h-6" />,
    subcategories: [
      {
        id: 'disciplines',
        title: 'Дисциплины',
        description: 'Выберите дисциплину для просмотра преподавателей',
        icon: <BookOpen className="w-6 h-6" />,
        subcategories: [
          {
            id: 'calculus',
            title: 'Calculus',
            description: 'Преподаватели Calculus',
            icon: <BookOpen className="w-6 h-6" />,
            questions: [
              {
                title: 'Калмурзаев',
                preview: 'Информация о преподавателе Калмурзаеве',
                content: `Скоро...`,
                tags: ['calculus', 'математика']
              },
              {
                title: 'Скоро...',
                preview: 'Преподаватель высшей математики',
                content: `Скоро...`,
                tags: ['calculus', 'математика']
              }
            ]
          },
          {
            id: 'programming',
            title: 'Programming',
            description: 'Преподаватели Programming',
            icon: <BookOpen className="w-6 h-6" />,
            questions: [
              {
                title: 'Скоро...',
                preview: 'Senior преподаватель программирования',
                content: `Скоро...`,
                tags: ['программирование', 'python', 'java', 'алгоритмы']
              }
            ]
          }
        ]
      }
    ],
    questions: [
      {
        title: 'Знакомство с платформой Uni-x',
        preview: 'Ваш проводник по обучению в КБТУ',
        content: `Uni-x — это платформа для студентов КБТУ, где доступны видеоуроки по безопасности (обязательно до 2 сентября), онлайн-лекции (например, Calculus), расписание и задания. Изучайте материалы заранее, посещайте практики, задавайте вопросы преподавателям. Проверяйте расписание в личном кабинете WSP (wsp.kbtu.kz). По вопросам обращайтесь к ментору или деканату.

Добро пожаловать в мир Uni-x!

Это ваша НОВАЯ ПЛАТФОРМА, которую вы будете посещать регулярно. Ссылка на сайт: https://uni-x.almv.kz/platform. Ресурс станет вашим проводником!

Что здесь доступно?

Сначала — обучение безопасности! Просмотрите видеоуроки с тестами по чрезвычайным ситуациям, землетрясениям и другим аспектам. Это обязательно к выполнению до 2 сентября (согласно «Student Handbook»). 

Далее — дисциплины, или уроки. Некоторые лекции, например «Calculus» (исчисление на английском), доступны только здесь. Проверяйте расписание на WSP (личный кабинет, подробности ниже) — если вместо номера аудитории указано «Uni-x», лекция онлайн!

Как использовать?

• Просмотрите лекцию в Uni-x (лучше за день до практики)
• Посетите практику, где преподаватель даст задания
• ВЫ ДОЛЖНЫ СПРАШИВАТЬ у преподавателя при вопросах — пустая голова на экзамене хуже нерешённости!

Важная информация:
WSP — личный кабинет студента на wsp.kbtu.kz с графиком и баллами. Аудитория — номер кабинета для занятий.`,
        tags: ['UniX'],
        tldr: 'Uni-x (uni-x.almv.kz) — платформа для онлайн-лекций и видеоуроков по безопасности. Проверяйте расписание на WSP (wsp.kbtu.kz).',
      },
      {
        title: 'Академический календарь',
        preview: 'Что такое академический календарь?',
        content: `Академический календарь — это документ, в котором указаны все важные даты учебного года: начало и конец семестров, каникулы, экзамены, дедлайны, праздники и другие события. Помогает планировать учебу и не пропускать важные моменты.`,
        tags: ['календарь', 'учебный год']
      },
      {
        title: 'Сколько длятся дисциплины?',
        preview: 'Продолжительность пары',
        content: `Одна дисциплина (пара) длится 50 минут.`,
        tags: ['дисциплина', 'пара', 'время']
      },
      {
        title: 'Офис часы — что это?',
        preview: 'Что такое офис часы?',
        content: `В офис часы можно подойти к преподавателю и спросить все что хочешь по её дисциплине. Это специально выделенное время для консультаций.`,
        tags: ['офис часы', 'консультация']
      },
      {
        title: 'Что такое Syllabus?',
        preview: 'Что такое силабус?',
        content: `Силабус от учителей — это инструкция как получить баллы по предмету, расписание, требования, критерии оценивания и вся важная информация по курсу.`,
        tags: ['syllabus', 'силабус', 'инструкция']
      },
      {
        title: 'Где узнать свои логин и пароль?',
        preview: 'Как получить логин и пароль?',
        content: `Они придут на Gmail почту, которую вы указали при поступлении.`,
        tags: ['логин', 'пароль', 'почта']
      },
      {
        title: 'Где поменять пароль чтобы изменения были везде?',
        preview: 'Как сменить пароль для всех сервисов?',
        content: `Пароль можно поменять в WSP (wsp.kbtu.kz), после этого изменения применятся ко всем сервисам КБТУ.`,
        tags: ['пароль', 'смена', 'WSP']
      }
    ]
  },
  {
    id: 'eat',
    title: 'Покушать',
    description: 'Лучшие места для еды в Алматы рядом с КБТУ',
    icon: <Coffee className="w-6 h-6" />,
    questions: [
      {
        title: 'Lanzhou',
        preview: 'Лапшичная рядом с КБТУ',
        content: `Скоро...`,
        tags: ['еда', 'лапша', 'китайская кухня']
      },
      {
        title: 'Basilic',
        preview: 'Кафе Basilic рядом с КБТУ',
        content: `Скоро...`,
        tags: ['еда', 'кафе', 'европейская кухня']
      }
    ]
  },
  {
    id: 'education-system',
    title: 'Стипендия и система образования',
    description: 'Всё о стипендиях, пересдачах и системе образования',
    icon: <MessageCircle className="w-6 h-6" />,
    subcategories: [
      {
        id: 'scholarship',
        title: 'Стипендия',
        description: 'Всё о стипендиях в КБТУ',
        icon: <MessageCircle className="w-6 h-6" />,
        questions: [
          {
            title: 'Как получить стипендию?',
            preview: 'Условия получения стипендии',
            content: `Скоро...`,
            tags: ['стипендия', 'GPA', 'условия']
          },
          {
            title: 'Когда выплачивают стипендию?',
            preview: 'Сроки выплат',
            content: `Скоро...`,
            tags: ['стипендия', 'выплаты']
          }
        ]
      },
      {
        id: 'scholarship-track',
        title: 'Дорожка стипендиатам',
        description: 'Путь к стипендии',
        icon: <MessageCircle className="w-6 h-6" />,
        questions: [
          {
            title: 'Дорожка стипендиатам',
            preview: 'Как стать стипендиатом?',
            content: `Скоро...`,
            tags: ['стипендия', 'дорожка']
          }
        ]
      },
      {
        id: 'retake',
        title: 'Retake (Пересдача)',
        description: 'Всё о пересдаче предметов',
        icon: <MessageCircle className="w-6 h-6" />,
        questions: [
          {
            title: 'Что такое пересдача?',
            preview: 'Объяснение пересдачи',
            content: `Пересдача — это возможность повторно сдать предмет, если не удалось пройти его с первого раза. Пересдача платная.`,
            tags: ['пересдача', 'retake']
          },
          {
            title: 'Как записаться на пересдачу?',
            preview: 'Порядок записи',
            content: `Скоро...`,
            tags: ['пересдача', 'запись']
          },
          {
            title: 'Сколько стоит пересдача?',
            preview: 'Стоимость пересдачи',
            content: `Скоро...`,
            tags: ['пересдача', 'стоимость']
          }
        ]
      }
    ],
    questions: [
      {
        title: 'Как работает система оценивания в КБТУ?',
        preview: 'Обзор системы баллов, GPA и пересдач',
        content: `Скоро...`,
        tags: ['оценки', 'GPA', 'пересдача', 'академические правила'],
        tldr: 'Используется кредитная система с оценками от A (4.0) до F (0.0). Для прохождения курса нужен минимум D. Оценка F требует платной пересдачи.',
      },
      {
        title: 'Что такое академическая задолженность?',
        preview: 'Пояснение о задолженностях и их последствиях',
        content: `Скоро...`,
        tags: ['задолженность', 'пересдача', 'отчисление'],
        tldr: 'Задолженность — это несданный курс (оценка F). Она требует платной пересдачи и может привести к отчислению.',
      }
    ]
  }
];