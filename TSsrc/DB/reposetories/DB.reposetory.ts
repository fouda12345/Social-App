
import { CreateOptions, HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery } from "mongoose";


export class DBReposetory<DocType> {

    constructor(protected model: Model<DocType>) { }
    async create({
        data,options={validateBeforeSave: true}
    }:{
        data:Partial<DocType>[], options?: CreateOptions | undefined
    }) : Promise<HydratedDocument<DocType>[] | undefined> {
        return await this.model.create(data,options);
    }

    async findOne({
        filter,
        select = "",
        options = {},
        populate = [],
        lean = false
    } : {
        filter?:RootFilterQuery<DocType>,
        select?:ProjectionType<DocType>,
        options?:QueryOptions<DocType>,
        populate?:PopulateOptions | []
        lean?:boolean
    }) : Promise<HydratedDocument<DocType>> {
        return await this.model.findOne(filter,options).select(select).populate(populate).lean(lean) as HydratedDocument<DocType>;
    }

    async findOneAndUpdate({
        filter,
        update,
        options = {new:true}
    } : {
        filter:RootFilterQuery<DocType>,
        update:UpdateQuery<DocType>,
        options?:QueryOptions<DocType>
    }): Promise<HydratedDocument<DocType> | null> {
        return await this.model.findOneAndUpdate(filter,update,options);
    }
}