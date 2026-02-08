import React, { useState } from "react";
import { Card, Input, Typography, Space, Divider, Empty, Spin, Tag, Table, Select } from "antd";
import { SearchOutlined, SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { verifyDiploma } from "../api/diplomas";
import "../styles/pages.css";

const { Title, Text } = Typography;

const searchTypes = [
    { value: "serialNo", label: "Số hiệu văn bằng" },
    { value: "studentId", label: "Mã sinh viên" },
    { value: "studentName", label: "Tên sinh viên" },
];

export function VerifyPage() {
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState("serialNo");
    const [results, setResults] = useState(null);

    const handleSearch = async (value) => {
        if (!value.trim()) return;
        setLoading(true);
        try {
            const res = await verifyDiploma({ [searchType]: value.trim() });
            setResults(res.ok ? res.data : []);
        } catch (e) {
            console.error("Verify error:", e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: "Số hiệu",
            dataIndex: "serialNo",
            render: (text) => <Text strong>{text}</Text>,
        },
        { title: "Mã SV", dataIndex: "studentId" },
        { title: "Tên SV", dataIndex: "studentName" },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (s) => {
                const color = s === "ISSUED" ? "success" : s === "REVOKED" ? "error" : "warning";
                return <Tag color={color}>{s}</Tag>;
            },
        },
        {
            title: "On-chain",
            dataIndex: "onchainStatus",
            render: (s) => (s ? <Tag color="blue">{s}</Tag> : <Tag>Chưa ghi</Tag>),
        },
        {
            title: "Xác thực",
            dataIndex: "match",
            render: (match) =>
                match ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">MATCH</Tag>
                ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error">MISMATCH</Tag>
                ),
        },
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon verify-icon">
                    <SafetyCertificateOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Tra cứu văn bằng</Title>
                    <Text type="secondary">
                        Xác thực văn bằng qua blockchain — hỗ trợ tra cứu theo số hiệu, mã SV, hoặc tên
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="search-card">
                <Space.Compact style={{ width: "100%" }}>
                    <Select
                        value={searchType}
                        onChange={setSearchType}
                        options={searchTypes}
                        style={{ width: 200 }}
                    />
                    <Input.Search
                        placeholder="Nhập từ khóa tra cứu..."
                        enterButton={
                            <Space>
                                <SearchOutlined />
                                <span>Tra cứu</span>
                            </Space>
                        }
                        onSearch={handleSearch}
                        loading={loading}
                        size="large"
                    />
                </Space.Compact>
            </Card>

            <div style={{ marginTop: 24 }}>
                {loading ? (
                    <Card>
                        <div style={{ textAlign: "center", padding: 40 }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 16 }}>
                                <Text type="secondary">Đang tra cứu thông tin...</Text>
                            </div>
                        </div>
                    </Card>
                ) : results === null ? (
                    <Card>
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">Nhập từ khóa để bắt đầu tra cứu</Text>}
                        />
                    </Card>
                ) : results.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: "center", padding: 40 }}>
                            <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />
                            <Title level={4} style={{ margin: "16px 0 8px" }}>Không tìm thấy kết quả</Title>
                            <Text type="secondary">Không có văn bằng nào khớp với từ khóa tra cứu.</Text>
                        </div>
                    </Card>
                ) : (
                    <Card title={`Kết quả tra cứu (${results.length})`}>
                        <Table
                            rowKey="serialNo"
                            columns={columns}
                            dataSource={results}
                            pagination={false}
                            size="middle"
                        />
                    </Card>
                )}
            </div>
        </div>
    );
}
