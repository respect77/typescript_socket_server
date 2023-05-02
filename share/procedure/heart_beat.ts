import * as flatbuffers from "flatbuffers";
import { PacketBase } from "../../packet/packet-base";
import { PacketCode } from "../../packet/packet-code";
import { UserHeartBeatClient } from "../../packet/user-heart-beat-client";
import { UserHeartBeatServer } from "../../packet/user-heart-beat-server";
import { ClientBase } from "../../context/client_context";

export async function Exec(client: ClientBase, packet_base: PacketBase) {
    //connect done 이후에 보낸다
    //todo 타이머에서 heartbeat 타임아웃 처리 필요
    //client.login_count check
    let packet: UserHeartBeatClient = packet_base.body(new UserHeartBeatClient());

    let last_seq_index = packet.lastSeqIndex();
    for (let i = client.last_confirm_send_seq_index + 1; i <= last_seq_index; ++i) {
        client.confirm_waiting_send_packet_map.delete(i);
    }
    client.last_confirm_send_seq_index = last_seq_index;

    let builder = new flatbuffers.Builder();
    let bodyOffset = UserHeartBeatServer.createUserHeartBeatServer(builder);
    let baseOffset = PacketBase.createPacketBase(builder, PacketCode.UserHeartBeatServer, bodyOffset);
    PacketBase.finishPacketBaseBuffer(builder, baseOffset);
    client.SendPacket(builder.asUint8Array());
}