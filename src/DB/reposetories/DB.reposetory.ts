import { Aggregate, CreateOptions, DeleteResult, HydratedDocument, Model, MongooseUpdateQueryOptions, PipelineStage, PopulateOptions, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWithAggregationPipeline, UpdateWriteOpResult } from "mongoose";
import { AggregateOptions } from "node:sqlite";


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
    }) : Promise<HydratedDocument<DocType>| null | DocType>{
        return await this.model.findOne(filter,options).select(select).populate(populate).lean<DocType>(lean);
    }

    async paginate({
        filter = {},
        select = "",
        options = {},
        populate = [],
        lean = false,
        sort = "",
        page = 10,
        limit = 10
    } : {
        filter?:RootFilterQuery<DocType>,
        select?:ProjectionType<DocType>,
        options?:QueryOptions<DocType>,
        populate?:PopulateOptions | [],
        lean?:boolean,
        sort?: string,
        page?: number,
        limit?: number
    }) : Promise<{
        docsCount: number,
        NumberOfPages: number,
        currentPage: number,
        limit: number,
        results: HydratedDocument<DocType>[] | [] | DocType[]
    }> {
        if (Math.floor(page) !== page || page < 1) page = 1
        if (Math.floor(limit) !== limit || limit < 1) limit = 10
        let skip = (page - 1) * limit
        if (Math.floor(skip) !== skip || skip < 0) {
            skip = 0
            page = 1
        }
        const docsCount = await this.model.countDocuments(filter)
        const NumberOfPages = Math.ceil(docsCount / limit)
        const results = await this.model.find(filter,options).select(select).populate(populate).lean<DocType[]>(lean)
        .sort(sort).skip(skip).limit(limit);
        return {
            docsCount,
            NumberOfPages,
            currentPage : page,
            limit,
            results
        }
    }

    async find({
        filter = {},
        select = "",
        options = {},
        populate = [],
        lean = false,
        sort = "-createdAt",
    } : {
        filter?:RootFilterQuery<DocType>,
        select?:ProjectionType<DocType>,
        options?:QueryOptions<DocType>,
        populate?:PopulateOptions | [],
        lean?:boolean,
        sort?: string,
    }) : Promise<HydratedDocument<DocType>[] | [] | DocType[]> {
        return await this.model.find(filter,options).select(select).populate(populate).lean<DocType[]>(lean)
        .sort(sort);
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

    async updateOne({
        filter,
        update = {},
        options = {}
    } : {
        filter:RootFilterQuery<DocType>,
        update:UpdateQuery<DocType> | UpdateWithAggregationPipeline,
        options?:MongooseUpdateQueryOptions
    }): Promise<UpdateWriteOpResult> {
       if (Array.isArray(update)){
        update.push({
            $set:{
                __v:{
                    $add:["$__v",1]
                }
            }
        })
       } else {
        update = {...update,$inc:{__v:1}}
       }
        return await this.model.updateOne(filter,update,{...options,runValidators:true});
    }
    async aggregate({
        pipeline,
        options
    }:{
        pipeline:PipelineStage[],
        options?:AggregateOptions
    }) : Promise<Aggregate<DocType[]>> {
        return await this.model.aggregate<DocType>(pipeline , options);
    }

    async deleteOne({
        filter
    } : {
        filter:RootFilterQuery<DocType>
    }) : Promise<DeleteResult> {
        return await this.model.deleteOne(filter);
    }

    async deleteMany({
        filter
    } : {
        filter:RootFilterQuery<DocType>
    }) : Promise<DeleteResult> {
        return await this.model.deleteMany(filter);
    }

    async findOneAndDelete({
        filter
    } : {
        filter:RootFilterQuery<DocType>
    }) : Promise<HydratedDocument<DocType> | null> {
        return await this.model.findOneAndDelete(filter);
    }
}