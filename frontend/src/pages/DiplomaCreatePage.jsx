import React, { useState } from "react";
import { Card, Form, Input, InputNumber, Select, Button, Space, Upload, Typography, Divider, Row, Col, message, Avatar } from "antd";
import { InboxOutlined, PlusCircleOutlined, SaveOutlined, CloseOutlined, UserOutlined, CameraOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { createDiploma } from "../api/diplomas";
import "../styles/pages.css";

const { Dragger } = Upload;
const { Title, Text } = Typography;

export function DiplomaCreatePage() {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [photoPreview, setPhotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // File states
    const [portraitFile, setPortraitFile] = useState(null);
    const [diplomaFile, setDiplomaFile] = useState(null);
    const [transcriptFile, setTranscriptFile] = useState(null);

    const handlePhotoChange = (info) => {
        if (info.file) {
            const file = info.file.originFileObj || info.file;
            setPortraitFile(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotoPreview(e.target.result);
            };
            if (file instanceof File) {
                reader.readAsDataURL(file);
            }
        }
    };

    const handleTranscriptChange = (info) => {
        if (info.file) {
            const file = info.file.originFileObj || info.file;
            setTranscriptFile(file);
        }
    };

    const handleDiplomaChange = (info) => {
        if (info.file) {
            const file = info.file.originFileObj || info.file;
            setDiplomaFile(file);
        }
    };

    const handleSubmit = async (values) => {
        // Validate files
        if (!portraitFile) {
            message.error("Vui lòng tải lên ảnh chân dung!");
            return;
        }
        if (!diplomaFile) {
            message.error("Vui lòng tải lên file PDF văn bằng!");
            return;
        }
        if (!transcriptFile) {
            message.error("Vui lòng tải lên bảng điểm!");
            return;
        }

        setLoading(true);
        try {
            const formData = {
                serialNo: values.serialNo,
                studentId: values.studentId,
                studentName: values.studentName,
                birthDate: values.birthDate || "",
                major: values.major || "",
                ranking: values.ranking || "",
                gpa: values.gpa ? String(values.gpa) : "",
                graduationYear: values.graduationYear || "",
            };

            const files = {
                portrait: portraitFile,
                diploma: diplomaFile,
                transcript: transcriptFile,
            };

            const result = await createDiploma(formData, files);

            if (result.ok) {
                message.success("Hồ sơ đã được tạo thành công!");
                form.resetFields();
                setPhotoPreview(null);
                setPortraitFile(null);
                setDiplomaFile(null);
                setTranscriptFile(null);
                navigate("/diplomas");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Tạo hồ sơ thất bại!";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate("/diplomas");
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-header-icon create-icon">
                    <PlusCircleOutlined />
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">Tạo hồ sơ văn bằng</Title>
                    <Text type="secondary">
                        Nhập thông tin để tạo hồ sơ văn bằng mới trong hệ thống
                    </Text>
                </div>
            </div>

            <Divider />

            <Card className="form-card">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    {/* Phần upload ảnh chân dung */}
                    <div className="photo-upload-section">
                        <div className="photo-preview-container">
                            {photoPreview ? (
                                <Avatar
                                    size={140}
                                    src={photoPreview}
                                    className="student-photo-preview"
                                />
                            ) : (
                                <Avatar
                                    size={140}
                                    icon={<UserOutlined />}
                                    className="student-photo-placeholder"
                                />
                            )}
                            <Form.Item name="photo" className="photo-upload-btn">
                                <Upload
                                    accept="image/*"
                                    maxCount={1}
                                    showUploadList={false}
                                    beforeUpload={() => false}
                                    onChange={handlePhotoChange}
                                >
                                    <Button icon={<CameraOutlined />} type="dashed">
                                        {photoPreview ? "Đổi ảnh" : "Tải ảnh lên"}
                                    </Button>
                                </Upload>
                            </Form.Item>
                        </div>
                        <div className="photo-upload-hint">
                            <Text type="secondary">
                                Ảnh chân dung 3x4 của sinh viên (bắt buộc)
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Định dạng: JPG, PNG. Tối đa 5MB
                            </Text>
                        </div>
                    </div>

                    <Divider />

                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Số hiệu văn bằng"
                                name="serialNo"
                                rules={[
                                    { required: true, message: "Vui lòng nhập số hiệu văn bằng" },
                                    { pattern: /^[A-Z]{2}\d{4}-\d{3}$/, message: "Định dạng: XX0000-000" },
                                ]}
                            >
                                <Input placeholder="VD: TN2025-001" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Mã sinh viên"
                                name="studentId"
                                rules={[{ required: true, message: "Vui lòng nhập mã sinh viên" }]}
                            >
                                <Input placeholder="VD: 20210001" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Họ và tên sinh viên"
                                name="studentName"
                                rules={[{ required: true, message: "Vui lòng nhập họ tên sinh viên" }]}
                            >
                                <Input placeholder="Nhập họ và tên đầy đủ" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Ngày sinh"
                                name="birthDate"
                            >
                                <Input placeholder="YYYY-MM-DD" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Chuyên ngành"
                                name="major"
                                rules={[{ required: true, message: "Vui lòng nhập chuyên ngành" }]}
                            >
                                <Input placeholder="VD: Công nghệ thông tin" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                label="Xếp loại tốt nghiệp"
                                name="ranking"
                                initialValue="Khá"
                            >
                                <Select
                                    options={[
                                        { value: "Xuất sắc", label: "Xuất sắc" },
                                        { value: "Giỏi", label: "Giỏi" },
                                        { value: "Khá", label: "Khá" },
                                        { value: "Trung bình", label: "Trung bình" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={6}>
                            <Form.Item
                                label="Năm tốt nghiệp"
                                name="graduationYear"
                                initialValue="2025"
                            >
                                <Select
                                    options={[
                                        { value: "2025", label: "2025" },
                                        { value: "2024", label: "2024" },
                                        { value: "2023", label: "2023" },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={24}>
                        <Col xs={24} md={6}>
                            <Form.Item
                                label="GPA"
                                name="gpa"
                            >
                                <InputNumber
                                    placeholder="Ví dụ: 3.25"
                                    min={0}
                                    max={4}
                                    precision={2}
                                    style={{ width: "100%" }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Bảng điểm (ảnh/PDF) - bắt buộc"
                        name="transcript"
                        extra={transcriptFile ? `Đã chọn: ${transcriptFile.name}` : null}
                    >
                        <Dragger
                            accept=".pdf,image/*"
                            maxCount={1}
                            beforeUpload={() => false}
                            onChange={handleTranscriptChange}
                            className="upload-dragger"
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ color: "#1890ff" }} />
                            </p>
                            <p className="ant-upload-text">
                                Kéo thả hoặc bấm để chọn file
                            </p>
                            <p className="ant-upload-hint">
                                Chấp nhận PDF/JPG/PNG. Tối đa 5MB.
                            </p>
                        </Dragger>
                    </Form.Item>

                    <Form.Item
                        label="Tải lên file PDF văn bằng - bắt buộc"
                        extra={diplomaFile ? `Đã chọn: ${diplomaFile.name}` : null}
                    >
                        <Dragger
                            beforeUpload={() => false}
                            maxCount={1}
                            accept=".pdf"
                            onChange={handleDiplomaChange}
                            className="upload-dragger"
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ color: "#1890ff" }} />
                            </p>
                            <p className="ant-upload-text">
                                Kéo thả file PDF vào đây hoặc click để chọn file
                            </p>
                            <p className="ant-upload-hint">
                                Hỗ trợ định dạng PDF. Kích thước tối đa 5MB
                            </p>
                        </Dragger>
                    </Form.Item>

                    <Divider />

                    <div className="form-actions">
                        <Button
                            icon={<CloseOutlined />}
                            onClick={handleCancel}
                            size="large"
                            disabled={loading}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            size="large"
                            loading={loading}
                        >
                            Lưu hồ sơ
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
