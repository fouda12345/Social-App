"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.userShema = exports.GenderEnum = exports.RoleEnum = void 0;
const mongoose_1 = require("mongoose");
const hash_utils_1 = require("../../Utils/Security/hash.utils");
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["USER"] = "USER";
    RoleEnum["ADMIN"] = "ADMIN";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["MALE"] = "MALE";
    GenderEnum["FEMALE"] = "FEMALE";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
exports.userShema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 25
    },
    middleName: {
        type: String,
        trim: true,
        minLength: 3,
        maxLength: 25
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 25
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    emailOTP: {
        otp: String,
        createdAt: Date
    },
    confirmedEmail: Date,
    password: {
        type: String,
        required: true,
    },
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
exports.userShema.pre('save', async function (next) {
    if (this.isModified('password'))
        this.password = await (0, hash_utils_1.generateHash)({ data: this.password });
    if (this.isModified('emailOTP'))
        this.emailOTP.otp = await (0, hash_utils_1.generateHash)({ data: this.emailOTP.otp });
    next();
});
exports.userShema.virtual('fullName').set(function (fullName) {
    const names = fullName.split(' ');
    const [firstName, middleName, lastName] = names.length === 3 ? names :
        [names[0], undefined, names[1]];
    this.set({
        firstName,
        middleName,
        lastName
    });
}).get(function () {
    return `${this.firstName + " "}${this.middleName ? this.middleName + " " : ""}${this.lastName}`;
});
exports.userModel = mongoose_1.models.User || (0, mongoose_1.model)('User', exports.userShema);
