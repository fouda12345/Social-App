"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intializeGateway = exports.connectedSockets = void 0;
const socket_io_1 = require("socket.io");
const gateway_middleware_1 = require("./gateway.middleware");
const chat_gateway_1 = require("../chat/chat.gateway");
exports.connectedSockets = new Map();
const intializeGateway = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*"
        }
    });
    io.use(gateway_middleware_1.authGateway);
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on("connection", (socket) => {
        const userId = socket.credentials?.user?._id?.toString();
        console.log(`user ${userId} connected tab with id ${socket.id}`);
        console.log(`connected sockest :`, exports.connectedSockets);
        chatGateway.register(socket);
        disconnectionHandler(socket);
    });
    function disconnectionHandler(socket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user?._id?.toString();
            const userTabs = exports.connectedSockets.get(userId)?.filter(tab => tab.id !== socket.id) || [];
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
