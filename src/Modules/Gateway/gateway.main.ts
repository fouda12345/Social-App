import {Server as httpServer} from "node:http";

import { Server, Socket } from "socket.io";
import { HUserDocument } from "../../DB/Models/user.model";
import { JwtPayload } from "jsonwebtoken";
import { authGateway } from "./gateway.middleware";
import { ChatGateway } from "../chat/chat.gateway";

export interface IAuthSocket extends Socket{
    credentials?: {
        user? : Partial<HUserDocument>,
        decodedToken?: JwtPayload
    }
}

export const connectedSockets = new Map<string , {id : string,socket : IAuthSocket}[]>();
export const intializeGateway = (server: httpServer) => {
    const io = new Server(server , {
        cors: {
            origin: "*"
        }  
    });


    io.use(authGateway);
    const chatGateway : ChatGateway = new ChatGateway();
    io.on("connection" , (socket : IAuthSocket) => {
        const userId = socket.credentials?.user?._id?.toString();
        console.log(`user ${userId} connected tab with id ${socket.id}`)
        console.log(`connected sockest :` , connectedSockets);

        chatGateway.register(socket);
        disconnectionHandler(socket);
    });

    function disconnectionHandler(socket : IAuthSocket){
        socket.on("disconnect" , () => {
            const userId = socket.credentials?.user?._id?.toString();
            const userTabs = connectedSockets.get(userId as string)?.filter(tab => tab.id !== socket.id) || [];
            if (userTabs.length){
                connectedSockets.set(userId as string, userTabs);
            } else {
                connectedSockets.delete(userId as string);
            }
            console.log(`user ${userId} disconnected tab with id ${socket.id}`);
            console.log(`connected sockest :` , connectedSockets);
        })
    }
}