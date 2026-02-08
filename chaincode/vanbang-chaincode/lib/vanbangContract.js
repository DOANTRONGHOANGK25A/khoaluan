"use strict";

const { Contract } = require("fabric-contract-api");

function ensureSerial(serialNo) {
    if (!serialNo || typeof serialNo !== "string") throw new Error("serialNo required");
    return serialNo.trim();
}

function ensureHash(recordHash) {
    if (!recordHash || typeof recordHash !== "string") throw new Error("recordHash required");
    const h = recordHash.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(h)) throw new Error("recordHash must be 64 hex chars");
    return h;
}

function ensureIsoTime(t) {
    if (!t) return new Date().toISOString();
    return t.toString();
}

class VanBangContract extends Contract {
    async ReadDiploma(ctx, serialNo) {
        serialNo = ensureSerial(serialNo);

        const data = await ctx.stub.getState(serialNo);
        if (!data || data.length === 0) throw new Error("NOT_FOUND");

        return data.toString();
    }

    async IssueDiploma(ctx, serialNo, recordHash, issuedAt) {
        serialNo = ensureSerial(serialNo);
        recordHash = ensureHash(recordHash);
        issuedAt = ensureIsoTime(issuedAt);

        const exists = await ctx.stub.getState(serialNo);
        if (exists && exists.length > 0) throw new Error("ALREADY_EXISTS");

        const txId = ctx.stub.getTxID();

        const obj = {
            serialNo,
            recordHash,
            status: "ISSUED",
            issuedAt,
            revokedAt: null,
            txId
        };

        await ctx.stub.putState(serialNo, Buffer.from(JSON.stringify(obj)));
        return JSON.stringify(obj);
    }

    async RevokeDiploma(ctx, serialNo, revokedAt) {
        serialNo = ensureSerial(serialNo);
        revokedAt = ensureIsoTime(revokedAt);

        const data = await ctx.stub.getState(serialNo);
        if (!data || data.length === 0) throw new Error("NOT_FOUND");

        const obj = JSON.parse(data.toString());
        if (obj.status !== "ISSUED") throw new Error("NOT_ISSUED");

        const txId = ctx.stub.getTxID();

        obj.status = "REVOKED";
        obj.revokedAt = revokedAt;
        obj.txId = txId;

        await ctx.stub.putState(serialNo, Buffer.from(JSON.stringify(obj)));
        return JSON.stringify(obj);
    }
}

module.exports = { VanBangContract };
