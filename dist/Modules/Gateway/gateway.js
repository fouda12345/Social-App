"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intializeGateway = exports.connectedSockets = void 0;
const socket_io_1 = require("socket.io");
const jwt_utils_1 = require("../../Utils/Security/jwt.utils");
exports.connectedSockets = new Map();
const intializeGateway = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*"
        }
    });
    io.use(async (socket, next) => {
        try {
            const { user, decodedToken } = await (0, jwt_utils_1.decodeToken)({ authorization: socket.handshake.headers.authorization, tokenType: jwt_utils_1.TokenType.ACCESS });
            const userTabs = exports.connectedSockets.get(user._id.toString()) || [];
            userTabs.push(socket.id);
            exports.connectedSockets.set(user._id.toString(), userTabs);
            socket.credentials = { user, decodedToken };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.credentials?.user?._id?.toString();
        console.log(`user ${userId} connected tab with id ${socket.id}`);
        console.log(`connected sockest :`, exports.connectedSockets);
        disconnectionHandler(socket);
    });
    function disconnectionHandler(socket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user?._id?.toString();
            const userTabs = exports.connectedSockets.get(userId)?.filter(tab => tab !== socket.id) || [];
            if (userTabs.length) {
                exports.connectedSockets.set(userId, userTabs);
            }
            else {
                exports.connectedSockets.delete(userId);
            }
            console.log(`user ${userId} disconnected tab with id ${socket.id}`);
            console.log(`connected sockest :`, exports.connectedSockets);
        });
    }
};
exports.intializeGateway = intializeGateway;
