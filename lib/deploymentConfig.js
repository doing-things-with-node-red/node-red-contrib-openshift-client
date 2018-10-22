const { getNodeField, getK8Client } = require("./shared");

function getNodesValuesByMsg(config, node, RED, msg) {
  const {
    namespaceFieldType,
    namespace,
    deploymentConfigFieldType,
    deploymentConfig
  } = config;
  return {
    namespace: getNodeField(node, namespaceFieldType, namespace, RED, msg),
    name: getNodeField(
      node,
      deploymentConfigFieldType,
      deploymentConfig,
      RED,
      msg
    )
  };
}

module.exports = RED => {
  function ocDeploymentConfig(config) {
    const node = this;
    RED.nodes.createNode(node, config);
    node.config = RED.nodes.getNode(config.ocConfig);
    node.topic = config.topic;
    node.method = config.method;
    node.on("input", async msg => {
      const msgResponse = [null, null];
      try {
        const { oapi } = await getK8Client(node, RED, msg);
        const { namespace, name } = getNodesValuesByMsg(config, node, RED, msg);
        const { payload } = msg;
        /* eslint-disable no-param-reassign */
        switch (node.method) {
          case "post":
          case "patch":
          case "delete": {
            msg.payload = await oapi.v1
              .ns(namespace)
              .deploymentconfigs(name)
              [node.method]({ body: payload });
            break;
          }
          case "get":
          default: {
            msg.payload = await oapi.v1
              .ns(namespace)
              .deploymentconfigs(name)
              .get();
            break;
          }
        }
        /* eslint-enable no-param-reassign */
        msgResponse[0] = msg;
      } catch (err) {
        const { code, statusCode, message } = err;
        /* eslint-disable no-param-reassign */
        msg.payload = { code, statusCode, message };
        msg.err = err;
        msgResponse[1] = msg;
        /* eslint-enable no-param-reassign */
        node.error(err);
      } finally {
        node.send(msgResponse);
      }
    });
    node.on("close", () => node.status({}));
  }
  RED.nodes.registerType("ocDeploymentConfig", ocDeploymentConfig);
};
