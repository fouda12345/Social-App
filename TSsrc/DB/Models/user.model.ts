import { HydratedDocument, model , models, Schema, Types } from "mongoose";
import { generateHash } from "../../Utils/Security/hash.utils";

export enum RoleEnum {
    USER = "USER",
    ADMIN = "ADMIN"
}
export enum GenderEnum {
    MALE = "MALE",
    FEMALE = "FEMALE"
}
export interface IUser {
    _id: Types.ObjectId;
    fullName?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    emailOTP : {
        otp : string
        createdAt : Date
    };
    confirmedEmail: Date;
    password: string;
    passwordOTP : {
        otp : string
        createdAt : Date
    },
    oldPasswords : string[]
    role?: RoleEnum;
    gender?: GenderEnum;
    phone?: string
    credentailsUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export const userShema = new Schema<IUser>({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minLength:3,
        maxLength:25
    },
    middleName: {
        type: String,
        trim: true,
        minLength:3,
        maxLength:25
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minLength:3,
        maxLength:25
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    emailOTP : {
        otp : String,
        createdAt : Date
    },
    confirmedEmail: Date,
    password: {
        type: String,
        required: true,
    },
    passwordOTP : {
        otp : String,
        createdAt : Date
    },
    oldPasswords : [String],
    role: {
        type: String,
        enum: RoleEnum,
        default: RoleEnum.USER
    },
    gender: {
        type: String,
        enum: GenderEnum,
        default: GenderEnum.MALE
    },
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    credentailsUpdatedAt: Date
},
{
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

userShema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.oldPasswords.push(this.password);
        this.password = await generateHash({data:this.password})
    }
    if (this.isModified('emailOTP')) this.emailOTP.otp = await generateHash({data:this.emailOTP.otp});
    if (this.isModified('passwordOTP')) this.passwordOTP.otp = await generateHash({data:this.passwordOTP.otp});
    next();
});

userShema.virtual('fullName').set(function (fullName:string) { 
    const names = fullName.split(' ');
    const [firstName, middleName, lastName] = names.length === 3 ? names :
    [names[0], undefined, names[1]]
    this.set({
        firstName,
        middleName,
        lastName
    })
}).get(function () {
    return `${this.firstName + " "}${this.middleName? this.middleName + " " : ""}${this.lastName}`;
});

export const userModel = models.User || model<IUser>('User', userShema);
export type HUserDocument = HydratedDocument<IUser>;