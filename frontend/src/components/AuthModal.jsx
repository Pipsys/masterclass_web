import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import { setTokens } from "../store/authSlice.js";
import useModalBodyClass from "../hooks/useModalBodyClass.js";
import styles from "./AuthModal.module.css";

export default function AuthModal({ open, mode, onClose }) {
  const [current, setCurrent] = useState(mode || "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Добавляем состояние загрузки
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useModalBodyClass(open);

  useEffect(() => {
    if (mode) setCurrent(mode);
  }, [mode]);

  if (!open) return null;

  const switchMode = (next) => {
    setCurrent(next);
    setError("");
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      if (current == "register") {
        console.log("Registering:", { email, username, password: password.length });
        const registerResponse = await api.post("/auth/register", { 
          email, 
          password, 
          username 
        });
        console.log("Register success:", registerResponse.data);
      }
      
      console.log("Logging in:", { email, password: password.length });
      const res = await api.post("/auth/login", { email, password });
      console.log("Login success:", res.data);
      
      dispatch(setTokens(res.data));
      onClose?.();
      navigate("/dashboard");
    } catch (err) {
      console.error("Auth error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      // Более детальное сообщение об ошибке
      let errorMessage = "Не удалось войти. Проверьте данные.";
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 400) {
        errorMessage = "Некорректные данные. Проверьте email и пароль.";
      } else if (err.response?.status === 401) {
        errorMessage = "Неверный email или пароль.";
      } else if (err.response?.status === 409) {
        errorMessage = "Пользователь с таким email уже существует.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tabs}>
          <button
            className={current === "login" ? styles.active : ""}
            onClick={() => switchMode("login")}
            disabled={isLoading}
          >
            Вход
          </button>
          <button
            className={current === "register" ? styles.active : ""}
            onClick={() => switchMode("register")}
            disabled={isLoading}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          {current === "register" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Имя пользователя"
              autoComplete="username"
              disabled={isLoading}
              required
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            type="password"
            autoComplete={current === "register" ? "new-password" : "current-password"}
            disabled={isLoading}
            minLength={8}
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <button 
            type="submit" 
            className={styles.submit}
            disabled={isLoading}
          >
            {isLoading ? "Загрузка..." : (current === "login" ? "Войти" : "Создать аккаунт")}
          </button>
        </form>
      </div>
    </div>
  );
}
