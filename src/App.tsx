
import { useEffect } from "react";
import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SessionBookingProvider } from "./contexts/SessionBookingContext";
import { ReviewProvider } from "./contexts/ReviewContext";
import { GlobalReviewModal } from "./components/reviews/GlobalReviewModal";
import { Toaster } from "./components/ui/toaster";
import { ReviewRequirement } from "./components/reviews";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DevLogin from "./pages/DevLogin";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/Courses";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import TutorProfilePage from "./pages/TutorProfile/TutorProfilePage";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/auth/PrivateRoute";
import RequireProfileCompletion from "./components/auth/RequireProfileCompletion";
import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import FeaturedTutors from "./pages/FeaturedTutors";
import Settings from "./pages/Settings";
import Resources from "./pages/Resources";
import Students from "./pages/Students";
import AuthCallback from "./pages/AuthCallback";
import BookingCalendly from "./pages/BookingCalendly";
import Analytics from "./pages/Analytics";
import BadgesDashboard from "./pages/TutorDashboard/BadgesDashboard";
import StripeTestInterface from "./pages/StripeTestInterface";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout>
      <Outlet />
    </Layout>,
    children: [
      {
        path: "/",
        element: <Index />
      },
      {
        path: "/login",
        element: <Login />
      },
      {
        path: "/register",
        element: <Register />
      },
      {
        path: "/dev-login",
        element: <DevLogin />
      },
      {
        path: "/auth-callback",
        element: <AuthCallback />
      },
      {
        path: "/email-verification",
        element: <EmailVerification />
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />
      },
      {
        path: "/reset-password",
        element: <ResetPassword />
      },
      {
        path: "/profile",
        element: <PrivateRoute><RequireProfileCompletion><Profile /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/courses",
        element: <Courses />
      },
      {
        path: "/tutors",
        element: <Tutors />
      },
      {
        path: "/tutor/:id",
        element: <TutorProfile />
      },
      {
        path: "/tutors/:id",
        element: <TutorProfilePage />
      },
      {
        path: "/schedule",
        element: <PrivateRoute><RequireProfileCompletion><Schedule /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/messages",
        element: <PrivateRoute><RequireProfileCompletion><Messages /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/featured-tutors",
        element: <FeaturedTutors />
      },
      {
        path: "/settings",
        element: <PrivateRoute><RequireProfileCompletion><Settings /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/resources",
        element: <Resources />
      },
      {
        path: "/students",
        element: <PrivateRoute><RequireProfileCompletion><Students /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/booking",
        element: <PrivateRoute><RequireProfileCompletion><BookingCalendly /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/analytics",
        element: <PrivateRoute><RequireProfileCompletion><Analytics /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/badges",
        element: <PrivateRoute><RequireProfileCompletion><BadgesDashboard /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "/stripe-test",
        element: <PrivateRoute><RequireProfileCompletion><StripeTestInterface /></RequireProfileCompletion></PrivateRoute>
      },
      {
        path: "*",
        element: <NotFound />
      }
    ]
  }
]);

function App() {
  useEffect(() => {
    console.log("App initialized");
  }, []);

  return (
    <>
      <AuthProvider>
        <ReviewProvider>
          <SessionBookingProvider>
            <RouterProvider router={router} />
            <ReviewRequirement />
            <GlobalReviewModal />
            <Toaster />
          </SessionBookingProvider>
        </ReviewProvider>
      </AuthProvider>
    </>
  );
}

export default App;
