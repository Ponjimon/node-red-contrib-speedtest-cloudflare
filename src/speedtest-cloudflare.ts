import fetch from 'node-fetch';
import https, { RequestOptions } from 'https';
import { performance } from 'perf_hooks';
import { URL } from 'url';
import { quartile } from './utils/math';

export class SpeedtestCloudflare {
  private readonly host = 'speed.cloudflare.com';

  async start() {
    const downloadTestsConfig = [
      [10e4, 10],
      [100e4, 8],
      [1000e4, 6],
      [2500e4, 4],
      [10000e4, 3],
    ];
    const downloadTests = await Promise.all(
      downloadTestsConfig.map(([bytes, iterations]) =>
        this.measureDownload(bytes, iterations)
      )
    );
    const download = quartile(downloadTests.flat(), 0.9).toFixed(2);

    const uploadTestsConfig = [
      [10e4, 8],
      [100e4, 6],
      [1000e4, 4],
    ];
    const uploadTests = (
      await Promise.all(
        uploadTestsConfig.map(([bytes, iterations]) =>
          this.measureUpload(bytes, iterations)
        )
      )
    ).flat();
    const upload = quartile(uploadTests, 0.9).toFixed(2);

    return { download, upload };
  }

  async measureDownload(bytes: number, iterations: number) {
    const measurements = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const { ttfb, ended } = await this.download(bytes);
        const transferTime = ended - ttfb;
        measurements.push(this.measureSpeed(bytes, transferTime));
      } catch (e) {
        throw e;
      }
    }

    return measurements;
  }

  async measureUpload(bytes: number, iterations: number) {
    const measurements = [];

    for (let i = 0; i < iterations; i++) {
      try {
        const { serverDuration } = await this.upload(bytes);
        const transferTime = serverDuration;
        measurements.push(this.measureSpeed(bytes, transferTime));
      } catch (e) {
        throw e;
      }
    }

    return measurements;
  }

  private download(bytes: number) {
    return this.request({
      hostname: this.host,
      path: `/__down?bytes=${bytes}`,
      method: 'GET',
    });
  }

  private upload(bytes: number) {
    const data = '0'.repeat(bytes);
    return this.request(
      {
        hostname: this.host,
        path: `/__up`,
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(data),
        },
      },
      data
    );
  }

  private measureSpeed(bytes: number, duration: number) {
    return (bytes * 8) / (duration / 1000) / 1e6;
  }

  private request(options: string | RequestOptions | URL, data = '') {
    let started: number;
    let dnsLookup: number;
    let tcpHandshake: number;
    let sslHandshake: number;
    let ttfb: number;
    let ended: number;

    return new Promise<{
      started: number;
      dnsLookup: number;
      tcpHandshake: number;
      sslHandshake: number;
      ttfb: number;
      ended: number;
      serverDuration: number;
    }>((resolve, reject) => {
      started = performance.now();
      const req = https.request(options, res => {
        res.once('readable', () => {
          ttfb = performance.now();
        });
        res.on('data', () => {});
        res.on('end', () => {
          ended = performance.now();
          resolve({
            started,
            dnsLookup,
            tcpHandshake,
            sslHandshake,
            ttfb,
            ended,
            serverDuration: parseFloat(
              String(res.headers['server-timing']).slice(22)
            ),
          });
        });
      });

      req.on('socket', socket => {
        socket.on('lookup', () => {
          dnsLookup = performance.now();
        });
        socket.on('connect', () => {
          tcpHandshake = performance.now();
        });
        socket.on('secureConnect', () => {
          sslHandshake = performance.now();
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
