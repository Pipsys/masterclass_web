import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../lib/api.js";
import { setUser } from "../store/authSlice.js";
import styles from "./Profile.module.css";

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await api.get("/auth/me");
      dispatch(setUser(res.data));
      setEmail(res.data?.email || "");
    };
    load();
  }, [dispatch]);

  return (
    <div className={styles.page}>
      <div className={`${styles.header} glass`}>
        <div>
          <h2>Профиль и настройки</h2>
          <p>Управляйте доступом, безопасностью и внешним видом.</p>
        </div>
        <div className={styles.userChip}>
          <div>
            <p className={styles.userName}>{user?.username || "Пользователь"}</p>
            <span>{user?.email || "—"}</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <section className={`${styles.panel} glass`}>
          <h3>Контакты</h3>
          <label className={styles.field}>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <button className={styles.primary}>Сохранить почту</button>
          <p className={styles.hint}>Почта используется для входа и уведомлений.</p>
        </section>

        <section className={`${styles.panel} glass`}>
          <h3>Безопасность</h3>
          <label className={styles.field}>
            <span>Текущий пароль</span>
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
            />
          </label>
          <label className={styles.field}>
            <span>Новый пароль</span>
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
          </label>
          <button className={styles.primary}>Обновить пароль</button>
        </section>

        <section className={`${styles.panel} glass`}>
          <h3>Двухфакторная защита</h3>
          <div className={styles.rowBetween}>
            <div>
              <p className={styles.label}>Подключить 2FA</p>
              <span className={styles.subtle}>Код в приложении или по email.</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={() => setTwoFactorEnabled((prev) => !prev)}
              />
              <span />
            </label>
          </div>
          <button className={styles.secondary}>Настроить 2FA</button>
        </section>

        <section className={`${styles.panel} glass`}>
          <h3>Внешний вид</h3>
          <div className={styles.rowBetween}>
            <div>
              <p className={styles.label}>Светлая тема</p>
              <span className={styles.subtle}>В проекте используется единый светлый стиль.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
