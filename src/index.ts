import { Node, NodeDef, NodeInitializer } from 'node-red';
import { SpeedtestCloudflare } from './speedtest-cloudflare';

const init: NodeInitializer = RED => {
  function SpeedTest(this: Node, config: NodeDef) {
    RED.nodes.createNode(this, config);

    this.on('input', async (msg, send, done) => {
      this.status({ fill: 'yellow', shape: 'dot', text: 'Requesting' });
      const test = new SpeedtestCloudflare();
      try {
        const payload = await test.start();
        this.status({});
        this.send({ payload });
      } catch (e) {
        this.status({ fill: 'red', shape: 'dot', text: e.message });
      }
    });
  }

  RED.nodes.registerType('speedtest-cloudflare', SpeedTest);
};
export default init;
