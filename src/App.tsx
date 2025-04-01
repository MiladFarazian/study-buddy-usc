
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Index from "@/pages/Index";
import Tutors from "@/pages/Tutors";
import TutorProfile from "@/pages/TutorProfile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";
import Messages from "@/pages/Messages";
import Layout from "@/components/layout/Layout";
import PrivateRoute from "@/components/auth/PrivateRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Schedule from "@/pages/Schedule";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "tutors",
        element: (
          <PrivateRoute>
            <Tutors />
          </PrivateRoute>
        ),
      },
      {
        path: "tutors/:id",
        element: (
          <PrivateRoute>
            <TutorProfile />
          </PrivateRoute>
        ),
      },
      {
        path: "tutors/:id/schedule",
        element: (
          <PrivateRoute>
            <Schedule />
          </PrivateRoute>
        ),
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "settings",
        element: (
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        ),
      },
      {
        path: "messages",
        element: (
          <PrivateRoute>
            <Messages />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
