import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import NavBar from "./components/layout/NavBar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Tutors from "./pages/Tutors";
import Schedule from "./pages/Schedule";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Messages from "./pages/Messages";
import { Toaster } from "@/components/ui/toaster";
import { NotificationsProvider } from "@/contexts/NotificationsContext";

const queryClient = new QueryClient();

function App() {
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    return user ? <>{children}</> : <Navigate to="/login" />;
  };

  const GuestRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>;
    }

    return user ? <Navigate to="/" /> : <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="theme-preference">
          <AuthProvider>
            <NotificationsProvider>
              <NavBar />
              <main className="container py-10">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/register"
                    element={
                      <GuestRoute>
                        <Register />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestRoute>
                        <ForgotPassword />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <GuestRoute>
                        <ResetPassword />
                      </GuestRoute>
                    }
                  />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route
                    path="/profile"
                    element={
                      <AuthRoute>
                        <Profile />
                      </AuthRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <AuthRoute>
                        <Settings />
                      </AuthRoute>
                    }
                  />
                  <Route
                    path="/tutors"
                    element={
                      <AuthRoute>
                        <Tutors />
                      </AuthRoute>
                    }
                  />
                  <Route
                    path="/schedule"
                    element={
                      <AuthRoute>
                        <Schedule />
                      </AuthRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <AuthRoute>
                        <Messages />
                      </AuthRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
