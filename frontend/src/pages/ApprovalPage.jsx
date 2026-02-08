import React, { useState } from "react";
import { Card, Table, Button, Space, Tag, Typography, Divider, Empty, Popconfirm, message, Tooltip, Modal, Avatar } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
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

export function ApprovalPage() {
    // TODO: Fetch from real API when implemented
    const [data] = useState([]);

    const handleApprove = (record) => {
        message.success(`Đã duyệt hồ sơ ${record.serialNo}`);
    };

    const handleReject = (record) => {
        message.error(`Đã từ chối hồ sơ ${record.serialNo}`);
    };

    const openDetail = (record) => {
        Modal.info({
            title: (
                <Space>
                    <ClockCircleOutlined />
                    <span>Chi tiết hồ sơ chờ duyệt</span>
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
                                <Tag icon={<ClockCircleOutlined />} color="warning">Chờ duyệt</Tag>
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
                    <div className="detail-item">
                        <Text type="secondary">Ngày tạo hồ sơ:</Text>
                        <Text>{record.date}</Text>
                    </div>
                </div>
            ),
            okText: "Đóng",
        });
    };

    const columns = [
        {
            title: "Số hiệu",
            dataIndex: "serialNo",
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Sinh viên",
            dataIndex: "studentName",
        },
        {
            title: "Ngành",
            dataIndex: "major",
            ellipsis: true,
        },
        {
            title: "Ngày tạo",
            dataIndex: "date",
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
                        <Button type="text" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
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
                    <Popconfirm
                        title="Xác nhận từ chối"
                        description="Bạn có chắc muốn từ chối hồ sơ này?"
                        onConfirm={() => handleReject(record)}
                        okText="Từ chối"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Từ chối">
                            <Button danger icon={<CloseCircleOutlined />} />
                        </Tooltip>
                    </Popconfirm>
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
