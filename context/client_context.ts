import * as net from "net";
import * as flatbuffers from "flatbuffers";

import { PacketBase } from "../packet/packet-base";
import { ClientState, Socket } from "./network";
import { PacketErrorCode } from "../packet/packet-error-code";
import { UserErrorCloseServerNotify } from "../packet/user-error-close-server-notify";
import { PacketCode } from "../packet/packet-code";
import { TcpServerWithClientBase } from "./server_context";
import { GetCurrentDateMSec } from "../util/utils";

export type Proc = (client: ClientBase, packet_base: PacketBase) => Promise<void>;

export abstract class ClientBase extends Socket {
    server: TcpServerWithClientBase;
    user_index: number;
    packet_executing: boolean;
    recv_waiting_packet_list: Array<PacketBase>;
    client_state: ClientState;

    observer_user_list: Array<number>;

    access_token: string;
    last_confirm_send_seq_index: number;
    confirm_waiting_send_packet_map: Map<number, Uint8Array>;

    constructor(socket: net.Socket, socket_index: number, server: TcpServerWithClientBase) {
        super(socket, socket_index);

        const TimeoutSec = 600 * 1000;
        socket.setTimeout(TimeoutSec);

        this.server = server;

        this.user_index = 0;

        this.packet_executing = false;
        this.recv_waiting_packet_list = new Array<PacketBase>();
        this.client_state = ClientState.NotVerify;

        this.observer_user_list = new Array<number>();

        this.access_token = '';
        this.last_confirm_send_seq_index = 0;
        this.confirm_waiting_send_packet_map = new Map<number, Uint8Array>();

        this.Connect();
    }

    RecvPacket(buf: flatbuffers.ByteBuffer) {
        let packet_base = PacketBase.getRootAsPacketBase(buf);

        if (this.packet_executing === true) {
            console.log(`this.packet_executing === true`)
            this.recv_waiting_packet_list.push(packet_base);

            return;
        }

        this.server.PacketExec(this, packet_base);
    }
    SendPacket(send_packet: Uint8Array, reconnect: boolean = false): [number, Uint8Array] {
        let result_info = super.SendPacket(send_packet, reconnect);
        if (reconnect === false) {
            this.confirm_waiting_send_packet_map.set(result_info[0], result_info[1]);
        }
        return result_info;
    }

    SocketChange(new_client: ClientBase) {
        new_client.RemoveSocketEvent();
        this.RemoveSocketEvent();

        [this.socket, new_client.socket] = [new_client.socket, this.socket];
        this.last_recv_seq_index = 0;

        this.BindSocketEvent();

        this.client_state = ClientState.Inited;
        new_client.client_state = ClientState.ReconnectedClose;
        new_client.socket.destroy();
    }

    ErrorKickOut(error_code: number = PacketErrorCode.None) {
        let builder = new flatbuffers.Builder();
        let bodyOffset = UserErrorCloseServerNotify.createUserErrorCloseServerNotify(builder, error_code);
        let baseOffset = PacketBase.createPacketBase(builder, PacketCode.UserErrorCloseServerNotify, bodyOffset);
        PacketBase.finishPacketBaseBuffer(builder, baseOffset);
        this.SendPacket(builder.asUint8Array());

        this.client_state = ClientState.ErrorKickOut;
        let self = this;
        console.log(`ErrorKickOut: user_index: ${this.user_index} error_code: ${PacketErrorCode[error_code]}`)
        setTimeout(() => self.Close(), 1000 * 30);
    }

    //todo 여기서 끊겼을 때 재접속을 위한 처리를 해 두어야 한다

    Connect(): void {
        //InitExec.Exec(this, new PacketBase());
    }

    //소켓이 끊겼을 때
    DisConnect(): void {

        if (this.client_state === ClientState.ReconnectedClose) {
            //이미 종료된 소켓이라 이곳에 들어올 수 없음
            console.log(`this.client_state === ClientState.ReconnectedClose(${this.user_index})`);
            return;
        }

        //todo 디비 저장은?
        //server.DisConnectClient 여기서 처리되는건 일단 없음
        this.server.DisConnectClient(this);

        if (this.client_state === ClientState.Inited) {
            //실제로 나간게 아닌 재접속 대기중 상태 : 소켓은 끊겼지만 클라는 있다
            this.client_state = ClientState.ReconnectWaiting;

            this.server.client_reconnect_waiting_map.set(this.access_token, [GetCurrentDateMSec() + (30 * 1000), this]);
        }
        else {
            //내보낸다?
            this.server.UnInit(this);
        }

        console.log(`DisConnect: ${this.user_index}`);
    }
}

