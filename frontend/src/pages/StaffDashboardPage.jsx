import React, { useState, useEffect } from "react";
import { Card, Table, Button, Space, Tag, Typography, Divider, Empty, Tabs, message, Tooltip, Spin, Alert } from "antd";
import {
    ClockCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    EditOutlined,
    ReloadOutlined,
    InboxOutlined,
    ExclamationCircleOutlined,
    RedoOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listDiplomas, resubmitDiploma } from "../api/diplomas";
import "../styles/pages.css";

const { Title, Text } = Typography;

export function StaffDashboardPage() {
    const [pending, setPending] = useState([]);
    const [rejected, setRejected] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resPending, resRejected] = await Promise.all([
                listDiplomas({ status: "PENDING" }),
                listDiplomas({ status: "REJECTED" }),
            ]);
            if (resPending?.ok) setPending(resPending.data || []);
            if (resRejected?.ok) setRejected(resRejected.data || []);
        } catch (error) {
            console.error("Fetch error:", error);
            message.error("Lỗi khi tải danh sách hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResubmit = async (record) => {
        try {
            setLoading(true);
            const res = await resubmitDiploma(record.id);
            if (res?.ok) {
                message.success(`Đã gửi lại hồ sơ ${record.serial_no} để duyệt`);
                fetchData();
            }
        } catch (e) {
            console.error("Resubmit error:", e);
            message.error(e.response?.data?.message || "Lỗi khi gửi lại hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    // ─── Cột bảng Chờ duyệt ───
    const columnsPending = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no",
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Sinh viên",
            dataIndex: "student_name",
        },
        {
            title: "Ngành",
            dataIndex: "major",
            ellipsis: true,
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            render: (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—",
            sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
            defaultSortOrder: "ascend",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 130,
            render: () => (
                <Tag icon={<ClockCircleOutlined />} color="warning">
                    Chờ duyệt
                </Tag>
            ),
        },
        {
            title: "Hành động",
            width: 120,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                        <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // ─── Cột bảng Bị từ chối ───
    const columnsRejected = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no",
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Sinh viên",
            dataIndex: "student_name",
        },
        {
            title: "Ngành",
            dataIndex: "major",
            ellipsis: true,
        },
        {
            title: "Lý do từ chối",
            dataIndex: "rejected_reason",
            ellipsis: true,
            render: (text) => text ? (
                <Tooltip title={text}>
                    <Text type="danger" style={{ fontSize: 13 }}>{text}</Text>
                </Tooltip>
            ) : <Text type="secondary">—</Text>,
        },
        {
            title: "Ngày từ chối",
            dataIndex: "rejected_at",
            width: 120,
            render: (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—",
            sorter: (a, b) => new Date(b.rejected_at || 0) - new Date(a.rejected_at || 0),
            defaultSortOrder: "ascend",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 130,
            render: () => (
                <Tag icon={<CloseCircleOutlined />} color="magenta">
                    Bị từ chối
                </Tag>
            ),
        },
        {
            title: "Hành động",
            width: 160,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa & gửi lại">
                        <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                    <Tooltip title="Gửi lại duyệt">
                        <Button type="text" icon={<RedoOutlined />} style={{ color: '#1890ff' }} onClick={() => handleResubmit(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const tabItems = [
        {
            key: "pending",
            label: (
                <Space>
                    <ClockCircleOutlined />
                    <span>Chờ duyệt</span>
                    {pending.length > 0 && (
                        <Tag color="warning" style={{ marginLeft: 4 }}>{pending.length}</Tag>
                    )}
                </Space>
            ),
            children: (
                <>
                    <Card className="info-card" style={{ marginBottom: 16 }}>
                        <Space>
                            <ClockCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
                            <Text>
                                Có <Text strong style={{ color: "#faad14" }}>{pending.length}</Text> hồ sơ đang chờ quản lý duyệt
                            </Text>
                        </Space>
                    </Card>
                    {pending.length > 0 ? (
                        <Table
                            rowKey="id"
                            columns={columnsPending}
                            dataSource={pending}
                            loading={loading}
                            pagination={{
                                pageSize: 8,
                                showTotal: (total) => `Tổng ${total} hồ sơ`,
                            }}
                            className="data-table"
                        />
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">Không có hồ sơ nào đang chờ duyệt</Text>}
                        />
                    )}
                </>
            ),
        },
        {
            key: "rejected",
            label: (
                <Space>
                    <CloseCircleOutlined />
                    <span>Bị từ chối</span>
                    {rejected.length > 0 && (
                        <Tag color="magenta" style={{ marginLeft: 4 }}>{rejected.length}</Tag>
                    )}
                </Space>
            ),
            children: (
                <>
                    {rejected.length > 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            icon={<ExclamationCircleOutlined />}
                            message={
                                <Text>
                                    Có <Text strong style={{ color: "#eb2f96" }}>{rejected.length}</Text> hồ sơ bị từ chối. 
                                    Vui lòng chỉnh sửa và gửi lại duyệt.
                                </Text>
                            }
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {rejected.length > 0 ? (
                        <Table
                            rowKey="id"
                            columns={columnsRejected}
                            dataSource={rejected}
                            loading={loading}
                            pagination={{
                                pageSize: 8,
                                showTotal: (total) => `Tổng ${total} hồ sơ`,
                            }}
                            className="data-table"
                        />
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">Không có hồ sơ nào bị từ chối</Text>}
                        />
                    )}
                </>
            ),
        },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
                    <InboxOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Hồ sơ của tôi</Title>
                    <Text type="secondary">
                        Theo dõi trạng thái hồ sơ chờ duyệt và bị từ chối để chỉnh sửa kịp thời
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="table-card">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchData}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                </div>

                <Spin spinning={loading}>
                    <Tabs
                        defaultActiveKey="pending"
                        items={tabItems}
                        size="large"
                    />
                </Spin>
            </Card>
        </div>
    );
}
