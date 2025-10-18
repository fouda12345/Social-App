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
const auth_controller_1 = __importDefault(require("./Modules/Auth/auth.controller"));
const user_controller_1 = __importDefault(require("./Modules/User/user.controller"));
const post_controller_1 = __importDefault(require("./Modules/Post/post.controller"));
dotenv_1.default.config({ path: node_path_1.default.resolve("./config/.env") });
const error_handler_1 = require("./Utils/Handlers/error.handler");
const connection_1 = require("./DB/connection");
const limitter_utils_1 = require("./Utils/Middlewares/limitter.utils");
const cors_utils_1 = require("./Utils/Middlewares/cors.utils");
const get_assets_1 = require("./Utils/Handlers/get.assets");
const bootstrap = async () => {
    await (0, connection_1.connectDB)();
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 3000;
    app.use((0, cors_1.default)(cors_utils_1.corsOptions), express_1.default.json(), (0, helmet_1.default)(), limitter_utils_1.limiter, express_1.default.static(node_path_1.default.resolve('./src')));
    app.use("/api/v1/auth", auth_controller_1.default);
    app.use("/api/v1/user", user_controller_1.default);
    app.use("/api/v1/post", post_controller_1.default);
    app.get("/uploads/*path", get_assets_1.getAssets);
    app.use(error_handler_1.errorHandler);
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
};
exports.bootstrap = bootstrap;
