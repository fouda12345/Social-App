import { IAuthSocket } from "../Gateway/gateway.main";
import z from "zod"
import { createGroupSchema, getChatSchema, getGroupSchema } from "./chat.validation";

export interface ISendMessageDTO {
    data:{
        content : string,
        sendTo : string
    }
    socket : IAuthSocket,
    
}

export interface IJoinRoomDTO {
    data : {
        roomId : string,
    }
    socket : IAuthSocket,
}

export interface ISendGrouopMessageDTO {
    data:{
        content : string,
        groupId : string
    }
    socket : IAuthSocket,
    
}

export interface IRequestOnlineUsersDTO {
    socket : IAuthSocket
}

export type IGetChatDTO = z.infer<typeof getChatSchema>["params"]

export type ICreateGroupChatDTO = z.infer<typeof createGroupSchema>["body"]

export type IGetGroupChatDTO = z.infer<typeof getGroupSchema>["params"]