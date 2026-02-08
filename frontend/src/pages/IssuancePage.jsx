import React, { useState } from "react";
import { Card, Tabs, Table, Button, Tag, Typography, Divider, Space, Popconfirm, message, Tooltip, Empty, Modal, Avatar } from "antd";
import {
    SendOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RocketOutlined,
    StopOutlined,
    EyeOutlined,
    UserOutlined,
} from "@ant-design/icons";
import "../styles/pages.css";

const { Title, Text } = Typography;

// STATUS constant (local copy until diplomas API is implemented)
const STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    ISSUED: "ISSUED",
    REVOKED: "REVOKED",
};

export function IssuancePage() {
    // TODO: Fetch from real API when implemented
    const [diplomas] = useState([]);

    const ready = diplomas.filter((d) => d.status === STATUS.APPROVED);
    const issued = diplomas.filter((d) => d.status === STATUS.ISSUED);
    const revoked = diplomas.filter((d) => d.status === STATUS.REVOKED);

    const handleIssue = (record) => {
        message.success(`Đã phát hành văn bằng ${record.serialNo} lên blockchain`);
    };

    const handleRevoke = (record) => {
        message.warning(`Đã thu hồi văn bằng ${record.serialNo}`);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case STATUS.APPROVED:
                return { color: "processing", text: "Đã duyệt", icon: <CheckCircleOutlined /> };
            case STATUS.ISSUED:
                return { color: "success", text: "Đã phát hành", icon: <RocketOutlined /> };
            case STATUS.REVOKED:
                return { color: "error", text: "Đã thu hồi", icon: <CloseCircleOutlined /> };
            default:
                return { color: "default", text: status, icon: null };
        }
    };

    const openDetail = (record) => {
        const statusInfo = getStatusInfo(record.status);
        Modal.info({
            title: (
                <Space>
                    <SendOutlined />
                    <span>Chi tiết văn bằng</span>
                </Space>
            ),
            width: 560,
            content: (
                <div className="modal-detail-content">
                    <div className="detail-header-with-photo">
                        <Avatar
                            size={100}
                            src={record.photo}
                            icon={<UserOutlined />}
                            className="detail-photo"
                        />
                        <div className="detail-header-info">
                            <Title level={4} style={{ margin: 0 }}>{record.studentName}</Title>
                            <Text type="secondary">Mã SV: {record.studentId}</Text>
                            <div style={{ marginTop: 8 }}>
                                <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>
                            </div>
                        </div>
                    </div>
                    <div className="detail-divider" />
                    <div className="detail-item">
                        <Text type="secondary">Số hiệu văn bằng:</Text>
                        <Text strong>{record.serialNo}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Ngày sinh:</Text>
                        <Text>{record.birthDate}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Ngành:</Text>
                        <Text>{record.major}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Xếp loại:</Text>
                        <Text>{record.ranking}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">GPA:</Text>
                        <Text>{record.gpa}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Năm tốt nghiệp:</Text>
                        <Text>{record.graduationYear}</Text>
                    </div>
                    {record.txId && (
                        <div className="detail-item">
                            <Text type="secondary">TxID:</Text>
                            <Text code copyable style={{ fontSize: 11 }}>{record.txId}</Text>
                        </div>
                    )}
                </div>
            ),
            okText: "Đóng",
        });
    };

    const columnsReady = [
        {
            title: "Số hiệu",
            dataIndex: "serialNo",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Sinh viên", dataIndex: "studentName" },
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
                        <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
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
            dataIndex: "serialNo",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Sinh viên", dataIndex: "studentName" },
        { title: "Ngành", dataIndex: "major", ellipsis: true },
        {
            title: "TxID",
            dataIndex: "txId",
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
                        <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
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
            dataIndex: "serialNo",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Sinh viên", dataIndex: "studentName" },
        { title: "Ngành", dataIndex: "major", ellipsis: true },
        {
            title: "TxID",
            dataIndex: "txId",
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
                    <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
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
