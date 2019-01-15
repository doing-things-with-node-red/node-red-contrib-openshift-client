module.exports = (RED) => {
  function ConfigNode(n) {
    const node = this;
    RED.nodes.createNode(node, n);
    node.name = n.name;
    node.host = n.host;
    node.hostFieldType = n.hostFieldType;
    node.port = n.port;
    node.portFieldType = n.portFieldType;
    node.insecure = n.insecure;
    node.insecureFieldType = n.insecureFieldType;
    node.token = n.token;
    node.tokenFieldType = n.tokenFieldType;
  }
  RED.nodes.registerType('openshiftConfig', ConfigNode);
};
