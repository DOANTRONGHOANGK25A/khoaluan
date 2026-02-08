import React, { useState, useEffect } from "react";
import { Card, Table, Button, Space, Tag, Typography, Divider, Empty, Popconfirm, message, Tooltip, Avatar } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listDiplomas, approveDiploma, rejectDiploma } from "../api/diplomas"; // Import API
import "../styles/pages.css";

const { Title, Text } = Typography;

export function ApprovalPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch pending diplomas on mount
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await listDiplomas({ status: "PENDING" });
            if (res && res.ok) {
                setData(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch pending diplomas:", error);
            message.error("Lỗi khi tải danh sách hồ sơ chờ duyệt");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (record) => {
        try {
            setLoading(true);
            const res = await approveDiploma(record.id);
            if (res && res.ok) {
                message.success(`Đã duyệt hồ sơ ${record.serial_no}`);
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error("Approve error:", error);
            message.error("Lỗi khi duyệt hồ sơ");
            setLoading(false);
        }
    };

    const handleReject = async (record) => {
        const reason = window.prompt("Nhập lý do từ chối (nếu có):");
        if (reason === null) { // User clicked Cancel
            return;
        }

        try {
            setLoading(true);
            const res = await rejectDiploma(record.id, reason);
            if (res && res.ok) {
                message.success(`Đã từ chối hồ sơ ${record.serial_no}`);
                fetchData(); // Refresh list
            }
        } catch (error) {
            console.error("Reject error:", error);
            message.error("Lỗi khi từ chối hồ sơ");
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no", // API returns snake_case
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
            render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : "",
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: () => (
                <Tag icon={<ClockCircleOutlined />} color="warning">
                    Chờ duyệt
                </Tag>
            ),
        },
        {
            title: "Hành động",
            width: 200,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xác nhận duyệt"
                        description="Bạn có chắc muốn duyệt hồ sơ này?"
                        onConfirm={() => handleApprove(record)}
                        okText="Duyệt"
                        cancelText="Hủy"
                    >
                        <Button type="primary" icon={<CheckCircleOutlined />}>
                            Duyệt
                        </Button>
                    </Popconfirm>
                    <Tooltip title="Từ chối">
                        <Button danger icon={<CloseCircleOutlined />} onClick={() => handleReject(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon approval-icon">
                    <CheckCircleOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Duyệt hồ sơ</Title>
                    <Text type="secondary">
                        Xem xét và phê duyệt các hồ sơ văn bằng đang chờ xử lý
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="info-card">
                <Space>
                    <ClockCircleOutlined style={{ color: "#faad14", fontSize: 20 }} />
                    <Text>
                        Có <Text strong style={{ color: "#faad14" }}>{data.length}</Text> hồ sơ đang chờ được duyệt
                    </Text>
                </Space>
            </Card>

            <Card className="table-card" style={{ marginTop: 16 }}>
                {data.length > 0 ? (
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={data}
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
                        description={
                            <Text type="secondary">
                                Không có hồ sơ nào đang chờ duyệt
                            </Text>
                        }
                    />
                )}
            </Card>
        </div>
    );
}
