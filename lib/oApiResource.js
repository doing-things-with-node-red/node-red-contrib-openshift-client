const { getNodeField, getK8Client } = require('./shared');

/* eslint no-param-reassign: ["error", { "props": false }] */

function getNodesValuesByMsg(config, node, RED, msg) {
  const {
    namespaceFieldType, namespace, selectorFieldType, selector,
  } = config;
  return {
    namespace: getNodeField(node, namespaceFieldType, namespace, RED, msg),
    name: getNodeField(node, selectorFieldType, selector, RED, msg),
  };
}

module.exports = (RED) => {
  function myNode(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.config = RED.nodes.getNode(config.openshiftConfig);
    node.topic = config.topic;
    node.method = config.method;
    node.kind = config.kind;
    node.on('input', async (msg) => {
      const msgResponse = [null, null];
      node.status({
        fill: 'grey',
        shape: 'dot',
        text: 'Initializing oApi interface',
      });
      try {
        const { oapi } = await getK8Client(node, RED, msg);
        const { namespace, name } = getNodesValuesByMsg(config, node, RED, msg);
        const { payload } = msg;
        node.status({
          fill: 'blue',
          shape: 'dot',
          text: 'Doing request',
        });
        switch (node.method) {
          case 'put':
          case 'patch':
          case 'delete': {
            const k8Resource = oapi.v1.ns(namespace)[node.kind](name);
            msg.payload = await k8Resource[node.method]({ body: payload });
            break;
          }
          case 'post': {
            const k8Resource = oapi.v1.ns(namespace)[node.kind];
            msg.payload = await k8Resource.post({ body: payload });
            break;
          }
          case 'get':
          default: {
            const k8Resource = oapi.v1.ns(namespace)[node.kind](name);
            msg.payload = await k8Resource.get();
            break;
          }
        }
        msg.statusCode = msg.payload.statusCode;
        msgResponse[0] = msg;
      } catch (err) {
        const { code, statusCode, message } = err;
        msg.statusCode = statusCode || 500;
        msg.payload = { code, statusCode, message };
        msg.err = err;
        msgResponse[1] = msg;
        node.error(err);
      } finally {
        node.status({
          fill: msg.statusCode === 200 ? 'green' : 'red',
          shape: 'dot',
          text: `Finished request with httpCode: ${msg.statusCode}`,
        });
        node.send(msgResponse);
      }
    });
    node.on('close', () => node.status({}));
  }
  RED.nodes.registerType('openshiftOApiResource', myNode);
};
