"use strict";

const { Contract } = require("fabric-contract-api");

function ensureSerial(serialNo) {
    if (!serialNo || typeof serialNo !== "string") throw new Error("serialNo required");
    return serialNo.trim();
}

function ensureIsoTime(t) {
    if (!t) return new Date().toISOString();
    return t.toString();
}

class VanBangContract extends Contract {
    /**
     * Query diploma by serialNo
     * @param {Context} ctx
     * @param {string} serialNo
     * @returns {string} JSON string of diploma record
     */
    async QueryDiploma(ctx, serialNo) {
        serialNo = ensureSerial(serialNo);

        const data = await ctx.stub.getState(serialNo);
        if (!data || data.length === 0) throw new Error("NOT_FOUND");

        return data.toString();
    }

    /**
     * Alias for QueryDiploma - backward compatibility
     */
    async ReadDiploma(ctx, serialNo) {
        return this.QueryDiploma(ctx, serialNo);
    }

    /**
     * Issue a new diploma
     * @param {Context} ctx
     * @param {string} serialNo - unique serial number
     * @param {string} jsonRecordString - JSON string containing: studentId, studentName, birthDate, major, ranking, gpa, graduationYear, recordHash, issuedAt
     * @returns {string} JSON string of created diploma
     */
    async IssueDiploma(ctx, serialNo, jsonRecordString) {
        serialNo = ensureSerial(serialNo);

        // Check if already exists
        const exists = await ctx.stub.getState(serialNo);
        if (exists && exists.length > 0) throw new Error("ALREADY_EXISTS");

        // Parse input JSON
        let input;
        try {
            input = JSON.parse(jsonRecordString);
        } catch (e) {
            throw new Error("INVALID_JSON: " + e.message);
        }

        // Validate required fields
        const requiredFields = ["studentId", "studentName", "birthDate", "major", "ranking", "gpa", "graduationYear", "recordHash"];
        for (const field of requiredFields) {
            if (input[field] === undefined || input[field] === null || input[field] === "") {
                throw new Error(`MISSING_FIELD: ${field}`);
            }
        }

        // Validate recordHash format (64 hex chars)
        const recordHash = input.recordHash.trim().toLowerCase();
        if (!/^[0-9a-f]{64}$/.test(recordHash)) {
            throw new Error("recordHash must be 64 hex chars");
        }

        const txId = ctx.stub.getTxID();
        const issuedAt = ensureIsoTime(input.issuedAt);

        // Build full on-chain object with all required fields
        const obj = {
            serialNo,
            studentId: input.studentId,
            studentName: input.studentName,
            birthDate: input.birthDate,
            major: input.major,
            ranking: input.ranking,
            gpa: input.gpa,
            graduationYear: input.graduationYear,
            recordHash,
            status: "ISSUED",
            issuedAt,
            revokedAt: null,
            txId
        };

        await ctx.stub.putState(serialNo, Buffer.from(JSON.stringify(obj)));
        return JSON.stringify(obj);
    }

    /**
     * Revoke an existing diploma
     * @param {Context} ctx
     * @param {string} serialNo
     * @param {string} revokedAt - ISO timestamp
     * @returns {string} JSON string of updated diploma
     */
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
