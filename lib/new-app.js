const oc = require("node-oc");
const { getNodeField } = require("./shared");

module.exports = RED => {
  function ocNewApp(n) {
    const node = this;
    const { templateFieldType, template, parametersFieldType, parameters } = n;
    RED.nodes.createNode(node, n);
    node.topic = n.topic;
    node.formatOutput = n.formatOutput;
    node.on("input", async msg => {
      const msgResponse = [null, null];
      node.parameters = getNodeField(
        node,
        parametersFieldType,
        parameters,
        RED,
        msg
      );
      node.parameters = getNodeField(
        node,
        parametersFieldType,
        parameters,
        RED,
        msg
      );
      try {
        const argsEnv = {
          template: node.template,
          parameters: node.parameters,
          options: {
            output: node.formatOutput
          }
        };
        const { stdout } = await oc.env(argsEnv);
        /* eslint-disable no-param-reassign */
        if (node.formatOutput === "json") {
          msg.payload = JSON.parse(stdout);
        } else {
          msg.payload = stdout;
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
    node.on("close", () => node.status({}));
  }
  RED.nodes.registerType("ocNewApp", ocNewApp);
};
