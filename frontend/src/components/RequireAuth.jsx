import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
    const token = localStorage.getItem("token");
    const location = useLocation();

    if (!token) {
        // Lưu trang đang cố truy cập để quay lại sau khi login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
