import { IAuthSocket } from "../Gateway/gateway.main";
import chatService, { ChatService } from "./chat.service";

export class ChatEvents {

    private _chatService: ChatService = chatService;
    constructor() { }

    sendMessage = (socket:IAuthSocket) => {
        return socket.on("sendMessage", (data) => {
            this._chatService.sendMessage({socket , data});
        });
    }

    joinRoom = (socket:IAuthSocket) => {
        return socket.on("join_room", (data : {roomId : string}) => {
            this._chatService.joinRoom({socket , data});
        });
    }

    sendGroupMessage = (socket:IAuthSocket) => {
        return socket.on("sendGroupMessage", (data) => {
            this._chatService.sendGroupMessage({socket , data});
        });
    }
}