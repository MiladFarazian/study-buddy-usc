
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Toaster } from "@/components/ui/toaster";
import PrivateRoute from "./components/auth/PrivateRoute";
import RequireProfileCompletion from "./components/auth/RequireProfileCompletion";
import Layout from "./components/layout/Layout";
import Courses from "./pages/Courses";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/" element={<Layout><Courses /></Layout>} />
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            
            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Layout><Settings /></Layout>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/messages" 
              element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Messages /></Layout>
                  </RequireProfileCompletion>
                </PrivateRoute>
              } 
            />
            
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
          <Toaster />
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}
