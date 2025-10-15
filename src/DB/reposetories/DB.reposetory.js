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
    async paginate({ filter = {}, select = "", options = {}, populate = [], lean = false, sort = "", page = 10, limit = 10 }) {
        if (Math.floor(page) !== page || page < 1)
            page = 1;
        if (Math.floor(limit) !== limit || limit < 1)
            limit = 10;
        let skip = (page - 1) * limit;
        if (Math.floor(skip) !== skip || skip < 0) {
            skip = 0;
            page = 1;
        }
        const docsCount = await this.model.countDocuments(filter);
        const NumberOfPages = Math.ceil(docsCount / limit);
        const results = await this.model.find(filter, options).select(select).populate(populate).lean(lean)
            .sort(sort).skip(skip).limit(limit);
        return {
            docsCount,
            NumberOfPages,
            currentPage: page,
            limit,
            results
        };
    }
    async find({ filter = {}, select = "", options = {}, populate = [], lean = false, sort = "-createdAt", }) {
        return await this.model.find(filter, options).select(select).populate(populate).lean(lean)
            .sort(sort);
    }
    async findOneAndUpdate({ filter, update = {}, options = {} }) {
        return await this.model.findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, { ...options, runValidators: true, new: true });
    }
    async updateOne({ filter, update = {}, options = {} }) {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: {
                        $add: ["$__v", 1]
                    }
                }
            });
        }
        else {
            update = { ...update, $inc: { __v: 1 } };
        }
        return await this.model.updateOne(filter, update, { ...options, runValidators: true });
    }
    async aggregate({ pipeline, options }) {
        return await this.model.aggregate(pipeline, options);
    }
    async deleteOne({ filter }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter }) {
        return await this.model.deleteMany(filter);
    }
}
exports.DBReposetory = DBReposetory;
