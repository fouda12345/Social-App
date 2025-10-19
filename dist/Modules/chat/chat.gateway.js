"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const chat_events_1 = require("./chat.events");
class ChatGateway {
    _chatEvents = new chat_events_1.ChatEvents();
    constructor() { }
    register = (socket) => {
        this._chatEvents.sendMessage(socket);
        this._chatEvents.joinRoom(socket);
        this._chatEvents.sendGroupMessage(socket);
        this._chatEvents.requestOnlineUsers(socket);
    };
}
exports.ChatGateway = ChatGateway;
