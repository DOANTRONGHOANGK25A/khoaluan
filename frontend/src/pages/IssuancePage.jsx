import React, { useState, useEffect } from "react";
import { Card, Tabs, Table, Button, Tag, Typography, Divider, Space, Popconfirm, message, Tooltip, Empty, Spin } from "antd";
import {
    SendOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RocketOutlined,
    StopOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listDiplomas, issueDiploma, revokeDiploma } from "../api/diplomas";
import "../styles/pages.css";

const { Title, Text } = Typography;

const STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    ISSUED: "ISSUED",
    REVOKED: "REVOKED",
};

export function IssuancePage() {
    const [diplomas, setDiplomas] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchDiplomas = async () => {
        setLoading(true);
        try {
            // Fetch all diplomas to categorize them
            // Optimization: In real app, might want to fetch by status in Tabs, but for now fetch all is easier with current structure
            const res = await listDiplomas();
            if (res && res.ok) {
                setDiplomas(res.data);
            }
        } catch (error) {
            console.error("Fetch diplomas error:", error);
            message.error("Lỗi khi tải danh sách văn bằng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiplomas();
    }, []);

    const ready = diplomas.filter((d) => d.status === STATUS.APPROVED);
    const issued = diplomas.filter((d) => d.status === STATUS.ISSUED);
    const revoked = diplomas.filter((d) => d.status === STATUS.REVOKED);

    const handleIssue = async (record) => {
        try {
            setLoading(true);
            const res = await issueDiploma(record.id);
            if (res && res.ok) {
                message.success(`Đã phát hành văn bằng ${record.serial_no} lên blockchain`);
                fetchDiplomas();
            }
        } catch (error) {
            console.error("Issue error:", error);
            message.error("Lỗi khi phát hành văn bằng");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (record) => {
        // Implement revoke
        try {
            setLoading(true);
            const res = await revokeDiploma(record.id);
            if (res && res.ok) {
                message.warning(`Đã thu hồi văn bằng ${record.serial_no}`);
                fetchDiplomas();
            }
        } catch (error) {
            console.error("Revoke error:", error);
            message.error("Lỗi khi thu hồi văn bằng");
        } finally {
            setLoading(false);
        }
    };

    const columnsReady = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Sinh viên", dataIndex: "student_name" },
        { title: "Ngành", dataIndex: "major", ellipsis: true },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: () => (
                <Tag icon={<CheckCircleOutlined />} color="processing">
                    Đã duyệt
                </Tag>
            ),
        },
        {
            title: "Hành động",
            width: 180,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                    <Popconfirm
                        title="Xác nhận phát hành"
                        description="Văn bằng sẽ được ghi lên blockchain. Tiếp tục?"
                        onConfirm={() => handleIssue(record)}
                        okText="Phát hành"
                        cancelText="Hủy"
                    >
                        <Button type="primary" icon={<RocketOutlined />}>
                            Phát hành
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const columnsIssued = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Sinh viên", dataIndex: "student_name" },
        { title: "Ngành", dataIndex: "major", ellipsis: true },
        {
            title: "TxID",
            dataIndex: "tx_id",
            ellipsis: true,
            render: (text) => (
                <Text code copyable={{ text }}>
                    {text?.substring(0, 16)}...
                </Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: () => (
                <Tag icon={<CheckCircleOutlined />} color="success">
                    Đã phát hành
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
                    <Popconfirm
                        title="Xác nhận thu hồi"
                        description="Văn bằng sẽ bị đánh dấu thu hồi trên blockchain. Tiếp tục?"
                        onConfirm={() => handleRevoke(record)}
                        okText="Thu hồi"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<StopOutlined />}>
                            Thu hồi
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const columnsRevoked = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Sinh viên", dataIndex: "student_name" },
        { title: "Ngành", dataIndex: "major", ellipsis: true },
        {
            title: "TxID",
            dataIndex: "tx_id",
            ellipsis: true,
            render: (text) => (
                <Text code copyable={{ text }}>
                    {text?.substring(0, 16)}...
                </Text>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: () => (
                <Tag icon={<CloseCircleOutlined />} color="error">
                    Đã thu hồi
                </Tag>
            ),
        },
        {
            title: "Hành động",
            width: 100,
            align: "center",
            render: (_, record) => (
                <Tooltip title="Xem chi tiết">
                    <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                </Tooltip>
            ),
        },
    ];

    const renderTable = (columns, data, emptyText) => {
        if (data.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="secondary">{emptyText}</Text>}
                />
            );
        }
        return (
            <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                pagination={{
                    pageSize: 6,
                    showTotal: (total) => `Tổng ${total} hồ sơ`,
                }}
                className="data-table"
            />
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon issuance-icon">
                    <SendOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Phát hành & Thu hồi</Title>
                    <Text type="secondary">
                        Quản lý việc phát hành văn bằng lên blockchain và thu hồi khi cần thiết
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="tabs-card">
                <Tabs
                    type="card"
                    items={[
                        {
                            key: "ready",
                            label: (
                                <Space>
                                    <CheckCircleOutlined />
                                    <span>Chờ phát hành ({ready.length})</span>
                                </Space>
                            ),
                            children: renderTable(columnsReady, ready, "Không có hồ sơ nào đang chờ phát hành"),
                        },
                        {
                            key: "issued",
                            label: (
                                <Space>
                                    <RocketOutlined />
                                    <span>Đã phát hành ({issued.length})</span>
                                </Space>
                            ),
                            children: renderTable(columnsIssued, issued, "Chưa có văn bằng nào được phát hành"),
                        },
                        {
                            key: "revoked",
                            label: (
                                <Space>
                                    <StopOutlined />
                                    <span>Đã thu hồi ({revoked.length})</span>
                                </Space>
                            ),
                            children: renderTable(columnsRevoked, revoked, "Không có văn bằng nào bị thu hồi"),
                        },
                    ]}
                />
            </Card>
        </div>
    );
}
