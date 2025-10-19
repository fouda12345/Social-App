"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGateway = void 0;
const gateway_main_1 = require("./gateway.main");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
const authGateway = async (socket, next) => {
    try {
        const { user, decodedToken } = await (0, jwt_utils_1.decodeToken)({ authorization: socket.handshake.auth.authorization, tokenType: jwt_utils_1.TokenType.ACCESS });
        const userTabs = gateway_main_1.connectedSockets.get(user._id.toString()) || [];
        userTabs.push({ id: socket.id, socket });
        gateway_main_1.connectedSockets.set(user._id.toString(), userTabs);
        socket.credentials = { user, decodedToken };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authGateway = authGateway;
