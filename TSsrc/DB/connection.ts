import mongoose from "mongoose";
import chalk from "chalk";
export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(process.env.DB_URI as string , {
            serverSelectionTimeoutMS: 5000
        });
        console.log(chalk.white.bgGreen.bold("Connected to Database successfully"));
    } catch (error) {
        console.log(chalk.white.bgRedBright.bold("Error connecting to MongoDB:"));
        console.log(error);
    }
}