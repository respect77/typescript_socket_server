//import { readFileSync } from 'fs';

import { MongoClient, Db, Collection } from 'mongodb'
import * as utils from '../util/utils';
//import { ServerTypeEnum } from '../packet/server-type-enum';
//import { GetCurrentDateMSec, GetRandomValue } from './functions';
//import { ConnectServerInfo, TcpServerWithClientBase } from './types';

export class SelectParam {
    query: any;
    projection: any;

    constructor() {
        this.query = {};
        this.projection = {};
    }

    Query(key: string, value: any): SelectParam {
        if (this.query[key] !== undefined) {
            console.log(`this.query["${key}"] !== undefined`);
        }
        this.query[key] = value;
        return this;
    }

    GetQuery(): any {
        return this.query;
    }

    Select(key: string): SelectParam {
        this.projection[key] = 1;
        return this;
    }

    GetProjection(): any {
        return { projection: this.projection };
    }
}

export class UpdateParam {
    query: any;
    update_set: any;
    update_inc: any;
    update_push: any;
    update_unset: any;
    update_list: Set<string>;

    constructor() {
        this.query = {};
        this.update_set = {};
        this.update_inc = {};
        this.update_push = {};
        this.update_unset = {};
        this.update_list = new Set<string>;
    }

    Set(key: string, value: any): UpdateParam {
        if (this.update_list.has(key)) {
            console.log(`this.update_list[${key}] !== undefined`);
        }

        if (this.update_set[key] !== undefined) {
            console.log(`exists`)
        }

        this.update_set[key] = value;
        this.update_list.add(key);
        return this;
    }

    Inc(key: string, value: number = 1): UpdateParam {
        if (this.update_list.has(key)) {
            console.log(`this.update_list[${key}] !== undefined`);
        }

        if (this.update_inc[key] !== undefined) {
            console.log(`exists`)
        }

        this.update_inc[key] = value;
        this.update_list.add(key);
        return this;
    }

    Append(key: string, value: any): UpdateParam {
        if (this.update_list.has(key)) {
            console.log(`this.update_list[${key}] !== undefined`);
        }

        if (this.update_push[key] !== undefined) {
            console.log(`exists`)
        }

        this.update_push[key] = value;
        this.update_list.add(key);
        return this;
    }

    Remove(key: string): UpdateParam {
        if (this.update_list.has(key)) {
            console.log(`this.update_list[${key}] !== undefined`);
        }

        if (this.update_unset[key] !== undefined) {
            console.log(`exists`)
        }

        this.update_unset[key] = 1;
        this.update_list.add(key);
        return this;
    }

    Query(key: string, value: any): UpdateParam {
        if (this.query[key] !== undefined) {
            console.log(`this.query["${key}"] !== undefined`);
        }
        this.query[key] = value;
        return this;
    }

    GetQuery(): any {
        return this.query;
    }

    GetUpdate(): any {
        let update_map = {} as any;

        if (this.update_set.size != 0) {
            update_map["$set"] = this.update_set;
        }
        if (this.update_inc.size != 0) {
            update_map["$inc"] = this.update_inc;
        }
        if (this.update_push.size != 0) {
            update_map["$push"] = this.update_push;
        }
        if (this.update_unset.size != 0) {
            update_map["$unset"] = this.update_unset;
        }
        return update_map;
    }
}

export class MongodbModule {
    readonly SchedulerSec = 5;
    database!: Db;
    collection: Map<string, Collection>

    //server: TcpServerWithClientBase;

    constructor() {
        this.collection = new Map<string, Collection>();
    }

    async Connect(conn_uri: string): Promise<boolean> {
        let mongodb_options = {
        };
        /*
                mongodb_options = {
                    tlsCAFile: `config/debug/rds-combined-ca-bundle.pem`
                }
        */
        let reconnect_count = 5;

        while (true) {
            try {
                var mongodb = await MongoClient.connect(conn_uri, mongodb_options);
                break;
            }
            catch (error) {
                console.log(JSON.stringify(error));
                --reconnect_count;
                if (reconnect_count <= 0) {
                    return false;
                }
                utils.Sleep(1000)
            }
        }

        this.database = mongodb.db(`game`);

        this.collection.set("user_info", this.database.collection("user_info"));

        console.log(`mongodb connect done`);

        {
            let select_param = new SelectParam();
            select_param.Query("user_index", 1);
            select_param.Select("name");

            try {
                let result = await this.SelectOne(select_param);
            }
            catch (err) {
                console.log(err)
            }
        }

        {
            let update_param = new UpdateParam();
            update_param.Query("user_index", 1);
            update_param.Set("name", "1234")

            try {
                let result = await this.UpdateOne(update_param);
            }
            catch (err) {
                console.log(err)
            }
        }
        return true;
    }

    async UpdateOne(param: UpdateParam): Promise<boolean> {
        try {
            const result = await this.collection.get("user_info")!.updateOne(
                param.GetQuery(),
                param.GetUpdate()
            );
            return result.modifiedCount === 1;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }

    async SelectOne(param: SelectParam) {
        try {
            const result = await this.collection.get("user_info")!.findOne(
                param.GetQuery(),
                param.GetProjection()
            );
            if (result === null) {
                console.log(`result === null`);
                return undefined;
            }
            return result;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }

};

//db.getCollection('servers_info').createIndex({"server_type" : 1, "channel_index" : 1}, {unique : true})
