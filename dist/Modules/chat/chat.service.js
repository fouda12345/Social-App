"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const success_handler_1 = require("../../Utils/Handlers/success.handler");
const chat_reposetory_1 = require("../../DB/reposetories/chat.reposetory");
const user_reposetory_1 = require("../../DB/reposetories/user.reposetory");
const mongoose_1 = require("mongoose");
const error_handler_1 = require("../../Utils/Handlers/error.handler");
const gateway_main_1 = require("../Gateway/gateway.main");
const uuid_1 = require("uuid");
class ChatService {
    _chatModel = new chat_reposetory_1.ChatReposetory();
    _userModel = new user_reposetory_1.UserReposetory();
    constructor() { }
    getChat = async (req, res, next) => {
        const { userId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: { $all: [mongoose_1.Types.ObjectId.createFromHexString(userId), req.user?._id] },
                group: { $exists: false }
            },
            populate: { path: "participants" }
        });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { chat } });
    };
    createGroupChat = async (req, res, next) => {
        const { group, participants } = req.body;
        const participantsIds = participants.map((p) => mongoose_1.Types.ObjectId.createFromHexString(p));
        const users = await this._userModel.find({
            filter: { _id: { $in: participantsIds }, friends: { $in: [req.user?._id] } }
        });
        if (users.length !== participantsIds.length)
            throw new error_handler_1.BadRequestError({ message: "One or more participants are invalid" });
        const [chat] = await this._chatModel.create({
            data: [{
                    group,
                    participants: [...participantsIds, req.user?._id],
                    roomId: (0, uuid_1.v4)(),
                    createdBy: req.user?._id
                }]
        }) || [];
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { chat } });
    };
    getGroupChat = async (req, res, next) => {
        const { groupId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: { _id: mongoose_1.Types.ObjectId.createFromHexString(groupId), group: { $exists: true }, participants: { $in: req.user?._id } },
            populate: { path: "messages.createdBy" }
        });
        return (0, success_handler_1.successHandler)({ res, statusCode: 200, message: "Success", data: { chat } });
    };
    sendMessage = async ({ socket, data }) => {
        try {
            const createdBy = socket.credentials?.user?._id;
            const { sendTo, content } = data;
            const user = await this._userModel.findOne({ filter: { _id: sendTo, friends: { $in: [createdBy] } } });
            if (!user)
                throw new error_handler_1.NotFoundError({ message: "User not found" });
            let chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    participants: { $all: [sendTo, createdBy] },
                    group: { $exists: false }
                },
                update: {
                    $addToSet: { messages: { content, createdBy } }
                },
                options: { new: true }
            });
            if (!chat) {
                [chat] = await this._chatModel.create({
                    data: [{
                            participants: [sendTo, createdBy],
                            messages: [{ content, createdBy: createdBy }],
                            createdBy: createdBy
                        }]
                }) || [];
                if (!chat)
                    throw new error_handler_1.BadRequestError({ message: "failed to create chat" });
            }
            socket.emit("successMessage", { content });
            gateway_main_1.connectedSockets.get(sendTo.toString())?.forEach(tab => tab.socket.emit("newMessage", { content, from: socket.credentials?.user }));
        }
        catch (error) {
            console.log(error);
            socket.emit("custom_error", error);
        }
    };
    joinRoom = async ({ socket, data }) => {
        try {
            const chat = await this._chatModel.findOne({
                filter: { roomId: data.roomId, participants: { $in: socket.credentials?.user?._id }, group: { $exists: true } },
            });
            if (!chat)
                throw new error_handler_1.NotFoundError({ message: "Chat not found" });
            socket.join(data.roomId);
        }
        catch (error) {
            console.log(error);
            socket.emit("custom_error", error);
        }
    };
    sendGroupMessage = async ({ socket, data }) => {
        try {
            const chat = await this._chatModel.findOneAndUpdate({
                filter: { _id: data.groupId, group: { $exists: true }, participants: { $in: socket.credentials?.user?._id } },
                update: {
                    $addToSet: { messages: { content: data.content, createdBy: socket.credentials?.user?._id } }
                },
                options: { new: true }
            });
            if (!chat)
                throw new error_handler_1.NotFoundError({ message: "Chat not found" });
            socket.emit("successMessage", { content: data.content });
            socket.to(chat.roomId).emit("newMessage", { content: data.content, from: socket.credentials?.user, groupId: data.groupId });
        }
        catch (error) {
            console.log(error);
            socket.emit("custom_error", error);
        }
    };
}
exports.ChatService = ChatService;
exports.default = new ChatService();
