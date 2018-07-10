const oc = require('node-oc');
const { getNodeConfig, getNodeField } = require('./shared');

module.exports = (RED) => {
  function LoginNode(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.topic = config.topic;
    node.config = RED.nodes.getNode(config.ocConfig);
    node.on('input', async (msg) => {
      const msgResponse = [null, null];
      try {
        const { projectFieldType, project } = config;
        const {
          host, port, insecure, token,
        } = getNodeConfig(node, RED, msg);
        const argsLogin = {
          url: `${host}:${port}`,
          options: { insecure, token },
        };
        const { stdout } = await oc.login(argsLogin);
        node.project = getNodeField(node, projectFieldType, project, RED, msg);
        if (node.project) {
          const projectOutput = await oc.project.set({
            options: {
              project: node.project,
            },
          });
          /* eslint-disable no-param-reassign */
          msg.payload = { stdout: projectOutput.stdout };
          /* eslint-enable no-param-reassign */
        } else {
          /* eslint-disable no-param-reassign */
          msg.payload = { stdout };
          /* eslint-enable no-param-reassign */
        }
        msgResponse[0] = msg;
      } catch (err) {
        /* eslint-disable no-param-reassign */
        msg.payload = err;
        msg.err = err;
        msgResponse[1] = msg;
        /* eslint-enable no-param-reassign */
        node.error(err);
      } finally {
        node.send(msgResponse);
      }
    });
    node.on('close', () => node.status({}));
  }
  RED.nodes.registerType('ocLogin', LoginNode);
};
