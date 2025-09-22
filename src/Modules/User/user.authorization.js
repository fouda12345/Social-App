"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpoint = void 0;
const user_model_1 = require("../../DB/Models/user.model");
exports.endpoint = {
    all: Object.values(user_model_1.RoleEnum),
};
