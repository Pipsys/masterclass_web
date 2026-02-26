import { useState } from "react";
import useModalBodyClass from "../hooks/useModalBodyClass.js";
import styles from "./WorkspaceEditor.module.css";

export default function WorkspaceEditor({ open, initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  useModalBodyClass(open);

  if (!open) return null;

  const submit = () => {
    onSave({ name, description });
    onClose?.();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={`${styles.modal} glass`} onClick={(e) => e.stopPropagation()}>
        <h3>Редактировать пространство</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" />
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={onClose}>Отмена</button>
          <button onClick={submit}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}
