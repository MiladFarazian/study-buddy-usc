
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
import Schedule from "./pages/Schedule";
import Resources from "./pages/Resources";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/auth/PrivateRoute";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/courses" element={<Layout><Courses /></Layout>} />
            <Route path="/tutors" element={<Layout><Tutors /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/schedule" element={
              <PrivateRoute>
                <Layout><Schedule /></Layout>
              </PrivateRoute>
            } />
            <Route path="/resources" element={
              <PrivateRoute>
                <Layout><Resources /></Layout>
              </PrivateRoute>
            } />
            <Route path="/analytics" element={
              <PrivateRoute>
                <Layout><Analytics /></Layout>
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <Layout><Settings /></Layout>
              </PrivateRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
