import React, { useState } from "react";
import {
    Card, Input, Typography, Space, Divider, Empty, Spin, Tag, Table, Select,
    Drawer, Descriptions, Button, message, Alert, Row, Col, Image,
} from "antd";
import {
    SearchOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
    CloseCircleOutlined, LinkOutlined, InfoCircleOutlined, DownloadOutlined,
    FileTextOutlined, FilePdfOutlined, UserOutlined,
} from "@ant-design/icons";
import { searchDiplomas, verifyOnChain, downloadPublicDiplomaFile } from "../api/public";
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

    // File URLs (ảnh/tài liệu)
    const [fileUrls, setFileUrls] = useState({ PORTRAIT: null, DIPLOMA: null, TRANSCRIPT: null });
    const [loadingFiles, setLoadingFiles] = useState(false);

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
    const openDetail = async (record) => {
        setSelected(record);
        setVerifyData(null); // reset verify cũ
        setDrawerOpen(true);
        
        // Tải file ảnh/tài liệu
        await fetchFiles(record.id);
    };

    // ─── Tải file ảnh/tài liệu ───
    const fetchFiles = async (diplomaId) => {
        setLoadingFiles(true);
        try {
            const types = ["PORTRAIT", "DIPLOMA", "TRANSCRIPT"];
            const newUrls = {};

            await Promise.all(types.map(async (type) => {
                try {
                    const blob = await downloadPublicDiplomaFile(diplomaId, type);
                    newUrls[type] = URL.createObjectURL(blob);
                } catch (e) {
                    console.error(`Failed to load ${type}`, e);
                    newUrls[type] = null;
                }
            }));
            
            setFileUrls(newUrls);
        } catch (e) {
            console.error("Error fetching files", e);
        } finally {
            setLoadingFiles(false);
        }
    };

    // ─── Tải xuống file ───
    const handleDownloadFile = async (kind, fileName) => {
        if (!selected) return;
        try {
            const blob = await downloadPublicDiplomaFile(selected.id, kind);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName || `${kind}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            message.error("Lỗi khi tải file");
        }
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
        { 
            title: "Số hiệu", 
            dataIndex: "serialNo", 
            render: (t) => <Text strong copyable>{t}</Text>,
            width: 150,
        },
        { 
            title: "Mã SV", 
            dataIndex: "studentId",
            width: 120,
        },
        { 
            title: "Tên SV", 
            dataIndex: "studentName",
            ellipsis: true,
        },
        { 
            title: "Ngành", 
            dataIndex: "major", 
            ellipsis: true,
        },
        { 
            title: "Năm TN", 
            dataIndex: "graduationYear",
            width: 90,
            align: 'center',
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 120,
            align: 'center',
            render: (s) => {
                const config = {
                    ISSUED: { color: "success", icon: <CheckCircleOutlined />, text: "Đã phát hành" },
                    REVOKED: { color: "error", icon: <CloseCircleOutlined />, text: "Đã thu hồi" },
                    APPROVED: { color: "processing", icon: <CheckCircleOutlined />, text: "Đã duyệt" },
                    PENDING: { color: "warning", icon: <InfoCircleOutlined />, text: "Chờ duyệt" },
                };
                const { color, icon, text } = config[s] || config.PENDING;
                return <Tag color={color} icon={icon}>{text}</Tag>;
            },
        },
        {
            title: "",
            width: 100,
            align: 'center',
            render: (_, row) => (
                <Button type="link" size="small" onClick={() => openDetail(row)} icon={<SearchOutlined />}>
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
                title={
                    <Space>
                        <SafetyCertificateOutlined />
                        <span>Chi tiết văn bằng</span>
                    </Space>
                }
                width="90%"
                style={{ maxWidth: 1200 }}
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    // Cleanup URLs để tránh memory leak
                    Object.values(fileUrls).forEach(url => {
                        if (url) URL.revokeObjectURL(url);
                    });
                    setFileUrls({ PORTRAIT: null, DIPLOMA: null, TRANSCRIPT: null });
                }}
            >
                {selected && (
                    <>
                        {/* ─── Phần 1: Thông tin + Ảnh/Tài liệu ─── */}
                        <Row gutter={[16, 16]}>
                            {/* Cột trái: Ảnh chân dung */}
                            <Col xs={24} sm={8}>
                                <Card 
                                    size="small" 
                                    title={
                                        <Space>
                                            <UserOutlined />
                                            <span>Ảnh chân dung</span>
                                        </Space>
                                    }
                                    style={{ height: '100%' }}
                                >
                                    {loadingFiles ? (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <Spin />
                                        </div>
                                    ) : fileUrls.PORTRAIT ? (
                                        <div style={{ textAlign: 'center' }}>
                                            <Image
                                                width="100%"
                                                src={fileUrls.PORTRAIT}
                                                placeholder={<Spin />}
                                                style={{ borderRadius: 4 }}
                                            />
                                            <Button
                                                type="link"
                                                size="small"
                                                icon={<DownloadOutlined />}
                                                onClick={() => handleDownloadFile("PORTRAIT", "Portrait.jpg")}
                                                style={{ marginTop: 8 }}
                                            >
                                                Tải xuống
                                            </Button>
                                        </div>
                                    ) : (
                                        <Empty 
                                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                            description="Không có ảnh"
                                            style={{ padding: '20px 0' }}
                                        />
                                    )}
                                </Card>
                            </Col>

                            {/* Cột phải: Thông tin chi tiết */}
                            <Col xs={24} sm={16}>
                                <Descriptions 
                                    title="Thông tin văn bằng" 
                                    bordered 
                                    column={1} 
                                    size="small"
                                >
                                    <Descriptions.Item label="Số hiệu">
                                        <Text strong>{selected.serialNo}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mã sinh viên">{selected.studentId}</Descriptions.Item>
                                    <Descriptions.Item label="Họ và tên">{selected.studentName}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày sinh">
                                        {selected.birthDate ? new Date(selected.birthDate).toLocaleDateString('vi-VN') : "—"}
                                    </Descriptions.Item>
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
                            </Col>
                        </Row>

                        {/* ─── Phần 2: Văn bằng và Bảng điểm ─── */}
                        <Divider orientation="left">Tài liệu văn bằng</Divider>
                        
                        <Row gutter={[16, 24]}>
                            {/* Văn bằng tốt nghiệp */}
                            <Col xs={24} lg={12}>
                                <Card
                                    size="small"
                                    title={
                                        <Space>
                                            <FilePdfOutlined style={{ color: '#ff4d4f' }} />
                                            <Text strong>Văn bằng tốt nghiệp</Text>
                                        </Space>
                                    }
                                    bordered
                                >
                                    {loadingFiles ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                            <Spin />
                                        </div>
                                    ) : fileUrls.DIPLOMA ? (
                                        <div>
                                            <Image.PreviewGroup>
                                                <Image
                                                    width="100%"
                                                    src={fileUrls.DIPLOMA}
                                                    placeholder={<Spin />}
                                                    style={{ borderRadius: 4, border: '1px solid #f0f0f0' }}
                                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                                                />
                                            </Image.PreviewGroup>
                                            <div style={{ textAlign: 'center', marginTop: 12 }}>
                                                <Space>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<LinkOutlined />}
                                                        onClick={() => window.open(fileUrls.DIPLOMA, '_blank')}
                                                    >
                                                        Toàn màn hình
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        icon={<DownloadOutlined />}
                                                        onClick={() => handleDownloadFile("DIPLOMA", "Diploma.pdf")}
                                                    >
                                                        Tải xuống
                                                    </Button>
                                                </Space>
                                            </div>
                                        </div>
                                    ) : (
                                        <Empty 
                                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                            description="Không có văn bằng"
                                            style={{ padding: '40px 0' }}
                                        />
                                    )}
                                </Card>
                            </Col>

                            {/* Bảng điểm */}
                            <Col xs={24} lg={12}>
                                <Card
                                    size="small"
                                    title={
                                        <Space>
                                            <FileTextOutlined style={{ color: '#1890ff' }} />
                                            <Text strong>Bảng điểm</Text>
                                        </Space>
                                    }
                                    bordered
                                >
                                    {loadingFiles ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                            <Spin />
                                        </div>
                                    ) : fileUrls.TRANSCRIPT ? (
                                        <div>
                                            <Image.PreviewGroup>
                                                <Image
                                                    width="100%"
                                                    src={fileUrls.TRANSCRIPT}
                                                    placeholder={<Spin />}
                                                    style={{ borderRadius: 4, border: '1px solid #f0f0f0' }}
                                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                                                />
                                            </Image.PreviewGroup>
                                            <div style={{ textAlign: 'center', marginTop: 12 }}>
                                                <Space>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<LinkOutlined />}
                                                        onClick={() => window.open(fileUrls.TRANSCRIPT, '_blank')}
                                                    >
                                                        Toàn màn hình
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        icon={<DownloadOutlined />}
                                                        onClick={() => handleDownloadFile("TRANSCRIPT", "Transcript.pdf")}
                                                    >
                                                        Tải xuống
                                                    </Button>
                                                </Space>
                                            </div>
                                        </div>
                                    ) : (
                                        <Empty 
                                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                            description="Không có bảng điểm"
                                            style={{ padding: '40px 0' }}
                                        />
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        {/* Nút xác thực */}
                        <Space style={{ marginBottom: 16 }}>
                            <Button
                                type="primary"
                                icon={<SafetyCertificateOutlined />}
                                onClick={handleVerify}
                                loading={verifying}
                                size="large"
                            >
                                Xác thực trên blockchain
                            </Button>
                        </Space>

                        {/* Kết quả xác thực */}
                        {verifying && (
                            <div style={{ textAlign: "center", marginTop: 24 }}>
                                <Spin tip="Đang truy vấn blockchain..." />
                            </div>
                        )}

                        {verifyData && !verifying && (
                            <div style={{ marginTop: 16 }}>
                                {/* Tag MATCH / MISMATCH / NOT_FOUND */}
                                <Card 
                                    size="small" 
                                    style={{ 
                                        textAlign: "center", 
                                        marginBottom: 16,
                                        background: !verifyData.onchain.exists ? '#fafafa' : verifyData.match ? '#f6ffed' : '#fff2e8',
                                        borderColor: !verifyData.onchain.exists ? '#d9d9d9' : verifyData.match ? '#b7eb8f' : '#ffbb96'
                                    }}
                                >
                                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                                        {renderMatchTag()}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {!verifyData.onchain.exists 
                                            ? "Văn bằng chưa được phát hành lên blockchain"
                                            : verifyData.match 
                                            ? "Dữ liệu khớp với blockchain - Văn bằng hợp lệ"
                                            : "Dữ liệu không khớp - Có thể bị giả mạo"}
                                    </Text>
                                </Card>

                                {!verifyData.onchain.exists ? (
                                    <Alert
                                        type="warning"
                                        showIcon
                                        message="Chưa ghi trên blockchain"
                                        description="Văn bằng này chưa được phát hành lên blockchain. Không có dữ liệu on-chain để xác thực."
                                    />
                                ) : (
                                    <>
                                        <Descriptions 
                                            column={1} 
                                            bordered 
                                            size="small" 
                                            title="Dữ liệu trên blockchain"
                                            style={{ marginTop: 16 }}
                                        >
                                            <Descriptions.Item label="Trạng thái">
                                                <Tag color={verifyData.onchain.status === "ISSUED" ? "success" : "error"}>
                                                    {verifyData.onchain.status}
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Số hiệu">{verifyData.onchain.serialNo || "—"}</Descriptions.Item>
                                            <Descriptions.Item label="Mã sinh viên">{verifyData.onchain.studentId || "—"}</Descriptions.Item>
                                            <Descriptions.Item label="Họ và tên">{verifyData.onchain.studentName || "—"}</Descriptions.Item>
                                            <Descriptions.Item label="Ngày sinh">
                                                {verifyData.onchain.birthDate 
                                                    ? new Date(verifyData.onchain.birthDate).toLocaleDateString('vi-VN')
                                                    : "—"}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Ngành">{verifyData.onchain.major || "—"}</Descriptions.Item>
                                            <Descriptions.Item label="Xếp loại">{verifyData.onchain.ranking || "—"}</Descriptions.Item>
                                            <Descriptions.Item label="GPA">{verifyData.onchain.gpa || "—"}</Descriptions.Item>
                                            <Descriptions.Item label="Năm tốt nghiệp">{verifyData.onchain.graduationYear || "—"}</Descriptions.Item>
                                        </Descriptions>

                                        <Divider orientation="left" style={{ fontSize: 12 }}>Thông tin kỹ thuật</Divider>
                                        
                                        <Descriptions column={1} bordered size="small">
                                            <Descriptions.Item label="RecordHash (On-chain)">
                                                <Text code copyable={{ text: verifyData.onchain.recordHash }} style={{ fontSize: 10, wordBreak: "break-all" }}>
                                                    {verifyData.onchain.recordHash}
                                                </Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="RecordHash (Computed)">
                                                <Text code copyable={{ text: verifyData.computedRecordHash }} style={{ fontSize: 10, wordBreak: "break-all" }}>
                                                    {verifyData.computedRecordHash || "—"}
                                                </Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Thời gian phát hành">
                                                {verifyData.onchain.issuedAt
                                                    ? new Date(verifyData.onchain.issuedAt).toLocaleString('vi-VN')
                                                    : "—"}
                                            </Descriptions.Item>
                                            {verifyData.onchain.revokedAt && (
                                                <Descriptions.Item label="Thời gian thu hồi">
                                                    {new Date(verifyData.onchain.revokedAt).toLocaleString('vi-VN')}
                                                </Descriptions.Item>
                                            )}
                                            <Descriptions.Item label="Transaction ID">
                                                <Text code copyable={{ text: verifyData.onchain.txId }} style={{ fontSize: 10, wordBreak: "break-all" }}>
                                                    {verifyData.onchain.txId || "—"}
                                                </Text>
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </>
                                )}

                                {/* Off-chain status khác on-chain → cảnh báo */}
                                {verifyData.onchain.exists && verifyData.offchainStatus !== verifyData.onchain.status && (
                                    <Alert
                                        style={{ marginTop: 16 }}
                                        type="warning"
                                        showIcon
                                        message="Trạng thái không đồng bộ"
                                        description={`Trạng thái off-chain (${verifyData.offchainStatus}) khác với on-chain (${verifyData.onchain.status})`}
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
