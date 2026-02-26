import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";
import styles from "./WorkspaceUsers.module.css";

export default function WorkspaceUsers() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [workspaceRes, meRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}`),
        api.get("/auth/me")
      ]);
      setWorkspace(workspaceRes.data);
      setUser(meRes.data);
    };
    load();
  }, [workspaceId]);

  return (
    <div className={styles.page}>
      <div className={`${styles.header} glass`}>
        <button className={styles.back} onClick={() => navigate(`/workspace/${workspaceId}`)}>
          ← Назад
        </button>
        <div>
          <h2>Пользователи</h2>
          <p>{workspace?.name || `Пространство #${workspaceId}`}</p>
        </div>
      </div>

      <div className={styles.list}>
        {user ? (
          <div className={`${styles.userCard} glass`}>
            <div>
              <h3>{user.username || user.email}</h3>
              <p>{user.email}</p>
            </div>
            <span className={styles.role}>Владелец</span>
          </div>
        ) : (
          <div className={`${styles.userCard} glass`}>
            <p>Загрузка пользователей…</p>
          </div>
        )}
      </div>
      <div className={styles.note}>
        <p>Пока доступ есть только у владельца. Добавление участников можно реализовать позже.</p>
      </div>
    </div>
  );
}
