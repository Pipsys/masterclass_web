import { useState } from "react";
import useModalBodyClass from "../hooks/useModalBodyClass.js";
import styles from "./WorkspaceCreator.module.css";

export default function WorkspaceCreator({ open, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  useModalBodyClass(open);

  if (!open) return null;

  const submit = () => {
    onCreate({ name, description });
    setName("");
    setDescription("");
    onClose?.();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()}>
        <h3>Создать пространство</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={onClose}>Отмена</button>
          <button onClick={submit}>Создать</button>
        </div>
      </div>
    </div>
  );
}
