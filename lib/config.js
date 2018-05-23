module.exports = (RED) => {
    function ConfigNode(n) {
        const node = this;
        const _getField = (kind, value) => {
            switch (kind) {
                case 'flow': {
                    return node.context().flow.get(value);
                    break;
                }
                case 'global': {
                    return node.context().global.get(value);
                    break;
                }
                case 'num': {
                    return parseInt(value);
                    break;
                }
                case 'bool': {
                    return JSON.parse(value);
                    break;
                }
                default: {
                    return value;
                    break;
                }
            }
        };
        RED.nodes.createNode(node, n);
        node.name = n.name;
        node.host = _getField(n.hostFieldType, n.host);
        node.hostFieldType = n.hostFieldType;
        node.port = _getField(n.portFieldType, n.port);
        node.portFieldType = n.portFieldType;
        node.insecure = _getField(n.insecureFieldType, n.insecure);
        node.insecureFieldType = n.insecureFieldType;
        if (node.credentials) {
            node.token = _getField(n.tokenFieldType, node.credentials.token);
            node.tokenFieldType = n.tokenFieldType;
        }
    }
    RED.nodes.registerType('ocConfig', ConfigNode, {
        credentials: {
            token: {type: 'text'},
        }
    });
};
