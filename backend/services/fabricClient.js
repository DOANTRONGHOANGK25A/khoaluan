import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import * as grpc from "@grpc/grpc-js";
import { connect, signers } from "@hyperledger/fabric-gateway";

dotenv.config();

let gatewayCache;

function readFirstFileInDir(dir) {
    const files = fs.readdirSync(dir).filter((f) => !f.startsWith("."));
    if (files.length === 0) throw new Error(`No key file in ${dir}`);
    return fs.readFileSync(path.join(dir, files[0]));
}

function newGrpcConnection() {
    const tlsCert = fs.readFileSync(process.env.FABRIC_TLS_CERT_PATH);
    const creds = grpc.credentials.createSsl(tlsCert);

    return new grpc.Client(process.env.FABRIC_PEER_ENDPOINT, creds, {
        "grpc.ssl_target_name_override": process.env.FABRIC_PEER_HOST_ALIAS,
        "grpc.default_authority": process.env.FABRIC_PEER_HOST_ALIAS,
    });
}

export function getGateway() {
    if (gatewayCache) return gatewayCache;

    const client = newGrpcConnection();

    const certPem = fs.readFileSync(process.env.FABRIC_CERT_PATH);
    const keyPem = readFirstFileInDir(process.env.FABRIC_KEY_DIR);

    const privateKey = crypto.createPrivateKey(keyPem);
    const signer = signers.newPrivateKeySigner(privateKey);

    gatewayCache = connect({
        client,
        identity: { mspId: process.env.FABRIC_MSPID, credentials: certPem },
        signer,
    });

    return gatewayCache;
}

export function getContract() {
    const gw = getGateway();
    const network = gw.getNetwork(process.env.FABRIC_CHANNEL);
    return network.getContract(process.env.FABRIC_CHAINCODE);
}

// Tạo gateway tạm bằng wallet upload (cert+key), dùng xong phải gọi close()
export function connectWithWallet(mspId, certificate, privateKeyPem) {
    const grpcClient = newGrpcConnection();
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const signer = signers.newPrivateKeySigner(privateKey);

    const gateway = connect({
        client: grpcClient,
        identity: { mspId, credentials: Buffer.from(certificate) },
        signer,
    });

    const network = gateway.getNetwork(process.env.FABRIC_CHANNEL);
    const contract = network.getContract(process.env.FABRIC_CHAINCODE);

    return {
        contract,
        close() { gateway.close(); grpcClient.close(); },
    };
}
