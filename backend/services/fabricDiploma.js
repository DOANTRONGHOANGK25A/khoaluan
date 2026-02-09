import { getContract, connectWithWallet } from "./fabricClient.js";

function toJson(buf) {
    return JSON.parse(Buffer.from(buf).toString("utf8"));
}

// Đọc văn bằng từ blockchain
export async function chainRead(serialNo) {
    const c = getContract();
    const out = await c.evaluateTransaction("ReadDiploma", serialNo);
    return toJson(out);
}

// Phát hành văn bằng (dùng Admin credential)
export async function chainIssue(serialNo, diplomaData) {
    const c = getContract();
    const jsonRecordString = JSON.stringify(diplomaData);
    const out = await c.submitTransaction("IssueDiploma", serialNo, jsonRecordString);
    return toJson(out);
}

// Thu hồi văn bằng (dùng Admin credential)
export async function chainRevoke(serialNo, revokedAtISO) {
    const c = getContract();
    const out = await c.submitTransaction("RevokeDiploma", serialNo, revokedAtISO);
    return toJson(out);
}

// --- Wallet-based: dùng cert+key upload từ client ---

// Phát hành văn bằng với wallet từ client
export async function chainIssueWithWallet(serialNo, diplomaData, mspId, certificate, privateKey) {
    const { contract, close } = connectWithWallet(mspId, certificate, privateKey);
    try {
        const jsonRecordString = JSON.stringify(diplomaData);
        const out = await contract.submitTransaction("IssueDiploma", serialNo, jsonRecordString);
        return toJson(out);
    } finally {
        close();
    }
}

// Thu hồi văn bằng với wallet từ client
export async function chainRevokeWithWallet(serialNo, revokedAtISO, mspId, certificate, privateKey) {
    const { contract, close } = connectWithWallet(mspId, certificate, privateKey);
    try {
        const out = await contract.submitTransaction("RevokeDiploma", serialNo, revokedAtISO);
        return toJson(out);
    } finally {
        close();
    }
}
