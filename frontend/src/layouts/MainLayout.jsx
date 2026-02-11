import React, { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Space, Button, theme } from "antd";
import {
    SearchOutlined,
    FileTextOutlined,
    PlusCircleOutlined,
    CheckCircleOutlined,
    SendOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    SettingOutlined,
    InboxOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import "../styles/layout.css";

const { Header, Content, Sider } = Layout;

const roleLabels = {
    ADMIN: "Quản trị viên",
    STAFF: "Nhân viên",
    MANAGER: "Quản lý",
    ISSUER: "Người cấp phát",
};

const menuItems = [
    {
        key: "/verify",
        icon: <SearchOutlined />,
        label: "Tra cứu văn bằng",
    },
    {
        key: "/diplomas",
        icon: <FileTextOutlined />,
        label: "Danh sách hồ sơ",
    },
    {
        key: "/create",
        icon: <PlusCircleOutlined />,
        label: "Tạo hồ sơ",
    },
    {
        key: "/my-diplomas",
        icon: <InboxOutlined />,
        label: "Hồ sơ của tôi",
    },
    {
        key: "/approval",
        icon: <CheckCircleOutlined />,
        label: "Duyệt hồ sơ",
    },
    {
        key: "/issuance",
        icon: <SendOutlined />,
        label: "Phát hành / Thu hồi",
    },
    {
        key: "/admin",
        icon: <UserOutlined />,
        label: "Quản lý người dùng",
    },
];

const userMenuItems = [
    {
        key: "profile",
        icon: <UserOutlined />,
        label: "Thông tin tài khoản",
    },
    {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Cài đặt",
    },
    {
        type: "divider",
    },
    {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true,
    },
];

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Lấy user từ localStorage
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role || "GUEST";

    const getFilteredMenuItems = () => {
        if (!user) {
            // Chưa login -> chỉ hiện Tra cứu
            return menuItems.filter(item => item.key === "/verify");
        }

        switch (role) {
            case "ADMIN":
                // Admin thấy hết hoặc tùy chỉnh
                return menuItems;
            case "STAFF":
                // STAFF: Tra cứu, Danh sách, Tạo hồ sơ, Hồ sơ của tôi
                return menuItems.filter(item => ["/verify", "/diplomas", "/create", "/my-diplomas"].includes(item.key));
            case "MANAGER":
                // MANAGER: Tra cứu, Danh sách, Duyệt
                return menuItems.filter(item => ["/verify", "/diplomas", "/approval"].includes(item.key));
            case "ISSUER":
                // ISSUER: Tra cứu, Danh sách, Phát hành
                return menuItems.filter(item => ["/verify", "/diplomas", "/issuance"].includes(item.key));
            default:
                return menuItems.filter(item => item.key === "/verify");
        }
    };

    const handleMenuClick = (e) => {
        // Find if user clicked a user menu item, do not navigate for "logout" key
        // Wait, handleMenuClick is for Sider menu. handleUserMenuClick is for Dropdown.
        // There is no overlap in keys, but be careful.
        // Actually handleMenuClick is only attached to Sider Menu.
        navigate(e.key);
    };

    const handleUserMenuClick = async ({ key }) => {
        if (key === "logout") {
            try {
                await api.post("/auth/logout");
            } catch (err) {
                console.error("Logout API failed", err);
            } finally {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            }
        } else {
            // For other keys like profile, settings, we might want to navigate
            // But currently no routes for them.
            // If we had routes: navigate(`/${key}`);
            console.log("User menu click:", key);
        }
    };

    return (
        <Layout className="main-layout">
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                className="main-sider"
                width={260}
            >
                <div className="logo-container">
                    <div className="logo">
                        <div className="logo-icon">🎓</div>
                        {!collapsed && <span className="logo-text">Hệ thống Văn bằng số</span>}
                    </div>
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={getFilteredMenuItems()}
                    onClick={handleMenuClick}
                    className="main-menu"
                />

                <div className="sider-footer">
                    {!collapsed && (
                        <div className="version-info">
                            <small>Phiên bản 1.0.0</small>
                        </div>
                    )}
                </div>
            </Sider>

            <Layout className="content-layout">
                <Header className="main-header" style={{ background: colorBgContainer }}>
                    <div className="header-left">
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            className="collapse-btn"
                        />
                        <div className="breadcrumb-info">
                            <span className="current-page">
                                {menuItems.find((item) => item.key === location.pathname)?.label || "Trang chủ"}
                            </span>
                        </div>
                    </div>

                    <div className="header-right">
                        {user ? (
                            <>
                                <div className="status-badge" style={{ marginRight: 16 }}>
                                    <span className="status-dot"></span>
                                    <span className="status-text">{roleLabels[role] || role}</span>
                                </div>
                                <Dropdown
                                    menu={{
                                        items: userMenuItems,
                                        onClick: handleUserMenuClick,
                                    }}
                                    placement="bottomRight"
                                    trigger={['click']}
                                >
                                    <Space className="user-dropdown">
                                        <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                                        <span className="user-name">{user.username || user.fullName || 'Người dùng'}</span>
                                    </Space>
                                </Dropdown>
                            </>
                        ) : (
                            <>
                                <div className="status-badge" style={{ marginRight: 16 }}>
                                    <span className="status-dot" style={{ backgroundColor: '#ccc' }}></span>
                                    <span className="status-text">Khách</span>
                                </div>
                                <Button type="primary" onClick={() => navigate('/login')}>
                                    Đăng nhập
                                </Button>
                            </>
                        )}
                    </div>
                </Header>

                <Content className="main-content">
                    <div
                        className="content-wrapper"
                        style={{
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}
