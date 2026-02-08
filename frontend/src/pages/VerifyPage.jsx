import React, { useState } from "react";
import {
    Card, Input, Typography, Space, Divider, Empty, Spin, Tag, Table, Select,
    Drawer, Descriptions, Button, message, Alert,
} from "antd";
import {
    SearchOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
    CloseCircleOutlined, LinkOutlined, InfoCircleOutlined,
} from "@ant-design/icons";
import { searchDiplomas, verifyOnChain } from "../api/public";
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
    const [results, setResults] = useState(null); // null = chưa search, [] = không có

    // Drawer chi tiết
    const [selected, setSelected] = useState(null); // row đang xem
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Kết quả verify on-chain
    const [verifying, setVerifying] = useState(false);
    const [verifyData, setVerifyData] = useState(null); // null = chưa verify

    // ─── Search off-chain ───
    const handleSearch = async (value) => {
        if (!value.trim()) return;
        setLoading(true);
        try {
            const res = await searchDiplomas(searchType, value.trim());
            setResults(res.ok ? res.results : []);
        } catch (e) {
            console.error(e);
            message.error("Lỗi khi tra cứu");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Mở drawer khi click 1 row ───
    const openDetail = (record) => {
        setSelected(record);
        setVerifyData(null); // reset verify cũ
        setDrawerOpen(true);
    };

    // ─── Gọi blockchain verify ───
    const handleVerify = async () => {
        if (!selected) return;
        setVerifying(true);
        try {
            const res = await verifyOnChain(selected.serialNo);
            if (res.ok) {
                setVerifyData(res);
            } else {
                message.error(res.message || "Lỗi xác thực");
            }
        } catch (e) {
            console.error(e);
            message.error("Không thể kết nối blockchain");
        } finally {
            setVerifying(false);
        }
    };

    // ─── Cột bảng ───
    const columns = [
        { title: "Số hiệu", dataIndex: "serialNo", render: (t) => <Text strong>{t}</Text> },
        { title: "Mã SV", dataIndex: "studentId" },
        { title: "Tên SV", dataIndex: "studentName" },
        { title: "Ngành", dataIndex: "major", ellipsis: true },
        { title: "Năm TN", dataIndex: "graduationYear" },
        {
            title: "Trạng thái",
            dataIndex: "status",
            render: (s) => {
                const color = s === "ISSUED" ? "success" : s === "REVOKED" ? "error" : s === "APPROVED" ? "processing" : "warning";
                return <Tag color={color}>{s}</Tag>;
            },
        },
        {
            title: "",
            width: 100,
            render: (_, row) => (
                <Button type="link" size="small" onClick={() => openDetail(row)}>
                    Chi tiết
                </Button>
            ),
        },
    ];

    // ─── Render match tag ───
    const renderMatchTag = () => {
        if (!verifyData) return null;
        if (!verifyData.onchain.exists) {
            return <Tag icon={<InfoCircleOutlined />} color="default">NOT_FOUND_ONCHAIN</Tag>;
        }
        return verifyData.match
            ? <Tag icon={<CheckCircleOutlined />} color="success">MATCH</Tag>
            : <Tag icon={<CloseCircleOutlined />} color="error">MISMATCH</Tag>;
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
                        Tra cứu và xác thực văn bằng qua blockchain
                    </Text>
                </div>
            </div>

            <Divider />

            {/* ── Thanh tra cứu ── */}
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
                        enterButton={<Space><SearchOutlined /><span>Tra cứu</span></Space>}
                        onSearch={handleSearch}
                        loading={loading}
                        size="large"
                    />
                </Space.Compact>
            </Card>

            {/* ── Bảng kết quả ── */}
            <div style={{ marginTop: 24 }}>
                {loading ? (
                    <Card>
                        <div style={{ textAlign: "center", padding: 40 }}>
                            <Spin size="large" />
                            <div style={{ marginTop: 16 }}><Text type="secondary">Đang tra cứu...</Text></div>
                        </div>
                    </Card>
                ) : results === null ? (
                    <Card>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={<Text type="secondary">Nhập từ khóa để bắt đầu tra cứu</Text>} />
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
                            onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: "pointer" } })}
                        />
                    </Card>
                )}
            </div>

            {/* ── Drawer chi tiết + xác thực ── */}
            <Drawer
                title="Chi tiết văn bằng"
                width={560}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                {selected && (
                    <>
                        {/* Thông tin off-chain */}
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Số hiệu">{selected.serialNo}</Descriptions.Item>
                            <Descriptions.Item label="Mã sinh viên">{selected.studentId}</Descriptions.Item>
                            <Descriptions.Item label="Họ và tên">{selected.studentName}</Descriptions.Item>
                            <Descriptions.Item label="Ngày sinh">{selected.birthDate || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Ngành">{selected.major || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Xếp loại">{selected.ranking || "—"}</Descriptions.Item>
                            <Descriptions.Item label="GPA">{selected.gpa || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Năm tốt nghiệp">{selected.graduationYear || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selected.status === "ISSUED" ? "success" : selected.status === "REVOKED" ? "error" : "warning"}>
                                    {selected.status}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        {/* Nút xác thực */}
                        <Space>
                            <Button
                                type="primary"
                                icon={<SafetyCertificateOutlined />}
                                onClick={handleVerify}
                                loading={verifying}
                            >
                                Xác thực trên blockchain
                            </Button>
                            <Button
                                icon={<LinkOutlined />}
                                disabled={!verifyData}
                                onClick={() => {/* scroll xuống — dữ liệu đã hiện bên dưới */}}
                            >
                                Xem dữ liệu trên blockchain
                            </Button>
                        </Space>

                        {/* Kết quả xác thực */}
                        {verifying && (
                            <div style={{ textAlign: "center", marginTop: 24 }}>
                                <Spin tip="Đang truy vấn blockchain..." />
                            </div>
                        )}

                        {verifyData && !verifying && (
                            <div style={{ marginTop: 24 }}>
                                {/* Tag MATCH / MISMATCH / NOT_FOUND */}
                                <div style={{ textAlign: "center", marginBottom: 16 }}>
                                    <span style={{ fontSize: 18 }}>{renderMatchTag()}</span>
                                </div>

                                {!verifyData.onchain.exists ? (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        message="Chưa ghi trên blockchain"
                                        description="Văn bằng này chưa được phát hành lên blockchain. Không có dữ liệu on-chain."
                                    />
                                ) : (
                                    <Descriptions column={1} bordered size="small" title="Dữ liệu trên blockchain">
                                        <Descriptions.Item label="On-chain Status">
                                            <Tag color={verifyData.onchain.status === "ISSUED" ? "success" : "error"}>
                                                {verifyData.onchain.status}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="On-chain RecordHash">
                                            <Text code copyable style={{ fontSize: 11, wordBreak: "break-all" }}>
                                                {verifyData.onchain.recordHash}
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Computed RecordHash">
                                            <Text code copyable style={{ fontSize: 11, wordBreak: "break-all" }}>
                                                {verifyData.computedRecordHash}
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Issued At">
                                            {verifyData.onchain.issuedAt
                                                ? new Date(verifyData.onchain.issuedAt).toLocaleString()
                                                : "—"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Revoked At">
                                            {verifyData.onchain.revokedAt
                                                ? new Date(verifyData.onchain.revokedAt).toLocaleString()
                                                : "—"}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Tx ID">
                                            <Text code copyable style={{ fontSize: 11, wordBreak: "break-all" }}>
                                                {verifyData.onchain.txId || "—"}
                                            </Text>
                                        </Descriptions.Item>
                                    </Descriptions>
                                )}

                                {/* Off-chain status khác on-chain → cảnh báo */}
                                {verifyData.onchain.exists && verifyData.offchainStatus !== verifyData.onchain.status && (
                                    <Alert
                                        style={{ marginTop: 12 }}
                                        type="warning"
                                        showIcon
                                        message="Trạng thái off-chain và on-chain không đồng bộ"
                                        description={`Off-chain: ${verifyData.offchainStatus} — On-chain: ${verifyData.onchain.status}`}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </Drawer>
        </div>
    );
}
