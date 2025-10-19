import express from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

import type { Express } from 'express';

import authRouter from './Modules/Auth/auth.controller';
import userRouter from './Modules/User/user.controller';
import postRouter from './Modules/Post/post.controller';
dotenv.config({path: path.resolve("./config/.env")});
import { errorHandler } from './Utils/Handlers/error.handler';
import { connectDB } from './DB/connection';
import { limiter } from './Utils/Middlewares/limitter.utils';
import { corsOptions } from './Utils/Middlewares/cors.utils';
import { getAssets } from './Utils/Handlers/get.assets';
import { intializeGateway } from './Modules/Gateway/gateway.main';



export const bootstrap = async() : Promise<void> => {

    await connectDB();

    const app:Express = express();
    const port:number = Number(process.env.PORT) || 3000;

    app.use(cors(corsOptions) , express.json() , helmet() , limiter , express.static(path.resolve('./src')));

    app.use("/api/v1/auth" , authRouter);
    app.use("/api/v1/user" , userRouter);
    app.use("/api/v1/post" , postRouter);

    app.get("/uploads/*path" , getAssets)

    app.use(errorHandler)

    const httpServer = app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    })

    intializeGateway(httpServer);
}