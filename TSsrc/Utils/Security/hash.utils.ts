import bcrypt from 'bcrypt'

export const generateHash = async ({
    data,
    saltRound = Number(process.env.SALT_ROUND)
} : {
    data: string,
    saltRound?: number
}) : Promise<string> => {
    return await bcrypt.hash(data, saltRound);
}

export const compareHash = async ({
    data,
    hash
} : {
    data: string,
    hash: string    
}) : Promise<boolean> => {
    return await bcrypt.compare(data, hash);
}