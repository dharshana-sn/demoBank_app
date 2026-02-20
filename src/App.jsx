/**
 * App.jsx
 * 
 * The main application entry point that defines the routing structure.
 * It uses React Router to manage navigation between the Login page, 
 * the OAuth callback handler, and the main Dashboard.
 * Includes layout-level route guards for private and public access.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OAuthCallbackPage from "./pages/OAuthCallbackPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";

/**
 * Higher-order component to protect routes from unauthorized access
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Higher-order component to prevent logged-in users from visiting login pages
 */
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />

        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

