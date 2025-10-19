
import { connectedSockets, IAuthSocket } from "./gateway.main";
import { decodeToken, TokenType } from "../../Utils/Security/jwt.utils";
import { ExtendedError } from "socket.io";

export const authGateway = async (socket: IAuthSocket, next : (err?: ExtendedError) => void) => {
    try {
        const { user, decodedToken } = await decodeToken({ authorization: socket.handshake.auth.authorization as string, tokenType: TokenType.ACCESS });
        const userTabs = connectedSockets.get(user._id.toString()) || [];
        userTabs.push({id: socket.id,socket});
        connectedSockets.set(user._id.toString(), userTabs);
        socket.credentials = { user, decodedToken };
        next();
    } catch (error: any) {
        next(error);
    }
}