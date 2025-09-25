"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBReposetory = void 0;
class DBReposetory {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options = { validateBeforeSave: true } }) {
        return await this.model.create(data, options);
    }
    async findOne({ filter, select = "", options = {}, populate = [], lean = false }) {
        return await this.model.findOne(filter, options).select(select).populate(populate).lean(lean);
    }
    async findOneAndUpdate({ filter, update = { $inc: { __v: 1 } }, options = { new: true } }) {
        return await this.model.findOneAndUpdate(filter, update, options);
    }
}
exports.DBReposetory = DBReposetory;
