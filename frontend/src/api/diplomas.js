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
