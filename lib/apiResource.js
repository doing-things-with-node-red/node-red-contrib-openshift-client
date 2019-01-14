const { getNodeField, getK8Client } = require("./shared");

function getNodesValuesByMsg(config, node, RED, msg) {
  const { namespaceFieldType, namespace, selectorFieldType, selector } = config;
  return {
    namespace: getNodeField(node, namespaceFieldType, namespace, RED, msg),
    name: getNodeField(node, selectorFieldType, selector, RED, msg)
  };
}

module.exports = RED => {
  function myNode(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.config = RED.nodes.getNode(config.ocConfig);
    node.topic = config.topic;
    node.method = config.method;
    node.kind = config.kind;
    node.on("input", async msg => {
      const msgResponse = [null, null];
      node.status({
        fill: "grey",
        shape: "dot",
        text: `Initializing oApi interface`
      });
      try {
        const { api } = await getK8Client(node, RED, msg);
        const { namespace, name } = getNodesValuesByMsg(config, node, RED, msg);
        const { payload } = msg;
        node.status({
          fill: "blue",
          shape: "dot",
          text: "Doing request"
        });
        /* eslint-disable no-param-reassign */
        switch (node.method) {
          case "put":
          case "patch":
          case "delete": {
            msg.payload = await api.v1
              .ns(namespace)
              [node.kind](name)
              [node.method]({ body: payload });
            break;
          }
          case "post": {
            msg.payload = await api.v1
              .ns(namespace)
              [node.kind].post({ body: payload });
            break;
          }
          case "get":
          default: {
            msg.payload = await api.v1
              .ns(namespace)
              [node.kind](name)
              .get();
            break;
          }
        }
        msg.statusCode = msg.payload.statusCode;
        /* eslint-enable no-param-reassign */
        msgResponse[0] = msg;
      } catch (err) {
        const { code, statusCode, message } = err;
        msg.statusCode = statusCode || 500;
        /* eslint-disable no-param-reassign */
        msg.payload = { code, statusCode, message };
        msg.err = err;
        msgResponse[1] = msg;
        /* eslint-enable no-param-reassign */
        node.error(err);
      } finally {
        node.status({
          fill: msg.statusCode === 200 ? "green" : "red",
          shape: "dot",
          text: `Finished request with httpCode: ${msg.statusCode}`
        });
        node.send(msgResponse);
      }
    });
    node.on("close", () => node.status({}));
  }
  RED.nodes.registerType("ocApiResource", myNode);
};
