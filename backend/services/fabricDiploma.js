import { getContract } from "./fabricClient.js";

function toJson(buf) {
    return JSON.parse(Buffer.from(buf).toString("utf8"));
}

export async function chainRead(serialNo) {
    const c = getContract();
    const out = await c.evaluateTransaction("ReadDiploma", serialNo);
    return toJson(out);
}

export async function chainIssue(serialNo, recordHash, issuedAtISO) {
    const c = getContract();
    const out = await c.submitTransaction("IssueDiploma", serialNo, recordHash, issuedAtISO);
    return toJson(out); // nên return có txId (nếu chaincode bạn có trả)
}

export async function chainRevoke(serialNo, revokedAtISO) {
    const c = getContract();
    const out = await c.submitTransaction("RevokeDiploma", serialNo, revokedAtISO);
    return toJson(out);
}
