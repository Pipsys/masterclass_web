import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import AuthModal from "./AuthModal.jsx";
import { AuthModalProvider } from "./AuthModalContext.jsx";
import styles from "./Layout.module.css";

export default function Layout() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const location = useLocation();
  const navigate = useNavigate();

  const openModal = (mode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get("auth");
    if (auth === "login" || auth === "register") {
      openModal(auth);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  return (
    <AuthModalProvider value={{ openModal }}>
      <div className={styles.shell}>
        <Navbar />
        <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </AuthModalProvider>
  );
}
