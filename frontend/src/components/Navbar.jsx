import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../store/authSlice.js";
import { useAuthModal } from "./AuthModalContext.jsx";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth.accessToken);
  const { openModal } = useAuthModal();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsExpanded(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLogout = () => {
    dispatch(clearAuth());
    navigate("/");
  };

  return (
    <header className={`app-navbar ${styles.nav} glass ${isExpanded ? styles.navExpanded : ""}`}>
      <div className={styles.navInner}>
        <Link className={styles.brand} to="/">Мастер-класс ФПИ</Link>
        <nav className={styles.links}>
          {token && <Link to="/">Главная</Link>}
          {token && <Link to="/dashboard">Рабочие пространства</Link>}
          {token && <Link to="/profile">Профиль</Link>}
        </nav>
        <div className={styles.actions}>
          {!token ? (
            <>
              <button className={styles.login} onClick={() => openModal("login")}>Войти</button>
              <button className={styles.primary} onClick={() => openModal("register")}>Регистрация</button>
            </>
          ) : (
            <button className={styles.logout} onClick={onLogout}>Выйти</button>
          )}
        </div>
      </div>
    </header>
  );
}
