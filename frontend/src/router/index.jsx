import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import RequireAuth from "../components/RequireAuth";
import { VerifyPage } from "../pages/VerifyPage";
import { DiplomaListPage } from "../pages/DiplomaListPage";
import { DiplomaDetailPage } from "../pages/DiplomaDetailPage";
import { DiplomaCreatePage } from "../pages/DiplomaCreatePage";
import { ApprovalPage } from "../pages/ApprovalPage";
import { IssuancePage } from "../pages/IssuancePage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { LoginPage } from "../pages/LoginPage";
import { StaffDashboardPage } from "../pages/StaffDashboardPage";

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
                // Route công khai — khách có thể truy cập
                path: "verify",
                element: <VerifyPage />,
            },
            {
                // Các route cần đăng nhập
                element: <RequireAuth />,
                children: [
                    {
                        path: "diplomas",
                        element: <DiplomaListPage />,
                    },
                    {
                        path: "diplomas/:id",
                        element: <DiplomaDetailPage />,
                    },
                    {
                        path: "create",
                        element: <DiplomaCreatePage />,
                    },
                    {
                        path: "my-diplomas",
                        element: <StaffDashboardPage />,
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
        ],
    },
    {
        path: "*",
        element: <Navigate to="/verify" replace />,
    },
]);

export default router;
