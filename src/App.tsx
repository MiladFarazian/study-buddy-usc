
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Login';
import SignupPage from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Tutors from '@/pages/Tutors';
import TutorProfile from '@/pages/TutorProfile';
import Messages from '@/pages/Messages';
import Conversation from '@/pages/Conversation';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MessageProvider } from '@/contexts/MessageContext';
import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="tutortime-theme">
      <TooltipProvider>
        <AuthProvider>
          <MessageProvider>
            <Router>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/tutors" element={<Tutors />} />
                <Route path="/tutors/:id" element={<TutorProfile />} />
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/messages/:conversationId" element={
                  <ProtectedRoute>
                    <Conversation />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </MessageProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
