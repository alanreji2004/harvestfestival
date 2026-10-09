import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import BookingClosed from './pages/BookingClosed';
import SearchToken from './pages/SearchToken';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDangerZone from './pages/AdminDangerZone';
import CounterLogin from './pages/CounterLogin';
import CounterDashboard from './pages/CounterDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Customer Order Page */}
          <Route path="/" element={<BookingClosed />} />
          <Route path="/addafterdeadline" element={<Home />} />
          
          {/* Booking Closed & Token Search Pages */}
          <Route path="/bookingclosed" element={<BookingClosed />} />
          <Route path="/search-token" element={<SearchToken />} />
          <Route path="/search" element={<SearchToken />} />

          {/* Counter Staff Portal Routes */}
          <Route path="/counter/login" element={<CounterLogin />} />
          <Route path="/counter" element={<CounterDashboard />} />

          {/* Admin Authentication & Dashboard */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/danger-zone" 
            element={
              <ProtectedRoute>
                <AdminDangerZone />
              </ProtectedRoute>
            } 
          />

          {/* Fallback wildcard redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
