
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

import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import FeaturedTutors from "./pages/FeaturedTutors";
import Settings from "./pages/Settings";
import { Navigate } from "react-router-dom";
import { ProfileSettings } from "./components/settings/ProfileSettings";
import { AccountSettings } from "./components/settings/AccountSettings";
import { NotificationSettings } from "./components/settings/NotificationSettings";
import { PaymentSettingsTab } from "./components/settings/PaymentSettingsTab";
import { PrivacySettings } from "./components/settings/PrivacySettings";
import { TutorSettingsTab } from "./components/settings/TutorSettingsTab";
import { CoursesSettings } from "./components/settings/CoursesSettings";
import { TutorStudentCoursesSettings } from "./components/settings/TutorStudentCoursesSettings";
import { AvailabilitySettings } from "./components/scheduling/AvailabilitySettings";
import Resources from "./pages/Resources";
import Students from "./pages/Students";
import AuthCallback from "./pages/AuthCallback";
import BookingCalendly from "./pages/BookingCalendly";
import Analytics from "./pages/Analytics";
import BadgesDashboard from "./pages/TutorDashboard/BadgesDashboard";
import StripeTestInterface from "./pages/StripeTestInterface";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import PaymentFlowTester from "./pages/PaymentFlowTester";
import { TransferTest } from "./pages/TransferTest";

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
        element: <PrivateRoute><Profile /></PrivateRoute>
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
        element: <PrivateRoute><Schedule /></PrivateRoute>
      },
      {
        path: "/messages",
        element: <PrivateRoute><Messages /></PrivateRoute>
      },
      {
        path: "/featured-tutors",
        element: <FeaturedTutors />
      },
      {
        path: "/settings",
        element: <PrivateRoute><Settings /></PrivateRoute>,
        children: [
          {
            index: true,
            element: <Navigate to="/settings/profile" replace />
          },
          {
            path: "profile",
            element: <ProfileSettings />
          },
          {
            path: "account", 
            element: <AccountSettings />
          },
          {
            path: "courses",
            element: <CoursesSettings />
          },
          {
            path: "student-courses",
            element: <TutorStudentCoursesSettings />
          },
          {
            path: "availability",
            element: <AvailabilitySettings />
          },
          {
            path: "tutor-settings", 
            element: <TutorSettingsTab />
          },
          {
            path: "notifications",
            element: <NotificationSettings />
          },
          {
            path: "payment",
            element: <PaymentSettingsTab />
          },
          {
            path: "privacy",
            element: <PrivacySettings />
          }
        ]
      },
      {
        path: "/resources",
        element: <Resources />
      },
      {
        path: "/students",
        element: <PrivateRoute><Students /></PrivateRoute>
      },
      {
        path: "/booking",
        element: <PrivateRoute><BookingCalendly /></PrivateRoute>
      },
      {
        path: "/analytics",
        element: <PrivateRoute><Analytics /></PrivateRoute>
      },
      {
        path: "/badges",
        element: <PrivateRoute><BadgesDashboard /></PrivateRoute>
      },
      {
        path: "/stripe-test",
        element: <PrivateRoute><StripeTestInterface /></PrivateRoute>
      },
      {
        path: "/payment-success",
        element: <PaymentSuccess />
      },
      {
        path: "/payment-canceled", 
        element: <PaymentCanceled />
      },
      {
        path: "/payment-flow-tester",
        element: <PrivateRoute><PaymentFlowTester /></PrivateRoute>
      },
      {
        path: "/transfer-test",
        element: <TransferTest />
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
