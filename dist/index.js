"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const speedtest_cloudflare_1 = require("./speedtest-cloudflare");
const init = RED => {
    function SpeedTest(config) {
        RED.nodes.createNode(this, config);
        this.on('input', async (msg, send, done) => {
            this.status({ fill: 'yellow', shape: 'dot', text: 'Requesting' });
            const test = new speedtest_cloudflare_1.SpeedtestCloudflare();
            try {
                const payload = await test.start();
                this.status({});
                this.send({ payload });
            }
            catch (e) {
                this.status({ fill: 'red', shape: 'dot', text: e.message });
            }
        });
    }
    RED.nodes.registerType('speedtest-cloudflare', SpeedTest);
};
exports.default = init;
