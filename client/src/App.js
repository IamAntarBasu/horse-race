import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import BettingPage from './components/BettingPage';
import BetDetailsPage from './components/BetDetailsPage';
import AdminLogin from './components/auth/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/betting"
          element={
            <PrivateRoute>
              <BettingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/betting/:marketId"
          element={
            <PrivateRoute>
              <BetDetailsPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App; 