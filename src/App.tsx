
import { useEffect } from "react";
import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { SessionBookingProvider } from "./contexts/SessionBookingContext";
import { ReviewProvider } from "./contexts/ReviewContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { GlobalReviewModal } from "./components/reviews/GlobalReviewModal";
import { Toaster } from "./components/ui/toaster";
import { ReviewRequirement } from "./components/reviews";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DevLogin from "./pages/DevLogin";
import Index from "./pages/Index";

import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/Courses";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import TutorProfilePage from "./pages/TutorProfile/TutorProfilePage";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/auth/PrivateRoute";
import { ReferralGuard } from "./components/auth/ReferralGuard";
import { AdminRoute } from "./components/auth/AdminRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import { RoleGuard } from "./components/auth/RoleGuard";

import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import FeaturedTutors from "./pages/FeaturedTutors";
import Settings from "./pages/Settings";
import { Navigate } from "react-router-dom";
import { ProfileSettings } from "./components/settings/ProfileSettings";
import { ReferralSettings } from "./components/settings/ReferralSettings";
import { AccountSettings } from "./components/settings/AccountSettings";
import { NotificationSettings } from "./components/settings/NotificationSettings";
import { PaymentSettingsTab } from "./components/settings/PaymentSettingsTab";
import { PrivacySettings } from "./components/settings/PrivacySettings";
import { TutorSettingsTab } from "./components/settings/TutorSettingsTab";
import { CoursesSettingsWrapper } from "./components/settings/CoursesSettingsWrapper";
import { TutorStudentCoursesSettings } from "./components/settings/TutorStudentCoursesSettings";
import { AvailabilitySettings } from "./components/scheduling/AvailabilitySettings";
import Resources from "./pages/Resources";
import Students from "./pages/Students";
import AuthCallback from "./pages/AuthCallback";
import BookingCalendly from "./pages/BookingCalendly";
import Analytics from "./pages/Analytics";
import BadgesDashboard from "./pages/TutorDashboard/BadgesDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import FAQ from "./pages/FAQ";
import StudentOnboarding from "./pages/onboarding/StudentOnboarding";
import TutorOnboarding from "./pages/onboarding/TutorOnboarding";
import MakeSchoolEasy from "./pages/MakeSchoolEasy";

const router = createBrowserRouter([
  // Admin routes - completely separate from student/tutor
  {
    path: "/admin",
    element: <AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>
  },
  // Student/Tutor routes - main application
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
        element: <Navigate to="/settings/profile" replace />
      },
      {
        path: "/tutor-dashboard",
        element: <PrivateRoute><RoleGuard allowedRoles={['tutor']}><TutorDashboard /></RoleGuard></PrivateRoute>
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
            path: "referrals",
            element: <ReferralSettings />
          },
          {
            path: "account", 
            element: <AccountSettings />
          },
          {
            path: "courses",
            element: <CoursesSettingsWrapper />
          },
          {
            path: "student-courses",
            element: <TutorStudentCoursesSettings />
          },
          {
            path: "availability",
            element: <RoleGuard allowedRoles={['tutor']}><AvailabilitySettings /></RoleGuard>
          },
          {
            path: "tutor-settings", 
            element: <RoleGuard allowedRoles={['tutor']}><TutorSettingsTab /></RoleGuard>
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
        element: (
          <PrivateRoute>
            <Resources />
          </PrivateRoute>
        )
      },
      {
        path: "/students",
        element: <PrivateRoute><RoleGuard allowedRoles={['tutor']}><Students /></RoleGuard></PrivateRoute>
      },
      {
        path: "/booking",
        element: <PrivateRoute><BookingCalendly /></PrivateRoute>
      },
      {
        path: "/analytics",
        element: (
          <PrivateRoute>
            <Analytics />
          </PrivateRoute>
        )
      },
      {
        path: "/badges",
        element: <PrivateRoute><RoleGuard allowedRoles={['tutor']}><BadgesDashboard /></RoleGuard></PrivateRoute>
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
        path: "/faq",
        element: <FAQ />
      },
      {
        path: "/make-school-easy",
        element: <MakeSchoolEasy />
      },
      {
        path: "/onboarding/student",
        element: <StudentOnboarding />
      },
      {
        path: "/onboarding/tutor",
        element: <TutorOnboarding />
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
      <AdminAuthProvider>
        <AuthProvider>
          <ViewModeProvider>
            <ReviewProvider>
              <SessionBookingProvider>
                <RouterProvider router={router} />
                <ReviewRequirement />
                <GlobalReviewModal />
                <Toaster />
              </SessionBookingProvider>
            </ReviewProvider>
          </ViewModeProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </>
  );
}

export default App;
