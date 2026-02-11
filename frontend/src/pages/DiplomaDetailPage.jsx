
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Tag, Button, Space, Typography, Row, Col, Spin, message, Divider, Descriptions, Table, Image, Modal, Upload, Alert, Input } from "antd";
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    DownloadOutlined,
    EditOutlined,
    StopOutlined,
    RocketOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import {
    getDiplomaById,
    downloadDiplomaFile,
    approveDiploma,
    rejectDiploma,
    issueDiploma,
    revokeDiploma,
    rejectIssueDiploma,
    resubmitDiploma,
    getApprovalLogs,
    getChainLogs
} from "../api/diplomas";

const { Title, Text } = Typography;

const STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    ISSUED: "ISSUED",
    REVOKED: "REVOKED",
};

const getStatusLabel = (status) => {
    switch (status) {
        case STATUS.ISSUED: return "Đã phát hành";
        case STATUS.REVOKED: return "Đã thu hồi";
        case STATUS.REJECTED: return "Bị từ chối";
        case STATUS.APPROVED: return "Đã duyệt";
        case STATUS.PENDING: return "Chờ duyệt";
        default: return status;
    }
};

export function DiplomaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [diploma, setDiploma] = useState(null);
    const [loading, setLoading] = useState(true);
    const [approvalLogs, setApprovalLogs] = useState([]);
    const [chainLogs, setChainLogs] = useState([]);
    const [fileUrls, setFileUrls] = useState({ PORTRAIT: null, DIPLOMA: null, TRANSCRIPT: null });
    const [walletModal, setWalletModal] = useState({ open: false, action: null });
    const [walletFile, setWalletFile] = useState(null);
    const [rejectIssueModal, setRejectIssueModal] = useState(false);
    const [rejectIssueReason, setRejectIssueReason] = useState("");

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role;

    useEffect(() => {
        if (!id) return;
        fetchDiploma();
        fetchFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchFiles = async () => {
        try {
            const types = ["PORTRAIT", "DIPLOMA", "TRANSCRIPT"];
            const newUrls = { ...fileUrls };

            await Promise.all(types.map(async (type) => {
                try {
                    const blob = await downloadDiplomaFile(id, type);
                    newUrls[type] = URL.createObjectURL(blob);
                } catch (e) {
                    console.error(`Failed to load ${type}`, e);
                }
            }));
            setFileUrls(newUrls);
        } catch (e) {
            console.error("Error fetching files", e);
        }
    };

    const fetchDiploma = async () => {
        setLoading(true);
        try {
            const res = await getDiplomaById(id);
            if (res && res.ok) {
                setDiploma(res.data);
            }
            // Fetch logs
            const aLogs = await getApprovalLogs(id);
            if (aLogs && aLogs.ok) {
                setApprovalLogs(aLogs.data || []);
            }

            const cLogs = await getChainLogs(id);
            if (cLogs && cLogs.ok) {
                setChainLogs(cLogs.data || []);
            }
        } catch (err) {
            console.error(err);
            message.error("Không thể tải thông tin văn bằng");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (kind, fileName) => {
        try {
            const blob = await downloadDiplomaFile(id, kind);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName || `${kind}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch {
            message.error("Lỗi khi tải file");
        }
    };

    const handleApprove = async () => {
        try {
            await approveDiploma(id, "");
            message.success("Đã duyệt hồ sơ");
            fetchDiploma();
        } catch {
            message.error("Lỗi khi duyệt");
        }
    };

    const handleReject = async () => {
        const reason = window.prompt("Nhập lý do từ chối (nếu có):");
        if (reason === null) return; // Cancelled

        try {
            await rejectDiploma(id, reason);
            message.success("Đã từ chối hồ sơ");
            fetchDiploma();
        } catch {
            message.error("Lỗi khi từ chối");
        }
    };

    const handleIssue = () => {
        setWalletFile(null);
        setWalletModal({ open: true, action: "issue" });
    };

    const handleRevoke = () => {
        setWalletFile(null);
        setWalletModal({ open: true, action: "revoke" });
    };

    const handleWalletSubmit = async () => {
        if (!walletFile) return;
        const { action } = walletModal;
        try {
            if (action === "issue") {
                await issueDiploma(id, walletFile);
                message.success("Đã cấp phát văn bằng on-chain");
            } else {
                await revokeDiploma(id, walletFile);
                message.success("Đã thu hồi văn bằng");
            }
            fetchDiploma();
        } catch (e) {
            message.error(e.response?.data?.message || `Lỗi khi ${action === "issue" ? "cấp phát" : "thu hồi"}`);
        } finally {
            setWalletModal({ open: false, action: null });
            setWalletFile(null);
        }
    };

    const handleRejectIssue = async () => {
        try {
            await rejectIssueDiploma(id, rejectIssueReason);
            message.success("Đã từ chối phát hành");
            setRejectIssueModal(false);
            setRejectIssueReason("");
            fetchDiploma();
        } catch (e) {
            message.error(e.response?.data?.message || "Lỗi khi từ chối phát hành");
        }
    };

    const handleResubmit = async () => {
        try {
            await resubmitDiploma(id);
            message.success("Đã gửi lại duyệt");
            fetchDiploma();
        } catch (e) {
            message.error(e.response?.data?.message || "Lỗi khi gửi lại");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case STATUS.ISSUED: return "success";
            case STATUS.REVOKED: return "error";
            case STATUS.REJECTED: return "magenta";
            case STATUS.APPROVED: return "processing";
            default: return "warning";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case STATUS.ISSUED: return <CheckCircleOutlined />;
            case STATUS.REVOKED: return <CloseCircleOutlined />;
            case STATUS.REJECTED: return <CloseCircleOutlined />;
            case STATUS.APPROVED: return <ExclamationCircleOutlined />;
            default: return <ClockCircleOutlined />;
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!diploma) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Title level={4}>Không tìm thấy văn bằng</Title>
                <Button type="primary" onClick={() => navigate("/diplomas")}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/diplomas")}
                    style={{ marginRight: 16 }}
                >
                    Quay lại
                </Button>
                <Title level={3} style={{ margin: 0 }}>Chi tiết văn bằng</Title>
            </div>

            <Card className="detail-card" bordered={false}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        <Descriptions title="Thông tin chung" bordered column={1}>
                            <Descriptions.Item label="Họ và tên">{diploma.student_name}</Descriptions.Item>
                            <Descriptions.Item label="Mã sinh viên">{diploma.student_id}</Descriptions.Item>
                            <Descriptions.Item label="Số hiệu văn bằng">
                                <Text strong>{diploma.serial_no}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày sinh">{diploma.birth_date}</Descriptions.Item>
                            <Descriptions.Item label="Ngành học">{diploma.major}</Descriptions.Item>
                            <Descriptions.Item label="Xếp loại">{diploma.ranking}</Descriptions.Item>
                            <Descriptions.Item label="GPA">{diploma.gpa}</Descriptions.Item>
                            <Descriptions.Item label="Năm tốt nghiệp">{diploma.graduation_year}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag icon={getStatusIcon(diploma.status)} color={getStatusColor(diploma.status)}>
                                    {getStatusLabel(diploma.status)}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card title="Tài liệu đính kèm" size="small" type="inner">
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <div className="file-preview-item">
                                    <Text strong>Ảnh chân dung</Text>
                                    {fileUrls.PORTRAIT ? (
                                        <div style={{ marginTop: 8, textAlign: 'center' }}>
                                            <Image
                                                width={150}
                                                src={fileUrls.PORTRAIT}
                                                placeholder={<Spin />}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ padding: 10, textAlign: 'center', background: '#f5f5f5' }}>
                                            <Spin /> Đang tải...
                                        </div>
                                    )}
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload("PORTRAIT", "Portrait.jpg")}
                                    >
                                        Tải ảnh
                                    </Button>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div className="file-preview-item">
                                    <Text strong>File văn bằng</Text>
                                    {fileUrls.DIPLOMA ? (
                                        <div style={{ marginTop: 8, textAlign: 'center' }}>
                                            <Image
                                                width={200}
                                                src={fileUrls.DIPLOMA}
                                                placeholder={<Spin />}
                                            />
                                        </div>
                                    ) : (
                                        <Text type="secondary" style={{ display: 'block', margin: '8px 0' }}>Đang tải...</Text>
                                    )}
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload("DIPLOMA", "Diploma.pdf")}
                                    >
                                        Tải file văn bằng
                                    </Button>
                                </div>

                                <Divider style={{ margin: '12px 0' }} />

                                <div className="file-preview-item">
                                    <Text strong>Bảng điểm</Text>
                                    {fileUrls.TRANSCRIPT ? (
                                        <div style={{ marginTop: 8, textAlign: 'center' }}>
                                            <Image
                                                width={200}
                                                src={fileUrls.TRANSCRIPT}
                                                placeholder={<Spin />}
                                            />
                                        </div>
                                    ) : (
                                        <Text type="secondary" style={{ display: 'block', margin: '8px 0' }}>Đang tải...</Text>
                                    )}
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload("TRANSCRIPT", "Transcript.pdf")}
                                    >
                                        Tải bảng điểm
                                    </Button>
                                </div>
                            </Space>
                        </Card>

                        {diploma.status === STATUS.ISSUED && (
                            <Card title="Thông tin Blockchain" size="small" type="inner" style={{ marginTop: 16 }}>
                                <Text type="secondary">Đã được phát hành trên mạng Blockchain.</Text>
                                <div style={{ marginTop: 8 }}>
                                    <Tag color="blue">Đã xác thực</Tag>
                                </div>
                            </Card>
                        )}
                    </Col>
                </Row>

                <Divider />

                {diploma.status === "REJECTED" && diploma.rejected_reason && (
                    <Alert
                        type="error"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message={`Bị từ chối bởi: ${diploma.rejected_role === "PRINCIPAL" ? "Hiệu trưởng" : "Quản lý"}`}
                        description={diploma.rejected_reason}
                    />
                )}

                <Row justify="end">
                    <Space>
                        {role === "STAFF" && diploma.status === STATUS.PENDING && (
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => navigate("/create", { state: { diplomaId: id } })}
                            >
                                Sửa hồ sơ
                            </Button>
                        )}

                        {role === "STAFF" && diploma.status === "REJECTED" && (
                            <>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => navigate("/create", { state: { diplomaId: id } })}
                                >
                                    Sửa hồ sơ
                                </Button>
                                <Button type="primary" onClick={handleResubmit}>
                                    Gửi lại duyệt
                                </Button>
                            </>
                        )}

                        {role === "MANAGER" && diploma.status === STATUS.PENDING && (
                            <>
                                <Button type="primary" onClick={handleApprove} icon={<CheckCircleOutlined />}>
                                    Duyệt
                                </Button>
                                <Button danger onClick={handleReject} icon={<CloseCircleOutlined />}>
                                    Từ chối
                                </Button>
                            </>
                        )}

                        {role === "ISSUER" && diploma.status === STATUS.APPROVED && (
                            <>
                                <Button type="primary" icon={<RocketOutlined />} onClick={handleIssue}>
                                    Phát hành
                                </Button>
                                <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectIssueModal(true)}>
                                    Từ chối phát hành
                                </Button>
                            </>
                        )}

                        {role === "ISSUER" && diploma.status === STATUS.ISSUED && (
                            <Button danger type="primary" onClick={handleRevoke} icon={<StopOutlined />}>
                                Thu hồi
                            </Button>
                        )}
                    </Space>
                </Row>
            </Card>

            {/* Logs Section */}
            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
                <Col span={24}>
                    <Card title="Lịch sử duyệt" size="small">
                        <Table
                            dataSource={approvalLogs}
                            rowKey="id"
                            pagination={false}
                            columns={[
                                { title: "Thời gian", dataIndex: "created_at", render: t => new Date(t).toLocaleString() },
                                { title: "Hành động", dataIndex: "action", render: t => <Tag color={t === 'APPROVE' ? 'green' : 'red'}>{t === 'APPROVE' ? 'Duyệt' : 'Từ chối'}</Tag> },
                                {
                                    title: "Người thực hiện", dataIndex: "actor_username", render: (text, record) => {
                                        const roleMap = { MANAGER: 'Quản lý', ISSUER: 'Hiệu trưởng', STAFF: 'Nhân viên', ADMIN: 'Quản trị' };
                                        const roleName = roleMap[record.actor_role] || record.actor_role;
                                        return text ? `${text} (${roleName})` : record.actor_id;
                                    }
                                },
                                { title: "Ghi chú", dataIndex: "note" }
                            ]}
                        />
                    </Card>
                </Col>
                <Col span={24}>
                    <Card title="Lịch sử Blockchain" size="small">
                        <Table
                            dataSource={chainLogs}
                            rowKey={(r, i) => i}
                            pagination={false}
                            columns={[
                                { title: "Thời gian", dataIndex: "created_at", render: t => new Date(t).toLocaleString() },
                                {
                                    title: "Hành động", dataIndex: "action", render: t => {
                                        const map = { ISSUE: 'Phát hành', REVOKE: 'Thu hồi' };
                                        return <Tag color="blue">{map[t] || t}</Tag>;
                                    }
                                },
                                { title: "Tx ID", dataIndex: "tx_id", ellipsis: true },
                                { title: "Record Hash", dataIndex: "record_hash", ellipsis: true },
                                {
                                    title: "Trạng thái on-chain", dataIndex: "onchain_status", render: t => {
                                        const map = { ISSUED: 'Đã phát hành', REVOKED: 'Đã thu hồi' };
                                        return map[t] || t;
                                    }
                                }
                            ]}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Modal upload wallet cho issue/revoke */}
            <Modal
                title={walletModal.action === "issue" ? "Phát hành — Upload Wallet" : "Thu hồi — Upload Wallet"}
                open={walletModal.open}
                onOk={handleWalletSubmit}
                onCancel={() => { setWalletModal({ open: false, action: null }); setWalletFile(null); }}
                okText={walletModal.action === "issue" ? "Phát hành" : "Thu hồi"}
                cancelText="Hủy"
                okButtonProps={{ disabled: !walletFile, danger: walletModal.action === "revoke" }}
            >
                <p>Chọn file <b>wallet.json</b> để ký giao dịch blockchain:</p>
                <Upload
                    accept=".json"
                    maxCount={1}
                    beforeUpload={(file) => { setWalletFile(file); return false; }}
                    onRemove={() => setWalletFile(null)}
                    fileList={walletFile ? [walletFile] : []}
                >
                    <Button icon={<UploadOutlined />}>Chọn wallet.json</Button>
                </Upload>
            </Modal>

            {/* Modal từ chối phát hành */}
            <Modal
                title="Từ chối phát hành"
                open={rejectIssueModal}
                onOk={handleRejectIssue}
                onCancel={() => { setRejectIssueModal(false); setRejectIssueReason(""); }}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <p>Nhập lý do từ chối phát hành:</p>
                <Input.TextArea
                    rows={3}
                    value={rejectIssueReason}
                    onChange={(e) => setRejectIssueReason(e.target.value)}
                    placeholder="Lý do từ chối..."
                />
            </Modal>
        </div>
    );
}
