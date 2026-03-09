import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import ChatInterface from "./components/ChatInterface";
import LoginPage from "./pages/LoginPage";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          
          <Route path="/chat" element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ChatInterface />
            </ProtectedRoute>
          } />
          
          <Route path="/agent/dashboard" element={
            <ProtectedRoute allowedRoles={["agent", "admin"]}>
              <AgentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
