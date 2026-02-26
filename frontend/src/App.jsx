import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Workspace from "./pages/Workspace.jsx";
import BoardView from "./pages/BoardView.jsx";
import Profile from "./pages/Profile.jsx";
import Home from "./pages/Home.jsx";
import WorkspaceUsers from "./pages/WorkspaceUsers.jsx";
import TableView from "./pages/TableView.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="workspace/:workspaceId"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="workspace/:workspaceId/users"
          element={
            <ProtectedRoute>
              <WorkspaceUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="board/:boardId"
          element={
            <ProtectedRoute>
              <BoardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="table/:boardId"
          element={
            <ProtectedRoute>
              <TableView />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
