import { customAlphabet} from "nanoid";

export const generateOtp = (size: number = 6) : string => {
    return customAlphabet('1234567890', size)();
};