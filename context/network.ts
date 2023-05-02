import * as net from "net";
import { Buffer } from 'buffer';
//import * as heapdump from 'heapdump';
import * as flatbuffers from 'flatbuffers';

export enum ClientState {
    NotVerify,
    Verified,
    NeedCharacter,
    Inited,
    ErrorKickOut,
    ReconnectWaiting,
    ReconnectedClose,
};

export abstract class Socket {
    send_buffer_list: Array<Uint8Array>;
    private last_send_seq_index: number;
    protected last_recv_seq_index: number;

    read_size_data: any;
    read_seq_data: any;
    private packet_size: number;

    constructor(protected socket: net.Socket, protected socket_index: number) {
        let self = this;
        this.send_buffer_list = new Array<Uint8Array>();
        this.last_send_seq_index = 0;

        this.packet_size = 0;
        this.last_recv_seq_index = 0;

        console.log(`${socket_index} Socket Connect`);

        this.socket.on('connect', () => {
            console.log('socket connect');
        });

        this.socket.on('end', function () {
            //상대방이 종료
            console.log(`socket end`);
        });

        this.socket.on('error', function (error: Error) {
            console.log(error.message);
        });

        function InnerTimeoutFunc() {
            console.log('socket timeout');
            self.socket.destroy();
        }

        function InnerCloseFunc(hadError: boolean) {
            if (hadError === true) {
                console.log('hadError');
            }
            //실제로 끊기는곳
            //self.send_buffer_list.length = 0;
            console.log(`${self.socket_index} socket close`);
            self.DisConnect();
        }

        function InnerReadExecFunc() {
            self.ReadExecFunc();
        }

        function Bind() {
            self.socket.on('timeout', InnerTimeoutFunc);
            self.socket.on('close', InnerCloseFunc);
            self.socket.on('readable', InnerReadExecFunc);
        }

        function Remove() {
            self.socket.removeListener('timeout', InnerTimeoutFunc);
            self.socket.removeListener('close', InnerCloseFunc);
            self.socket.removeListener('readable', InnerReadExecFunc);
        }

        self.BindSocketEvent = Bind;
        self.RemoveSocketEvent = Remove;

        self.BindSocketEvent();
    }

    BindSocketEvent() { }

    RemoveSocketEvent() { }

    private ReadExecFunc(refeat: boolean = false) {
        let self = this;
        if (self.packet_size === 0) {
            self.read_size_data = self.socket.read(flatbuffers.SIZE_PREFIX_LENGTH);
            if (self.read_size_data === null) {

                return;
            }

            //get packet size
            self.packet_size = self.read_size_data.readInt32LE(0);
            if (self.packet_size <= 0) {
                //error
                self.socket.destroy();
                return;
            }
        }

        if (this.last_recv_seq_index === 0) {
            this.read_seq_data = self.socket.read(4);
            if (this.read_seq_data === null) {
                return;
            }
            this.last_recv_seq_index = this.read_seq_data.readInt32LE(0);
        }

        let asdf = self.socket.read(4);

        let read_body_data = self.socket.read(self.packet_size);
        if (read_body_data === null) {
            return;
        }

        this.packet_size = 0;
        this.last_recv_seq_index = 0;

        let buf = new flatbuffers.ByteBuffer(read_body_data);

        self.RecvPacket(buf);
        setTimeout(() =>//패킷이 몰린 한 유저를 계속 처리할 수 있어서 비동기
            self.ReadExecFunc(true)
        );
    }

    Close() {
        //강제로 끊기
        this.socket.destroy();
    }

    ConnectDone() {
        const TimeoutSec = 3 * 1000;
        //todo 나중에 들어가야 함
        //this.socket.setTimeout(TimeoutSec);
    }

    abstract Connect(): void;
    abstract DisConnect(): void;
    abstract RecvPacket(buf: flatbuffers.ByteBuffer): void;

    SendPacket(send_packet: Uint8Array, reconnect: boolean = false): [number, Uint8Array] {
        let self = this;

        function intToUint8Array(i: number) {
            return Uint8Array.of(
                (i & 0x000000ff) >> 0,
                (i & 0x0000ff00) >> 8,
                (i & 0x00ff0000) >> 16,
                (i & 0xff000000) >> 24
            );
        }

        let send_packet_data = Buffer.concat([
            intToUint8Array(send_packet.length),
            intToUint8Array(++this.last_send_seq_index),
            intToUint8Array(1),
            send_packet
        ]);

        if (0 < this.send_buffer_list.length) {

            if (self.socket.destroyed === false) {
                console.log(`this.send_buffer_list.length(${this.socket_index}): ${this.send_buffer_list.length}`);
            }
            if (10000 < this.send_buffer_list.length) {
                console.log(`10000 < this.send_buffer_list.length`);
                this.Close();
            }

            this.send_buffer_list.push(send_packet_data);

            if (reconnect === true) {
                //재접속 시 재접속 알림 패킷
                Retry();
            }
            return [this.last_send_seq_index, send_packet];
        }

        let ok = self.socket.write(send_packet_data);
        if (ok === false) {
            this.send_buffer_list.push(send_packet_data);
            if (self.socket.destroyed === false) {
                self.socket.once('drain', Retry);
            }
        }
        return [this.last_send_seq_index, send_packet];

        function Retry() {
            //todo 최적화 처리가 필요
            if (0 < self.send_buffer_list.length) {
                const OnceRetryCont = 10;
                let count = 0;
                while (0 < self.send_buffer_list.length) {
                    let ok = self.socket.write(self.send_buffer_list[0]);
                    if (ok === false) {
                        if (self.socket.destroyed === false) {
                            self.socket.once('drain', Retry);
                        }
                        return;
                    }
                    self.send_buffer_list.shift();
                    ++count;
                    if (0 < self.send_buffer_list.length && OnceRetryCont <= count) {
                        setTimeout(() => Retry());
                        return;
                    }
                }
            }
            else {
                console.log(`0 < self.send_buffer_list.length`);
            }
        }
    }
};

