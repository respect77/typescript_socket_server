
export interface ServerConfig {
    port: number;
    game_db: string
}

export enum Master2WorkerEnum {
    Init = 1,
}

export enum Worker2MasterEnum {
    WorkerCreateDone = 1,
}

export enum AccountSocialTypeEnum {
    Guest = 1,
    Google = 2,
    Apple = 3,
    Facebook = 4,
}