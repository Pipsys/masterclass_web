import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = useSelector((s) => s.auth.accessToken);
  if (!token) return <Navigate to="/?auth=login" replace />;
  return children;
}
