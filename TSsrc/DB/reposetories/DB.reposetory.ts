
import { CreateOptions, HydratedDocument, Model, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery } from "mongoose";


export class DBReposetory<DocType> {

    constructor(protected readonly model: Model<DocType>) { }
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
    }) : Promise<HydratedDocument<DocType>| null | any>{
        return await this.model.findOne(filter,options).select(select).populate(populate).lean<DocType>(lean);
    }

    async find({
        filter = {},
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
    }) : Promise<HydratedDocument<DocType>[] | [] | any>{
        return await this.model.find(filter,options).select(select).populate(populate).lean<DocType[]>(lean);
    }
        

    async findOneAndUpdate({
        filter,
        update = {},
        options = {}
    } : {
        filter:RootFilterQuery<DocType>,
        update:UpdateQuery<DocType>,
        options?:QueryOptions<DocType>
    }): Promise<HydratedDocument<DocType> | null> {
        return await this.model.findOneAndUpdate(filter,{...update,$inc:{__v:1}},{...options,runValidators:true,new:true});
    }
}