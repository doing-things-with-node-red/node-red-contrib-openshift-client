const oc = require('node-oc');

module.exports = (RED) => {
  function LoginNode(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.topic = config.topic;
    node.config = RED.nodes.getNode(config.ocConfig);
    node.on('input', (msg) => {
      try {
        const args = {
          url: `${node.config.host}:${node.config.port}`,
          options: {
              insecure: node.config.insecure || false,
              token: node.config.token,
          },
        };
        // TODO: use promises!!
        oc.login(args, (result) => {
          msg.payload = result;
          node.send(msg);
        });
      } catch (error) {
        node.error(error);
        msg.err = error;
        node.send(msg);
      } finally {
        // node.send(msg);
      }
    });
    node.on('close', () => node.status({}));
  }
  RED.nodes.registerType('ocLogin', LoginNode);
};