import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { Toaster } from "@/components/ui/toaster";
import PrivateRoute from "./components/auth/PrivateRoute";
import RequireProfileCompletion from "./components/auth/RequireProfileCompletion";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import ProfilePage from "./pages/ProfilePage";
import Settings from "./pages/Settings";
import Scheduling from "./pages/Scheduling";
import Messages from "./pages/Messages";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <UserProvider>
      <NotificationsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password/:token" element={<UpdatePassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/terms" element={<Layout><Terms /></Layout>} />
            <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
            
            <Route path="/profile/:id" element={<Layout><ProfilePage /></Layout>} />

            <Route 
              path="/settings" 
              element={
                <PrivateRoute>
                  <Layout><Settings /></Layout>
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/schedule" 
              element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Scheduling /></Layout>
                  </RequireProfileCompletion>
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
    </UserProvider>
  );
}
