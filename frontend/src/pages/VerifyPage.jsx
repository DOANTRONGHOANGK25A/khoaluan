import React, { useState } from "react";
import { Card, Input, Typography, Space, Divider, Empty, Spin, Tag, Avatar } from "antd";
import { SearchOutlined, SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from "@ant-design/icons";
import "../styles/pages.css";

const { Title, Text, Paragraph } = Typography;

// STATUS constants (local copy for now until diplomas API is implemented)
const STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    ISSUED: "ISSUED",
    REVOKED: "REVOKED",
};

export function VerifyPage() {
    const [loading, setLoading] = useState(false);
    const [searchResult, setSearchResult] = useState(null);

    const handleSearch = (value) => {
        if (!value) return;
        setLoading(true);
        // TODO: Call real API to verify diploma
        setTimeout(() => {
            setSearchResult("not_found");
            setLoading(false);
        }, 800);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case STATUS.ISSUED:
                return { color: "success", text: "Hợp lệ - Đã phát hành", icon: <CheckCircleOutlined /> };
            case STATUS.REVOKED:
                return { color: "error", text: "Đã thu hồi", icon: <CloseCircleOutlined /> };
            default:
                return { color: "warning", text: "Chưa phát hành", icon: null };
        }
    };

    const renderResult = () => {
        if (loading) {
            return (
                <Card className="result-card">
                    <div className="loading-wrapper">
                        <Spin size="large" />
                        <Text type="secondary" style={{ marginTop: 16 }}>
                            Đang tra cứu thông tin...
                        </Text>
                    </div>
                </Card>
            );
        }

        if (!searchResult) {
            return (
                <Card className="result-card">
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Text type="secondary">
                                Nhập số hiệu văn bằng để bắt đầu tra cứu
                            </Text>
                        }
                    />
                </Card>
            );
        }

        if (searchResult === "not_found") {
            return (
                <Card className="result-card result-not-found">
                    <div className="verify-result-header">
                        <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
                        <Title level={4} style={{ margin: "16px 0 8px" }}>Không tìm thấy văn bằng</Title>
                        <Text type="secondary">
                            Số hiệu văn bằng không tồn tại trong hệ thống hoặc chưa được phát hành.
                        </Text>
                    </div>
                </Card>
            );
        }

        const statusInfo = getStatusInfo(searchResult.status);
        const isValid = searchResult.status === STATUS.ISSUED;

        return (
            <Card className={`result-card ${isValid ? "result-valid" : "result-invalid"}`}>
                <div className="verify-result-header">
                    <SafetyCertificateOutlined style={{ fontSize: 48, color: isValid ? "#52c41a" : "#ff4d4f" }} />
                    <Title level={4} style={{ margin: "16px 0 8px" }}>
                        {isValid ? "Văn bằng hợp lệ" : "Văn bằng không hợp lệ"}
                    </Title>
                    <Tag icon={statusInfo.icon} color={statusInfo.color} style={{ fontSize: 14, padding: "4px 12px" }}>
                        {statusInfo.text}
                    </Tag>
                </div>

                <Divider />

                <div className="verify-detail-content">
                    <div className="detail-header-with-photo">
                        <Avatar
                            size={100}
                            src={searchResult.photo}
                            icon={<UserOutlined />}
                            className="detail-photo"
                        />
                        <div className="detail-header-info">
                            <Title level={4} style={{ margin: 0 }}>{searchResult.studentName}</Title>
                            <Text type="secondary">Mã SV: {searchResult.studentId}</Text>
                        </div>
                    </div>
                    <div className="detail-divider" />
                    <div className="detail-item">
                        <Text type="secondary">Số hiệu văn bằng:</Text>
                        <Text strong>{searchResult.serialNo}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Ngày sinh:</Text>
                        <Text>{searchResult.birthDate}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Ngành:</Text>
                        <Text>{searchResult.major}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Xếp loại:</Text>
                        <Text>{searchResult.ranking}</Text>
                    </div>
                    <div className="detail-item">
                        <Text type="secondary">Năm tốt nghiệp:</Text>
                        <Text>{searchResult.graduationYear}</Text>
                    </div>
                    {searchResult.txId && (
                        <div className="detail-item">
                            <Text type="secondary">TxID Blockchain:</Text>
                            <Text code copyable style={{ fontSize: 11 }}>{searchResult.txId}</Text>
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon verify-icon">
                    <SafetyCertificateOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Tra cứu văn bằng</Title>
                    <Text type="secondary">
                        Xác thực văn bằng bằng cách nhập số hiệu hoặc mã QR
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="search-card">
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div className="search-wrapper">
                        <Input.Search
                            size="large"
                            placeholder="Nhập số hiệu văn bằng (VD: TN2025-001)"
                            enterButton={
                                <Space>
                                    <SearchOutlined />
                                    <span>Tra cứu</span>
                                </Space>
                            }
                            onSearch={handleSearch}
                            loading={loading}
                            className="search-input"
                        />
                    </div>
                    <Paragraph type="secondary" className="search-hint">
                        Bạn có thể tìm kiếm bằng số hiệu văn bằng, mã sinh viên, hoặc quét mã QR trên văn bằng
                    </Paragraph>
                </Space>
            </Card>

            <div style={{ marginTop: 24 }}>
                {renderResult()}
            </div>
        </div>
    );
}
