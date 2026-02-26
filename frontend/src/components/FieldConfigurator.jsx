import { useState } from "react";
import styles from "./FieldConfigurator.module.css";

export default function FieldConfigurator({ onAdd }) {
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [required, setRequired] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), field_type: fieldType, is_required: required });
    setName("");
    setFieldType("text");
    setRequired(false);
  };

  return (
    <div className={`${styles.modal} glass`}>
      <div className={styles.header}>
        <div>
          <h3>Добавить столбец</h3>
          <p>Создайте поля разных типов: текст, число, дата, чекбокс.</p>
        </div>
        <button className={styles.add} onClick={submit}>Добавить</button>
      </div>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Название</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Сумма" />
        </label>
        <label className={styles.field}>
          <span>Тип данных</span>
          <select value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
            <option value="text">Текст</option>
            <option value="number">Число</option>
            <option value="date">Дата</option>
            <option value="boolean">Чекбокс</option>
          </select>
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          <span>Обязательное поле</span>
        </label>
      </div>
    </div>
  );
}
