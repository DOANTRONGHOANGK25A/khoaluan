import React, { useState, useEffect } from "react";
import { Card, Form, Input, InputNumber, Select, Button, Space, Upload, Typography, Divider, Row, Col, message, Avatar, Spin, Image, DatePicker } from "antd";
import dayjs from "dayjs";
import { InboxOutlined, PlusCircleOutlined, SaveOutlined, CloseOutlined, UserOutlined, CameraOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { createDiploma, getDiplomaById, updateDiploma, downloadDiplomaFile } from "../api/diplomas";
import "../styles/pages.css";

const { Dragger } = Upload;
const { Title, Text } = Typography;

export function DiplomaCreatePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();
    const [photoPreview, setPhotoPreview] = useState(null);
    const [diplomaPreview, setDiplomaPreview] = useState(null);
    const [transcriptPreview, setTranscriptPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Edit mode state
    const diplomaId = location.state?.diplomaId;
    const isEditMode = !!diplomaId;

    // File states
    const [portraitFile, setPortraitFile] = useState(null);
    const [diplomaFile, setDiplomaFile] = useState(null);
    const [transcriptFile, setTranscriptFile] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            fetchDiplomaData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [diplomaId]);

    const fetchDiplomaData = async () => {
        setFetching(true);
        try {
            const res = await getDiplomaById(diplomaId);
            if (res && res.ok) {
                const data = res.data;
                form.setFieldsValue({
                    serialNo: data.serial_no,
                    studentId: data.student_id,
                    studentName: data.student_name,
                    birthDate: data.birth_date ? dayjs(data.birth_date, "YYYY-MM-DD") : null,
                    major: data.major,
                    ranking: data.ranking,
                    gpa: data.gpa,
                    graduationYear: data.graduation_year
                });

                // Load previews for all files
                try {
                    const portraitBlob = await downloadDiplomaFile(diplomaId, "PORTRAIT");
                    setPhotoPreview(URL.createObjectURL(portraitBlob));
                } catch (e) {
                    console.error("Could not load portrait preview", e);
                }

                try {
                    const diplomaBlob = await downloadDiplomaFile(diplomaId, "DIPLOMA");
                    setDiplomaPreview(URL.createObjectURL(diplomaBlob));
                } catch (e) {
                    console.error("Could not load diploma preview", e);
                }

                try {
                    const transcriptBlob = await downloadDiplomaFile(diplomaId, "TRANSCRIPT");
                    setTranscriptPreview(URL.createObjectURL(transcriptBlob));
                } catch (e) {
                    console.error("Could not load transcript preview", e);
                }

            } else {
                message.error("Không tìm thấy dữ liệu văn bằng");
                navigate("/diplomas");
            }
        } catch (error) {
            message.error("Lỗi khi tải dữ liệu");
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

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
        const file = info.file.originFileObj || info.file;
        if (file) {
            setTranscriptFile(file);
            // Update preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setTranscriptPreview(e.target.result);
            };
            if (file instanceof File) {
                reader.readAsDataURL(file);
            }
        }
    };

    const handleDiplomaChange = (info) => {
        const file = info.file.originFileObj || info.file;
        if (file) {
            setDiplomaFile(file);
            // Update preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setDiplomaPreview(e.target.result);
            };
            if (file instanceof File) {
                reader.readAsDataURL(file);
            }
        }
    };

    // ... (rest of handleSubmit logic unchaged) ...

    const handleSubmit = async (values) => {
        // Validate files only if creating
        if (!isEditMode) {
            if (!portraitFile) {
                message.error("Vui lòng tải lên ảnh chân dung!");
                return;
            }
            if (!diplomaFile) {
                message.error("Vui lòng tải lên file văn bằng!");
                return;
            }
            if (!transcriptFile) {
                message.error("Vui lòng tải lên bảng điểm!");
                return;
            }
        }

        setLoading(true);
        try {
            let result;
            if (isEditMode) {
                // Update mode using FormData
                const fd = new FormData();
                fd.append("serialNo", values.serialNo);
                fd.append("studentId", values.studentId);
                fd.append("studentName", values.studentName);
                fd.append("birthDate", values.birthDate ? values.birthDate.format("YYYY-MM-DD") : "");
                fd.append("major", values.major || "");
                fd.append("ranking", values.ranking || "");
                fd.append("gpa", values.gpa ? String(values.gpa) : "");
                fd.append("graduationYear", values.graduationYear || "");

                // Append files only if selected (new files)
                if (portraitFile) fd.append("portrait", portraitFile);
                if (diplomaFile) fd.append("diploma", diplomaFile);
                if (transcriptFile) fd.append("transcript", transcriptFile);

                result = await updateDiploma(diplomaId, fd);
                if (result.ok) {
                    message.success("Cập nhật hồ sơ thành công!");
                }
            } else {
                // Create mode
                const formData = {
                    serialNo: values.serialNo,
                    studentId: values.studentId,
                    studentName: values.studentName,
                    birthDate: values.birthDate ? values.birthDate.format("YYYY-MM-DD") : "",
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
                result = await createDiploma(formData, files);
                if (result.ok) {
                    message.success("Hồ sơ đã được tạo thành công!");
                }
            }

            if (result.ok) {
                form.resetFields();
                setPhotoPreview(null);
                setDiplomaPreview(null);
                setTranscriptPreview(null);
                setPortraitFile(null);
                setDiplomaFile(null);
                setTranscriptFile(null);
                navigate(isEditMode ? `/diplomas/${diplomaId}` : "/diplomas");
            }
        } catch (err) {
            const msg = err.response?.data?.message || (isEditMode ? "Cập nhật thất bại!" : "Tạo hồ sơ thất bại!");
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (isEditMode) {
            navigate(`/diplomas/${diplomaId}`);
        } else {
            navigate("/diplomas");
        }
    };

    if (fetching) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* ... Header ... */}
            <div className="page-header">
                <div className="page-header-icon create-icon">
                    {isEditMode ? <EditOutlined /> : <PlusCircleOutlined />}
                </div>
                <div className="page-header-content">
                    <Title level={3} className="page-title">{isEditMode ? "Cập nhật hồ sơ văn bằng" : "Tạo hồ sơ văn bằng"}</Title>
                    <Text type="secondary">
                        {isEditMode ? "Chỉnh sửa thông tin hồ sơ văn bằng" : "Nhập thông tin để tạo hồ sơ văn bằng mới trong hệ thống"}
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
                            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                Định dạng: JPG, PNG. Tối đa 5MB
                            </Text>
                            {isEditMode && (
                                <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                    * Nếu không chọn file mới thì giữ file cũ
                                </Text>
                            )}
                        </div>
                    </div>

                    <Divider />

                    {/* ... Form fields ... */}
                    {/* (Use existing form fields here, assume they are unchanged) */}

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
                                rules={[
                                    { required: true, message: "Vui lòng chọn ngày sinh" },
                                ]}
                            >
                                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" placeholder="Chọn ngày sinh" inputReadOnly />
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
                                rules={[{ required: true, message: "Vui lòng chọn năm tốt nghiệp" }]}
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
                                rules={[
                                    { required: true, message: "Vui lòng nhập GPA" },
                                    {
                                        validator: (_, value) => {
                                            if (value !== undefined && value !== null) {
                                                if (value < 0 || value > 4) {
                                                    return Promise.reject(new Error("GPA phải từ 0 đến 4"));
                                                }
                                            }
                                            return Promise.resolve();
                                        },
                                    },
                                ]}
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

                    {/* Transcript Upload Section Refined - No Drag/Drop, Distinct View/Edit */}
                    <Form.Item
                        label="Bảng điểm (ảnh)"
                        required={!isEditMode}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            {transcriptPreview ? (
                                <div style={{ marginBottom: 10, textAlign: 'center' }}>
                                    <Image
                                        width={600}
                                        src={transcriptPreview}
                                        placeholder={<Spin />}
                                        style={{ borderRadius: '8px', border: '1px solid #d9d9d9', objectFit: 'contain', maxHeight: '500px' }}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                            {transcriptFile ? `Đang chọn: ${transcriptFile.name}` : "Ảnh hiện tại"}
                                        </Text>
                                        <Upload
                                            accept=".jpg,.jpeg,.png"
                                            maxCount={1}
                                            showUploadList={false}
                                            beforeUpload={() => false}
                                            onChange={handleTranscriptChange}
                                        >
                                            <Button icon={<UploadOutlined />}>Thay đổi ảnh khác</Button>
                                        </Upload>
                                    </div>
                                </div>
                            ) : (
                                <Upload
                                    accept=".jpg,.jpeg,.png"
                                    maxCount={1}
                                    showUploadList={false}
                                    beforeUpload={() => false}
                                    onChange={handleTranscriptChange}
                                >
                                    <Button icon={<UploadOutlined />}>Tải ảnh bảng điểm lên</Button>
                                </Upload>
                            )}
                        </div>
                    </Form.Item>

                    {/* Diploma Upload Section Refined - No Drag/Drop, Distinct View/Edit */}
                    <Form.Item
                        label="File văn bằng (ảnh)"
                        required={!isEditMode}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            {diplomaPreview ? (
                                <div style={{ marginBottom: 10, textAlign: 'center' }}>
                                    <Image
                                        width={600}
                                        src={diplomaPreview}
                                        placeholder={<Spin />}
                                        style={{ borderRadius: '8px', border: '1px solid #d9d9d9', objectFit: 'contain', maxHeight: '500px' }}
                                    />
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                            {diplomaFile ? `Đang chọn: ${diplomaFile.name}` : "Ảnh hiện tại"}
                                        </Text>
                                        <Upload
                                            accept=".jpg,.jpeg,.png"
                                            maxCount={1}
                                            showUploadList={false}
                                            beforeUpload={() => false}
                                            onChange={handleDiplomaChange}
                                        >
                                            <Button icon={<UploadOutlined />}>Thay đổi ảnh khác</Button>
                                        </Upload>
                                    </div>
                                </div>
                            ) : (
                                <Upload
                                    accept=".jpg,.jpeg,.png"
                                    maxCount={1}
                                    showUploadList={false}
                                    beforeUpload={() => false}
                                    onChange={handleDiplomaChange}
                                >
                                    <Button icon={<UploadOutlined />}>Tải ảnh văn bằng lên</Button>
                                </Upload>
                            )}
                        </div>
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
                            {isEditMode ? "Cập nhật hồ sơ" : "Lưu hồ sơ"}
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
