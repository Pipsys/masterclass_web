// frontend/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuthModal } from "../components/AuthModalContext.jsx";
import { Zap, Users, Shield, TrendingUp, Layout, CheckSquare, Calendar } from "lucide-react";
import styles from "./Home.module.css";

const TEXT = {
  eyebrow: "ЦИФРОВОЙ МЕНЕДЖЕР ЗАДАЧ",
  title: "Организуйте работу, управляйте проектами, достигайте целей",
  subtitle: "Современная платформа для управления задачами и проектами. Создавайте рабочие пространства, распределяйте задачи и отслеживайте прогресс в реальном времени.",
  ctaAuth: "Начать бесплатно",
  ctaDashboard: "Перейти к рабочим пространствам",
  featuresTitle: "Почему выбирают нашу платформу",
};

export default function Home() {
  const token = useSelector((s) => s.auth.accessToken);
  const { openModal } = useAuthModal();
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    document.body.classList.add("home-bg");
    
    // Плавная смена карточек каждые 4 секунды
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3);
    }, 4000);
    
    return () => {
      document.body.classList.remove("home-bg");
      clearInterval(interval);
    };
  }, []);

  const start = () => {
    if (token) return;
    openModal("register");
  };

  const features = [
    {
      icon: <Zap size={20} />,
      title: "Мгновенная синхронизация",
      description: "Изменения сохраняются в реальном времени на всех устройствах"
    },
    {
      icon: <Users size={20} />,
      title: "Совместная работа",
      description: "Приглашайте команду и работайте над проектами вместе"
    },
    {
      icon: <Shield size={20} />,
      title: "Безопасность данных",
      description: "Ваши данные защищены современными технологиями шифрования"
    },
    {
      icon: <TrendingUp size={20} />,
      title: "Аналитика и отчеты",
      description: "Отслеживайте прогресс с помощью детальной статистики"
    }
  ];

  const cards = [
    {
      icon: <Layout size={44} />,
      title: "Рабочие пространства",
      description: "Создавайте отдельные пространства для каждого проекта или команды. Организуйте работу эффективно и системно."
    },
    {
      icon: <CheckSquare size={44} />,
      title: "Доски проектов",
      description: "Визуализируйте рабочие процессы с помощью канбан-досок. Отслеживайте статус каждой задачи в реальном времени."
    },
    {
      icon: <Calendar size={44} />,
      title: "Задачи и сроки",
      description: "Устанавливайте дедлайны, назначайте ответственных и контролируйте выполнение задач. Ничто не останется незамеченным."
    }
  ];

  // Функция для получения класса карточки в зависимости от её позиции
  const getCardClass = (index) => {
    const totalCards = cards.length;
    let cardClass = '';
    
    if (index === activeCard) {
      cardClass = styles.active;
    } else if ((index + 1) % totalCards === activeCard) {
      cardClass = styles.prev;
    } else if ((index - 1 + totalCards) % totalCards === activeCard) {
      cardClass = styles.next;
    }
    
    return `${styles.card} ${styles[`card${index + 1}`]} ${cardClass}`;
  };

  const subtitleLines = [
    "Современная платформа для управления задачами и проектами.",
    "Создавайте рабочие пространства, распределяйте задачи",
    "и отслеживайте прогресс в реальном времени.",
  ];

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>{TEXT.eyebrow}</p>
          <h1 className={styles.title}>{TEXT.title}</h1>
          <p className={styles.subtitle}>
            <span className={styles.typewriter} aria-label={TEXT.subtitle}>
              {subtitleLines.map((line, index) => (
                <span key={line} className={styles.typewriterLine}>
                  <span
                    className={`${styles.typewriterText} ${
                      index === subtitleLines.length - 1 ? styles.caret : ""
                    }`}
                    style={{ "--delay": `${0.2 + index * 1.1}s` }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </span>
          </p>
          
          <div className={styles.actions}>
            {token ? (
              <Link className={styles.primary} to="/dashboard">
                {/* <Zap size={18} /> */}
                {TEXT.ctaDashboard}
              </Link>
            ) : (
              <>
                <button className={styles.primary} onClick={start}>
                  {/* <Zap size={18} /> */}
                  {TEXT.ctaAuth}
                </button>
                <button 
                  className={styles.secondary}
                  onClick={() => openModal("login")}
                >
                  Войти в аккаунт
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Карточки с исправленной анимацией */}
        <div className={styles.visual}>
          <div className={styles.cardsStack}>
            {cards.map((card, index) => (
              <div 
                key={index}
                className={getCardClass(index)}
              >
                <div className={styles.cardIcon}>
                  {card.icon}
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
          {/* Индикатор прогресса */}
          <div className={styles.progressIndicator}>
            {cards.map((_, index) => (
              <div 
                key={index}
                className={`${styles.progressDot} ${activeCard === index ? styles.active : ''}`}
                onClick={() => setActiveCard(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2>{TEXT.featuresTitle}</h2>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Поступай на ФПИ. Точка старта твоей карьеры в IT. Все права защищены.</p>
      </footer>
    </div>
  );
}
