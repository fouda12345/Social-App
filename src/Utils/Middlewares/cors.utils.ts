import type {CorsOptions} from 'cors';
import { AppError } from '../Handlers/error.handler';

const whitelist: string[] | undefined = (process.env.WHITELIST as string)?.split(',');
export const corsOptions : CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist?.includes(origin)) {
      callback(null, true)
    } else {
      callback(new AppError({message:'Not allowed by CORS', options:{ cause: `Origin ${origin} is not whitelisted` }, statusCode:403}));
    }
  }
}
