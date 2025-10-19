"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvents = void 0;
const chat_service_1 = __importDefault(require("./chat.service"));
class ChatEvents {
    _chatService = chat_service_1.default;
    constructor() { }
    sendMessage = (socket) => {
        return socket.on("sendMessage", (data) => {
            this._chatService.sendMessage({ socket, data });
        });
    };
    joinRoom = (socket) => {
        return socket.on("join_room", (data) => {
            this._chatService.joinRoom({ socket, data });
        });
    };
    sendGroupMessage = (socket) => {
        return socket.on("sendGroupMessage", (data) => {
            this._chatService.sendGroupMessage({ socket, data });
        });
    };
}
exports.ChatEvents = ChatEvents;
