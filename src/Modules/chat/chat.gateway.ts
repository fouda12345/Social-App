import { IAuthSocket } from "../Gateway/gateway.main";
import { ChatEvents } from "./chat.events";

export class ChatGateway {
    private _chatEvents : ChatEvents = new ChatEvents();
    
    constructor() { }


    register = (socket : IAuthSocket) => {
        this._chatEvents.sendMessage(socket);
        this._chatEvents.joinRoom(socket);
        this._chatEvents.sendGroupMessage(socket);
        this._chatEvents.requestOnlineUsers(socket);
    }

}