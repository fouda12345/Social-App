"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = __importDefault(require("./Modules/Auth/auth.controller"));
const error_handler_1 = require("./Utils/Handlers/error.handler");
dotenv_1.default.config({ path: node_path_1.default.resolve('./config/.env') });
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again alater',
    legacyHeaders: false,
    statusCode: 429,
});
const bootstrap = async () => {
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 3000;
    app.use((0, cors_1.default)(), express_1.default.json(), (0, helmet_1.default)(), limiter, express_1.default.static(node_path_1.default.resolve('./src')));
    app.use("/api/auth", auth_controller_1.default);
    app.use(error_handler_1.errorHandler);
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
};
exports.bootstrap = bootstrap;
