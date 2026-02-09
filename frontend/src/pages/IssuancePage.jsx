import React, { useState, useEffect } from "react";
import { Card, Tabs, Table, Button, Tag, Typography, Divider, Space, Modal, Upload, message, Tooltip, Empty, Spin, Input } from "antd";
import {
    SendOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RocketOutlined,
    StopOutlined,
    EyeOutlined,
    KeyOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listDiplomas, issueDiploma, revokeDiploma, rejectIssueDiploma, createWallet } from "../api/diplomas";
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
    const [walletModal, setWalletModal] = useState({ open: false, action: null, record: null });
    const [walletFile, setWalletFile] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, record: null });
    const [rejectReason, setRejectReason] = useState("");
    const navigate = useNavigate();

    const fetchDiplomas = async () => {
        setLoading(true);
        try {
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

    // Mở modal chọn wallet trước khi issue/revoke
    const openWalletModal = (action, record) => {
        setWalletFile(null);
        setWalletModal({ open: true, action, record });
    };

    const closeWalletModal = () => {
        setWalletModal({ open: false, action: null, record: null });
        setWalletFile(null);
    };

    const handleWalletSubmit = async () => {
        if (!walletFile) return;
        const { action, record } = walletModal;
        try {
            setLoading(true);
            if (action === "issue") {
                const res = await issueDiploma(record.id, walletFile);
                if (res?.ok) message.success(`Đã phát hành văn bằng ${record.serial_no} lên blockchain`);
            } else {
                const res = await revokeDiploma(record.id, walletFile);
                if (res?.ok) message.warning(`Đã thu hồi văn bằng ${record.serial_no}`);
            }
            fetchDiplomas();
        } catch (error) {
            console.error(`${action} error:`, error);
            message.error(error.response?.data?.message || `Lỗi khi ${action === "issue" ? "phát hành" : "thu hồi"}`);
        } finally {
            setLoading(false);
            closeWalletModal();
        }
    };

    // Tải wallet.json từ server
    const handleCreateWallet = async () => {
        try {
            const blob = await createWallet();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "wallet.json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            message.success("Wallet đã được tải xuống!");
        } catch (e) {
            console.error("Create wallet error:", e);
            message.error("Lỗi tạo wallet");
        }
    };

    const handleRejectIssue = async () => {
        const { record } = rejectModal;
        if (!record) return;
        try {
            setLoading(true);
            await rejectIssueDiploma(record.id, rejectReason);
            message.success(`Đã từ chối phát hành văn bằng ${record.serial_no}`);
            fetchDiplomas();
        } catch (e) {
            console.error("Reject issue error:", e);
            message.error(e.response?.data?.message || "Lỗi khi từ chối phát hành");
        } finally {
            setLoading(false);
            setRejectModal({ open: false, record: null });
            setRejectReason("");
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
            width: 260,
            align: "center",
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/diplomas/${record.id}`)} />
                    </Tooltip>
                    <Button type="primary" icon={<RocketOutlined />} onClick={() => openWalletModal("issue", record)}>
                        Phát hành
                    </Button>
                    <Button danger icon={<CloseCircleOutlined />} onClick={() => { setRejectReason(""); setRejectModal({ open: true, record }); }}>
                        Từ chối
                    </Button>
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
            dataIndex: "last_tx_id",
            ellipsis: true,
            render: (text) => (
                text ? (
                    <Text code copyable={{ text }}>
                        {text.substring(0, 16)}...
                    </Text>
                ) : "—"
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
                    <Button danger icon={<StopOutlined />} onClick={() => openWalletModal("revoke", record)}>
                        Thu hồi
                    </Button>
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
                <Button icon={<KeyOutlined />} onClick={handleCreateWallet} style={{ marginLeft: "auto" }}>
                    Tạo Wallet
                </Button>
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

            {/* Modal upload wallet cho issue/revoke */}
            <Modal
                title={walletModal.action === "issue" ? "Phát hành — Upload Wallet" : "Thu hồi — Upload Wallet"}
                open={walletModal.open}
                onOk={handleWalletSubmit}
                onCancel={closeWalletModal}
                okText={walletModal.action === "issue" ? "Phát hành" : "Thu hồi"}
                cancelText="Hủy"
                okButtonProps={{ disabled: !walletFile, danger: walletModal.action === "revoke" }}
                confirmLoading={loading}
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
                open={rejectModal.open}
                onOk={handleRejectIssue}
                onCancel={() => { setRejectModal({ open: false, record: null }); setRejectReason(""); }}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                confirmLoading={loading}
            >
                <p>Nhập lý do từ chối phát hành văn bằng <b>{rejectModal.record?.serial_no}</b>:</p>
                <Input.TextArea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Lý do từ chối..."
                />
            </Modal>
        </div>
    );
}
