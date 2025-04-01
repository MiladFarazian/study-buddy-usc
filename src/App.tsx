
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import Tutors from "./pages/Tutors";
import Resources from "./pages/Resources";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/auth/PrivateRoute";
import RequireProfileCompletion from "./components/auth/RequireProfileCompletion";
import AuthCallback from "./pages/AuthCallback";
import TutorProfile from "./pages/TutorProfile";
import Profile from "./pages/Profile";
import Students from "./pages/Students";
import EmailVerification from "./pages/EmailVerification";
import Messages from "./pages/Messages";

// Create a new QueryClient instance OUTSIDE of the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/courses" element={<Layout><Courses /></Layout>} />
              <Route path="/tutors" element={<Layout><Tutors /></Layout>} />
              <Route path="/tutors/:id" element={<Layout><TutorProfile /></Layout>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<EmailVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/resources" element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Resources /></Layout>
                  </RequireProfileCompletion>
                </PrivateRoute>
              } />
              <Route path="/analytics" element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Analytics /></Layout>
                  </RequireProfileCompletion>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Settings /></Layout>
                  </RequireProfileCompletion>
                </PrivateRoute>
              } />
              <Route path="/students" element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Students /></Layout>
                  </RequireProfileCompletion>
                </PrivateRoute>
              } />
              <Route path="/messages" element={
                <PrivateRoute>
                  <RequireProfileCompletion>
                    <Layout><Messages /></Layout>
                  </RequireProfileCompletion>
                </PrivateRoute>
              } />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
