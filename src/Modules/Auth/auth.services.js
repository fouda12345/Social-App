"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AuthService {
    constructor() { }
    login = async (req, res, next) => {
        return res.status(200).json({ message: "Login successful" });
    };
}
exports.default = new AuthService();
