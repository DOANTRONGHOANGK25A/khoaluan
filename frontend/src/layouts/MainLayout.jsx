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
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../styles/layout.css";

const { Header, Content, Sider } = Layout;

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

    const handleMenuClick = (e) => {
        navigate(e.key);
    };

    const handleUserMenuClick = ({ key }) => {
        if (key === "logout") {
            navigate("/login");
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
                        {!collapsed && <span className="logo-text">Diploma System</span>}
                    </div>
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    className="main-menu"
                />

                <div className="sider-footer">
                    {!collapsed && (
                        <div className="version-info">
                            <small>Version 1.0.0</small>
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
                        <div className="status-badge">
                            <span className="status-dot"></span>
                            <span className="status-text">Demo Mode</span>
                        </div>

                        <Dropdown
                            menu={{
                                items: userMenuItems,
                                onClick: handleUserMenuClick,
                            }}
                            placement="bottomRight"
                            trigger={["click"]}
                        >
                            <Space className="user-dropdown">
                                <Avatar
                                    style={{ backgroundColor: "#1890ff" }}
                                    icon={<UserOutlined />}
                                />
                                <span className="user-name">Admin</span>
                            </Space>
                        </Dropdown>
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
