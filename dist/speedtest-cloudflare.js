"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedtestCloudflare = void 0;
const https_1 = __importDefault(require("https"));
const perf_hooks_1 = require("perf_hooks");
const math_1 = require("./utils/math");
class SpeedtestCloudflare {
    constructor() {
        this.host = 'speed.cloudflare.com';
    }
    async start() {
        const downloadTestsConfig = [
            [10e4, 10],
            [100e4, 8],
            [1000e4, 6],
            [2500e4, 4],
            [10000e4, 3],
        ];
        const downloadTests = await Promise.all(downloadTestsConfig.map(([bytes, iterations]) => this.measureDownload(bytes, iterations)));
        const download = math_1.quartile(downloadTests.flat(), 0.9).toFixed(2);
        const uploadTestsConfig = [
            [10e4, 8],
            [100e4, 6],
            [1000e4, 4],
        ];
        const uploadTests = (await Promise.all(uploadTestsConfig.map(([bytes, iterations]) => this.measureUpload(bytes, iterations)))).flat();
        const upload = math_1.quartile(uploadTests, 0.9).toFixed(2);
        return { download, upload };
    }
    async measureDownload(bytes, iterations) {
        const measurements = [];
        for (let i = 0; i < iterations; i++) {
            try {
                const { ttfb, ended } = await this.download(bytes);
                const transferTime = ended - ttfb;
                measurements.push(this.measureSpeed(bytes, transferTime));
            }
            catch (e) {
                throw e;
            }
        }
        return measurements;
    }
    async measureUpload(bytes, iterations) {
        const measurements = [];
        for (let i = 0; i < iterations; i++) {
            try {
                const { serverDuration } = await this.upload(bytes);
                const transferTime = serverDuration;
                measurements.push(this.measureSpeed(bytes, transferTime));
            }
            catch (e) {
                throw e;
            }
        }
        return measurements;
    }
    download(bytes) {
        return this.request({
            hostname: this.host,
            path: `/__down?bytes=${bytes}`,
            method: 'GET',
        });
    }
    upload(bytes) {
        const data = '0'.repeat(bytes);
        return this.request({
            hostname: this.host,
            path: `/__up`,
            method: 'POST',
            headers: {
                'Content-Length': Buffer.byteLength(data),
            },
        }, data);
    }
    measureSpeed(bytes, duration) {
        return (bytes * 8) / (duration / 1000) / 1e6;
    }
    request(options, data = '') {
        let started;
        let dnsLookup;
        let tcpHandshake;
        let sslHandshake;
        let ttfb;
        let ended;
        return new Promise((resolve, reject) => {
            started = perf_hooks_1.performance.now();
            const req = https_1.default.request(options, res => {
                res.once('readable', () => {
                    ttfb = perf_hooks_1.performance.now();
                });
                res.on('data', () => { });
                res.on('end', () => {
                    ended = perf_hooks_1.performance.now();
                    resolve({
                        started,
                        dnsLookup,
                        tcpHandshake,
                        sslHandshake,
                        ttfb,
                        ended,
                        serverDuration: parseFloat(String(res.headers['server-timing']).slice(22)),
                    });
                });
            });
            req.on('socket', socket => {
                socket.on('lookup', () => {
                    dnsLookup = perf_hooks_1.performance.now();
                });
                socket.on('connect', () => {
                    tcpHandshake = perf_hooks_1.performance.now();
                });
                socket.on('secureConnect', () => {
                    sslHandshake = perf_hooks_1.performance.now();
                });
            });
            req.on('error', error => {
                reject(error);
            });
            req.write(data);
            req.end();
        });
    }
}
exports.SpeedtestCloudflare = SpeedtestCloudflare;
