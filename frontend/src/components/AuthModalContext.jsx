import { createContext, useContext } from "react";

const AuthModalContext = createContext({
  openModal: () => {}
});

export function AuthModalProvider({ value, children }) {
  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
