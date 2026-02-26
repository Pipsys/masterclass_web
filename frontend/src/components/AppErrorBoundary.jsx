import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep details in console for diagnostics without exposing internals to users.
    console.error("Unhandled UI error:", error);
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <h2 style={styles.title}>Страница временно недоступна</h2>
          <p style={styles.text}>
            Произошла ошибка в интерфейсе. Попробуйте обновить страницу.
          </p>
          <button style={styles.button} onClick={this.handleReload}>
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px"
  },
  card: {
    width: "min(560px, 100%)",
    border: "1px solid var(--color-border)",
    borderRadius: "16px",
    background: "var(--color-surface)",
    padding: "20px",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.08)"
  },
  title: {
    margin: "0 0 8px"
  },
  text: {
    margin: "0 0 16px",
    color: "var(--color-muted)"
  },
  button: {
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    background: "var(--color-surface-2, #f2f4f6)",
    color: "var(--color-text)"
  }
};
