import api from "./api";

// Tìm off-chain (nhanh, không gọi blockchain)
export async function searchDiplomas(type, value) {
    const res = await api.get("/public/search", { params: { type, value } });
    return res.data;
}

// Xác thực on-chain theo serialNo (chậm hơn, gọi blockchain)
export async function verifyOnChain(serialNo) {
    const res = await api.get("/public/verify", { params: { serialNo } });
    return res.data;
}

// Tải file công khai (ảnh/tài liệu) theo ID diploma
export async function downloadPublicDiplomaFile(diplomaId, kind) {
    const res = await api.get(`/public/diplomas/${diplomaId}/files/${kind}`, {
        responseType: "blob",
    });
    return res.data; // Blob
}
