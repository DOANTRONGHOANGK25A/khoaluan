import React, { useState, useEffect } from "react";
import { Card, Table, Button, Space, Tag, Typography, Divider, Modal, Form, Input, Select, message, Tooltip, Popconfirm, Spin } from "antd";
import {
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import api from "../api/api";
import "../styles/pages.css";

const { Title, Text } = Typography;

const roleColors = {
    ADMIN: "red",
    STAFF: "blue",
    MANAGER: "gold",
    ISSUER: "green",
};

const roleLabels = {
    ADMIN: "Quản trị viên",
    STAFF: "Nhân viên",
    MANAGER: "Quản lý",
    ISSUER: "Người cấp phát",
};

export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/users");
            if (res.data.ok) {
                setUsers(res.data.data);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Không thể tải danh sách người dùng";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const res = await api.post("/users", {
                username: values.username,
                password: values.password,
                role: values.role,
            });

            if (res.data.ok) {
                message.success("Tạo người dùng thành công!");
                setIsModalOpen(false);
                fetchUsers();
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Tạo người dùng thất bại";
            message.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (record) => {
        message.info(`Chức năng xóa chưa được triển khai`);
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            width: 60,
        },
        {
            title: "Tên đăng nhập",
            dataIndex: "username",
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            render: (role) => (
                <Tag color={roleColors[role]}>{roleLabels[role] || role}</Tag>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
        },
        {
            title: "Hành động",
            width: 150,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined />} disabled />
                    </Tooltip>
                    <Tooltip title="Đặt lại mật khẩu">
                        <Button type="text" icon={<KeyOutlined />} disabled />
                    </Tooltip>
                    <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc muốn xóa người dùng này?"
                        onConfirm={() => handleDelete(record)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa">
                            <Button type="text" danger icon={<DeleteOutlined />} disabled />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon admin-icon">
                    <UserOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Quản lý người dùng</Title>
                    <Text type="secondary">
                        Quản lý tài khoản người dùng và phân quyền trong hệ thống
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="table-card">
                <div className="table-header">
                    <Text>Tổng số: <Text strong>{users.length}</Text> người dùng</Text>
                    <Space>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchUsers}
                            loading={loading}
                        >
                            Làm mới
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                        >
                            Thêm người dùng
                        </Button>
                    </Space>
                </div>

                <Spin spinning={loading}>
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={users}
                        pagination={{
                            pageSize: 8,
                            showTotal: (total) => `Tổng ${total} người dùng`,
                        }}
                        className="data-table"
                    />
                </Spin>
            </Card>

            <Modal
                title={
                    <Space>
                        <UserOutlined />
                        <span>Thêm người dùng mới</span>
                    </Space>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        label="Tên đăng nhập"
                        name="username"
                        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
                    >
                        <Input placeholder="Nhập tên đăng nhập" />
                    </Form.Item>

                    <Form.Item
                        label="Vai trò"
                        name="role"
                        rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                    >
                        <Select
                            placeholder="Chọn vai trò"
                            options={[
                                { value: "ADMIN", label: "Quản trị viên" },
                                { value: "STAFF", label: "Nhân viên" },
                                { value: "MANAGER", label: "Quản lý" },
                                { value: "ISSUER", label: "Người cấp phát" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <div className="modal-actions">
                        <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Tạo người dùng
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
