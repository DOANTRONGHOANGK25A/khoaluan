import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { VerifyPage } from "../pages/VerifyPage";
import { DiplomaListPage } from "../pages/DiplomaListPage";
import { DiplomaCreatePage } from "../pages/DiplomaCreatePage";
import { ApprovalPage } from "../pages/ApprovalPage";
import { IssuancePage } from "../pages/IssuancePage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { LoginPage } from "../pages/LoginPage";
import api from "../api/api";
const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/verify" replace />,
            },
            {
                path: "verify",
                element: <VerifyPage />,
            },
            {
                path: "diplomas",
                element: <DiplomaListPage />,
            },
            {
                path: "create",
                element: <DiplomaCreatePage />,
            },
            {
                path: "approval",
                element: <ApprovalPage />,
            },
            {
                path: "issuance",
                element: <IssuancePage />,
            },
            {
                path: "admin",
                element: <AdminUsersPage />,
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/verify" replace />,
    },
]);

export default router;
