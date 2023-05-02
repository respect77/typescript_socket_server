import * as net from "net";

import { ServerTypeEnum } from "../packet/server-type-enum";
import { MySqlModule } from "../util/mysql_modules";
import { PacketCode } from "../packet/packet-code";
import { ClientBase, Proc } from "./client_context";
import { PacketBase } from "../packet/packet-base";
import { FileReadJson, GetCurrentDateMSec, Sleep } from "../util/utils";

//서버용
export abstract class TcpServer {
    //readonly SchedulerSec = 10;
    server_type: ServerTypeEnum;
    net_server!: net.Server;
    last_socket_index: number;

    channel_index: number;

    constructor(server_type: ServerTypeEnum) {
        this.server_type = server_type;

        this.last_socket_index = 1;
        this.channel_index = 0;
/*
        process.on('SIGUSR2', () => {
            heapdump.writeSnapshot(function(err, filename) {
                console.log('dump written to', filename);
            });
        });*/
    }

    async Init(config: any) {
        this.channel_index = config.channel_index;
    }

    Listen(port: number) {
        let self = this;
        this.net_server = net.createServer((socket) => {
            const socket_index = self.last_socket_index++;
            self.ConnectClient(socket, socket_index);
        });

        this.net_server.on('error', function (err) {
            console.log('err' + err);
        });

        this.net_server.listen(port, () => {
            console.log(`ServerListen Start`);
        });

        this.ScheduleExec();
    }

    abstract ConnectClient(socket: net.Socket, socket_index: number): void;

    abstract ScheduleExec(): void;

};


export abstract class TcpServerWithClientBase extends TcpServer {
    ip!: string;
    port!: number;

    account_db: MySqlModule;
    game_db: MySqlModule;
    proc_mapping_map: Map<PacketCode, Proc>;

    //접속 유저들
    client_map: Map<number/*user_index*/, ClientBase>;
    //close 되어 일정기간 동안 재접속을 기다린다
    client_reconnect_waiting_map: Map<string/*access_token*/, [expired_date: number, client: ClientBase]>;

    constructor(server_type: ServerTypeEnum) {
        super(server_type);

        this.account_db = new MySqlModule();
        this.game_db = new MySqlModule();
        
        this.proc_mapping_map = new Map<PacketCode, Proc>();

        this.client_map = new Map<number, ClientBase>();
        this.client_reconnect_waiting_map = new Map<string, [number, ClientBase]>();

        //전서버 공통 패킷처리
        this.proc_mapping_map.set(PacketCode.UserHeartBeatClient, require('./procedure/heart_beat').Exec);
    }

    async Init(config: any) {
        super.Init(config);

        this.ip = config.ip;
        this.port = config.port;

        const database_config_path = config["database_config_path"];
        let database_config = await FileReadJson(database_config_path);

        let account_db_connect_result = await this.account_db.Connect(database_config.account_db);
        if (account_db_connect_result === false) {
            console.log(`account_db_connect_result === false`);
            process.exit(0);
        }

        let game_connect_result = await this.game_db.Connect(database_config.game_db);
        if (game_connect_result === false) {
            console.log(`game_connect_result === false`);
            process.exit(0);
        }
    }

    async PacketExec(client: ClientBase, packet_base: PacketBase) {
        //todo 로그인(유효성) 유무에 따른 검증코드 필요함
        const packet_code: PacketCode = packet_base.bodyType();

        let Proc = this.proc_mapping_map.get(packet_code);
        if (Proc === undefined) {
            console.log(`Proc === undefined(packet_code)(${PacketCode[packet_code]})`);
            client.ErrorKickOut();
            return;
        }

        client.packet_executing = true;
        try {
            await Proc(client, packet_base);
        }
        catch (err) {
            console.log(`Proc error : ${err}[${client.user_index}][${PacketCode[packet_code]}]`);
        }

        if (0 < client.recv_waiting_packet_list.length) {
            let waiting_packet = client.recv_waiting_packet_list.shift()!;
            let self = this;

            //setTimeout(() => self.PacketExec(client, waiting_packet));
            self.PacketExec(client, waiting_packet);
            return;
        }
        client.packet_executing = false;
        //
        //todo
        /*
        거래의 경우
        if(executing === true) { Retry }
        executing = true;
        Exec
        executing = false;
        */
    }

    UserMultiCast(client: ClientBase, packet: Uint8Array): void {
        for (let user_index of client.observer_user_list) {
            let client = this.client_map.get(user_index);
            if (client !== undefined) {
                client.SendPacket(packet);
            }
            else {
                console.log(`client !== undefined`);
            }
        }
    }

    BroadCast(packet: Uint8Array): void {
        [...this.client_map.values()].forEach(client => client.SendPacket(packet));
    }

    MultiCast(target_list: Array<number>, packet: Uint8Array): void {
        for (let user_index of target_list) {
            let client = this.client_map.get(user_index);
            if (client !== undefined) {
                client.SendPacket(packet);
            }
        }
    }

    abstract DisConnectClient(client: ClientBase): void;
    abstract UnInit(client: ClientBase): void;

    //전 서버 공통 스케줄링
    ScheduleExec() {
        //재접속 대기
        this.ReconnectWaitingSchedule();
        this.HeartBeatSchedule();
    }

    private async ReconnectWaitingSchedule() {
        const SchedulerSec = 10;
        while (true) {
            let current_date = GetCurrentDateMSec();

            //이미 소켓은 끊겨 있는 애들
            this.client_reconnect_waiting_map.forEach((value, key, map) => {
                if (value[0] < current_date) {
                    this.UnInit(value[1]);
                    console.log(`client_reconnect_waiting_map UnInit`);
                    map.delete(key);
                }
            });
            await Sleep(SchedulerSec * 1000);
        }
    }
    
    private async HeartBeatSchedule() {
        const SchedulerSec = 5;
        while (true) {
            try {
                let query_result = await this.account_db.ProcedurePromise(
                    `call sp_server_heart_beat(?, ?, ?)`,
                    [this.server_type, this.channel_index, this.client_map.size]
                );
                if(query_result.error !== undefined) {
                    console.log(`HeartBeat error: ${query_result.error}`);
                }
                //todo 이곳에서 각종 갱신 정보를 받아와야 할듯
            }
            catch(error) {
                console.log(`HeartBeatSchedule: ${error}`);
            }
            finally {
                await Sleep(SchedulerSec * 1000);
            }
            //Log.info(`HeartBeatSchedule`);
        }
    }

}
