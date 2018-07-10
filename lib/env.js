const oc = require('node-oc');
const { getNodeField } = require('./shared');

module.exports = (RED) => {
  function EnvNode(n) {
    const node = this;
    const {
      objectSelectionFieldType, objectSelection, variablesFieldType, variables,
    } = n;
    RED.nodes.createNode(node, n);
    node.topic = n.topic;
    node.read = n.read;
    node.formatOutput = n.formatOutput;
    node.on('input', async (msg) => {
      const msgResponse = [null, null];
      node.objectSelection = getNodeField(
        node,
        objectSelectionFieldType,
        objectSelection,
        RED,
        msg,
      );
      node.variables = getNodeField(node, variablesFieldType, variables, RED, msg);
      try {
        const argsEnv = {
          objectSelection: node.objectSelection,
          variables: node.read ? !node.read : node.variables,
          options: {
            output: node.formatOutput,
          },
        };
        const { stdout } = await oc.env(argsEnv);
        /* eslint-disable no-param-reassign */
        if (node.read) {
          if (node.formatOutput === 'json') {
            msg.payload = JSON.parse(stdout);
          } else {
            msg.payload = stdout;
          }
        } else {
          msg.payload = { stdout };
        }
        msgResponse[0] = msg;
        /* eslint-enable no-param-reassign */
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
  RED.nodes.registerType('ocEnv', EnvNode);
};
