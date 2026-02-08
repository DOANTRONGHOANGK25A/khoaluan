import api from "./api";

// Tạo hồ sơ + upload 3 file
export async function createDiploma(form, files) {
    const fd = new FormData();

    // fields
    fd.append("serialNo", form.serialNo || "");
    fd.append("studentId", form.studentId || "");
    fd.append("studentName", form.studentName || "");
    fd.append("birthDate", form.birthDate || "");
    fd.append("major", form.major || "");
    fd.append("ranking", form.ranking || "");
    fd.append("gpa", form.gpa || "");
    fd.append("graduationYear", form.graduationYear || "");

    // files
    fd.append("portrait", files.portrait);
    fd.append("diploma", files.diploma);
    fd.append("transcript", files.transcript);

    // axios tự set multipart boundary => không set Content-Type
    const res = await api.post("/diplomas", fd);
    return res.data;
}

// Cập nhật thông tin văn bằng (chỉ metadata)
export async function updateDiploma(id, data) {
    const res = await api.put(`/diplomas/${id}`, data);
    return res.data;
}

// List + search
export async function listDiplomas({ q = "", status = "" } = {}) {
    const res = await api.get("/diplomas", { params: { q, status } });
    return res.data;
}

// Download file -> trả Blob
export async function downloadDiplomaFile(diplomaId, kind) {
    const res = await api.get(`/diplomas/${diplomaId}/files/${kind}`, {
        responseType: "blob",
    });
    return res.data; // Blob
}

// Get detail by ID
export async function getDiplomaById(id) {
    const res = await api.get(`/diplomas/${id}`);
    return res.data;
}

// Approve (MANAGER)
export async function approveDiploma(id, note) {
    const res = await api.post(`/diplomas/${id}/approve`, { note });
    return res.data;
}

// Reject (MANAGER)
export async function rejectDiploma(id, note) {
    const res = await api.post(`/diplomas/${id}/reject`, { note });
    return res.data;
}

// Issue (ISSUER)
export async function issueDiploma(id) {
    const res = await api.post(`/diplomas/${id}/issue`);
    return res.data;
}

// Revoke (ISSUER)
export async function revokeDiploma(id) {
    const res = await api.post(`/diplomas/${id}/revoke`);
    return res.data;
}

// Get Approval Logs
export async function getApprovalLogs(id) {
    const res = await api.get(`/diplomas/${id}/approval-logs`);
    return res.data;
}

// Get Chain Logs
export async function getChainLogs(id) {
    const res = await api.get(`/diplomas/${id}/chain-logs`);
    return res.data;
}
