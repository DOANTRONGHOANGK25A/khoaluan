import React, { useState, useEffect } from "react";
import { Card, Table, Tag, Button, Space, Input, Modal, Typography, Row, Col, Statistic, Tooltip, Avatar, Spin, message } from "antd";
import {
    FileTextOutlined,
    SearchOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    UserOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import { listDiplomas, downloadDiplomaFile } from "../api/diplomas";
import "../styles/pages.css";

const { Title, Text } = Typography;

const STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    ISSUED: "ISSUED",
    REVOKED: "REVOKED",
};

export function DiplomaListPage() {
    const [searchText, setSearchText] = useState("");
    const [diplomas, setDiplomas] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDiplomas = async (q = "") => {
        setLoading(true);
        try {
            const res = await listDiplomas({ q });
            if (res.ok) {
                setDiplomas(res.data || []);
            }
        } catch (err) {
            message.error("Không thể tải danh sách hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiplomas();
    }, []);

    const handleSearch = (value) => {
        setSearchText(value);
        fetchDiplomas(value);
    };

    const stats = {
        total: diplomas.length,
        pending: diplomas.filter((d) => d.status === STATUS.PENDING).length,
        approved: diplomas.filter((d) => d.status === STATUS.APPROVED).length,
        issued: diplomas.filter((d) => d.status === STATUS.ISSUED).length,
        revoked: diplomas.filter((d) => d.status === STATUS.REVOKED).length,
    };

    const handleViewPhoto = async (record) => {
        try {
            const blob = await downloadDiplomaFile(record.id, "PORTRAIT");
            const url = URL.createObjectURL(blob);
            Modal.info({
                title: "Ảnh chân dung",
                content: <img src={url} alt="Portrait" style={{ maxWidth: "100%" }} />,
                okText: "Đóng",
                onOk: () => URL.revokeObjectURL(url),
            });
        } catch {
            message.error("Không thể tải ảnh");
        }
    };

    const openDetail = (record) => {
        Modal.info({
            title: (
                <Space>
                    <FileTextOutlined />
                    <span>Chi tiết hồ sơ văn bằng</span>
                </Space>
            ),
            width: 560,
            content: (
                <div className="modal-detail-content">
                    <div className="detail-header-with-photo">
                        <Avatar
                            size={100}
                            icon={<UserOutlined />}
                            className="detail-photo"
                        />
                        <div className="detail-header-info">
                            <Title level={4} style={{ margin: 0 }}>{record.student_name}</Title>
                            <Text type="secondary">Mã SV: {record.student_id}</Text>
                            <div style={{ marginTop: 8 }}>
                                <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
                            </div>
                        </div>
                    </div>
                    <div className="detail-divider" />
                    <div className="detail-item">
                        <Text type="secondary">Số hiệu văn bằng:</Text>
                        <Text strong>{record.serial_no}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Ngày sinh:</Text>
                        <Text>{record.birth_date || "-"}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Ngành:</Text>
                        <Text>{record.major || "-"}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Xếp loại:</Text>
                        <Text>{record.ranking || "-"}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">GPA:</Text>
                        <Text>{record.gpa || "-"}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Năm tốt nghiệp:</Text>
                        <Text>{record.graduation_year || "-"}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Số file đính kèm:</Text>
                        <Text>{record.file_count || 0}</Text>
                    </div>
                </div>
            ),
            okText: "Đóng",
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case STATUS.ISSUED:
                return "success";
            case STATUS.REVOKED:
                return "error";
            case STATUS.APPROVED:
                return "processing";
            default:
                return "warning";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case STATUS.ISSUED:
                return <CheckCircleOutlined />;
            case STATUS.REVOKED:
                return <CloseCircleOutlined />;
            case STATUS.APPROVED:
                return <ExclamationCircleOutlined />;
            default:
                return <ClockCircleOutlined />;
        }
    };

    const columns = [
        {
            title: "Số hiệu",
            dataIndex: "serial_no",
            sorter: (a, b) => a.serial_no.localeCompare(b.serial_no),
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Sinh viên",
            dataIndex: "student_name",
            sorter: (a, b) => a.student_name.localeCompare(b.student_name),
        },
        {
            title: "Ngành",
            dataIndex: "major",
            ellipsis: true,
        },
        {
            title: "Xếp loại",
            dataIndex: "ranking",
            width: 120,
            filters: [
                { text: "Xuất sắc", value: "Xuất sắc" },
                { text: "Giỏi", value: "Giỏi" },
                { text: "Khá", value: "Khá" },
                { text: "Trung bình", value: "Trung bình" },
            ],
            onFilter: (value, record) => record.ranking === value,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            filters: Object.values(STATUS).map((s) => ({ text: s, value: s })),
            onFilter: (value, record) => record.status === value,
            render: (status) => (
                <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
                    {status}
                </Tag>
            ),
        },
        {
            title: "Hành động",
            width: 100,
            align: "center",
            render: (_, record) => (
                <Tooltip title="Xem chi tiết">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => openDetail(record)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon list-icon">
                    <FileTextOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Danh sách hồ sơ</Title>
                    <Text type="secondary">
                        Quản lý và theo dõi tất cả hồ sơ văn bằng trong hệ thống
                    </Text>
                </div>
            </div>

            <Row gutter={16} className="stats-row">
                <Col xs={12} sm={8} md={4}>
                    <Card className="stat-card">
                        <Statistic title="Tổng số" value={stats.total} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={5}>
                    <Card className="stat-card pending">
                        <Statistic
                            title="Chờ duyệt"
                            value={stats.pending}
                            valueStyle={{ color: "#faad14" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={5}>
                    <Card className="stat-card approved">
                        <Statistic
                            title="Đã duyệt"
                            value={stats.approved}
                            valueStyle={{ color: "#1890ff" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={5}>
                    <Card className="stat-card issued">
                        <Statistic
                            title="Đã phát hành"
                            value={stats.issued}
                            valueStyle={{ color: "#52c41a" }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={5}>
                    <Card className="stat-card revoked">
                        <Statistic
                            title="Đã thu hồi"
                            value={stats.revoked}
                            valueStyle={{ color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="table-card">
                <div className="table-header">
                    <Input.Search
                        placeholder="Tìm kiếm theo số hiệu hoặc tên sinh viên..."
                        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                        onSearch={handleSearch}
                        className="search-input-table"
                        allowClear
                        enterButton
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchDiplomas(searchText)}
                        loading={loading}
                    >
                        Tải lại
                    </Button>
                </div>

                <Spin spinning={loading}>
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={diplomas}
                        pagination={{
                            pageSize: 8,
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} của ${total} hồ sơ`,
                        }}
                        className="data-table"
                    />
                </Spin>
            </Card>
        </div>
    );
}
