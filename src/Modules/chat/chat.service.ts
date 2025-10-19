import { NextFunction, Request, Response } from "express";
import { ICreateGroupChatDTO, IGetChatDTO, IGetGroupChatDTO, IJoinRoomDTO, IRequestOnlineUsersDTO, ISendGrouopMessageDTO, ISendMessageDTO } from "./chat.dto";
import { successHandler } from "../../Utils/Handlers/success.handler";
import { ChatReposetory } from "../../DB/reposetories/chat.reposetory";
import { UserReposetory } from "../../DB/reposetories/user.reposetory";
import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../../Utils/Handlers/error.handler";
import { HChatDocument } from "../../DB/Models/chat.model";
import { connectedSockets } from "../Gateway/gateway.main";
import {v4 as uuid} from "uuid";
export class ChatService {
    private _chatModel = new ChatReposetory()
    private _userModel = new UserReposetory()
    constructor() { }

    getChat = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { userId } = req.params as IGetChatDTO

        const chat = await this._chatModel.findOne({
            filter: {
                participants: { $all: [Types.ObjectId.createFromHexString(userId), req.user?._id] },
                group: { $exists: false }
            },
            populate: { path: "participants" }
        })
        return successHandler({ res, statusCode: 200, message: "Success", data: { chat } })
    }

    createGroupChat = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { group , participants } = req.body as ICreateGroupChatDTO

        const participantsIds = participants.map((p) => Types.ObjectId.createFromHexString(p))

        const users = await this._userModel.find({
            filter: { _id: { $in: participantsIds } , friends: { $in: [req.user?._id] } }
        })
        
        if (users.length !== participantsIds.length)
            throw new BadRequestError({ message: "One or more participants are invalid" })

        const [chat] = await this._chatModel.create({
            data: [{
                group,
                participants : [...participantsIds, req.user?._id as Types.ObjectId],
                roomId: uuid(),
                createdBy: req.user?._id as Types.ObjectId
            }]
        }) || []
        
        return successHandler({ res, statusCode: 200, message: "Success", data: { chat } })
    }

    getGroupChat = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
        const { groupId } = req.params as IGetGroupChatDTO

        const chat = await this._chatModel.findOne({
            filter: { _id: Types.ObjectId.createFromHexString(groupId) , group: { $exists: true } , participants: { $in: req.user?._id } },
            populate: { path: "messages.createdBy" }
        })

        return successHandler({ res, statusCode: 200, message: "Success", data: { chat } })
    }



    sendMessage = async ({ socket, data }: ISendMessageDTO) => {
        try {
            const createdBy = socket.credentials?.user?._id
            const { sendTo, content } = data
    
            const user = await this._userModel.findOne({ filter: { _id: sendTo, friends: { $in: [createdBy] } } })
            if (!user)
                throw new NotFoundError({ message: "User not found" })
            let chat : HChatDocument|undefined|null = await this._chatModel.findOneAndUpdate({
                filter: {
                    participants: { $all: [sendTo, createdBy] },
                    group: { $exists: false }
                },
                update: {
                    $addToSet: { messages: { content, createdBy } }
                },
                options: { new: true }
            })
            if (!chat) {
                [chat] = await this._chatModel.create({
                    data: [{
                        participants: [sendTo as unknown as Types.ObjectId, createdBy as Types.ObjectId],
                        messages: [{content,createdBy:createdBy as unknown as Types.ObjectId}],
                        createdBy: createdBy as unknown as Types.ObjectId
                    }]
                }) || [] 
                if (!chat)
                    throw new BadRequestError({ message: "failed to create chat" })
            }
            socket.emit("successMessage" , {content})
            connectedSockets.get(sendTo.toString())?.forEach(tab => tab.socket.emit("newMessage", { content , from: socket.credentials?.user }))
        } catch (error) {
            console.log(error);
            
            socket.emit("custom_error", error)
        }
    }

    joinRoom = async({ socket , data  }: IJoinRoomDTO) => {
        try {
            const chat = await this._chatModel.findOne({
                filter: {roomId: data.roomId , participants: { $in: socket.credentials?.user?._id },group: { $exists: true } },
            })
            if (!chat)
                throw new NotFoundError({ message: "Chat not found" })
            socket.join(data.roomId)
        } catch (error) {
            console.log(error);
            socket.emit("custom_error", error) 
        }
    }

    sendGroupMessage = async ({ socket , data }: ISendGrouopMessageDTO) => {
        try {
            const chat = await this._chatModel.findOneAndUpdate({
                filter: { _id: data.groupId , group: { $exists: true } , participants: { $in: socket.credentials?.user?._id } },
                update: {
                    $addToSet: { messages: { content: data.content, createdBy: socket.credentials?.user?._id } }
                },
                options: { new: true }
            })
            if (!chat)
                throw new NotFoundError({ message: "Chat not found" })
            socket.emit("successMessage" , {content:data.content})
            socket.to(chat.roomId as string).emit("newMessage", { content : data.content , from: socket.credentials?.user , groupId: data.groupId })
            
        } catch (error) {
            console.log(error);
            socket.emit("custom_error", error)
        }
    }

    requestOnlineUsers = async ({ socket }: IRequestOnlineUsersDTO) => {
        try {
            const users = [...connectedSockets.keys()].filter(userId => socket.credentials?.user?.friends?.includes(Types.ObjectId.createFromHexString(userId)))
            socket.emit("setOnlineStatus", users)
        } catch (error) {
            console.log(error);
            socket.emit("custom_error", error)
        }
    }
}

export default new ChatService()