// automatically generated by the FlatBuffers compiler, do not modify

import { UserErrorCloseServerNotify } from '../packet/user-error-close-server-notify.js';
import { UserHeartBeatClient } from '../packet/user-heart-beat-client.js';
import { UserHeartBeatServer } from '../packet/user-heart-beat-server.js';


export enum PacketCode {
  NONE = 0,
  UserHeartBeatClient = 1,
  UserHeartBeatServer = 2,
  UserErrorCloseServerNotify = 3
}

export function unionToPacketCode(
  type: PacketCode,
  accessor: (obj:UserErrorCloseServerNotify|UserHeartBeatClient|UserHeartBeatServer) => UserErrorCloseServerNotify|UserHeartBeatClient|UserHeartBeatServer|null
): UserErrorCloseServerNotify|UserHeartBeatClient|UserHeartBeatServer|null {
  switch(PacketCode[type]) {
    case 'NONE': return null; 
    case 'UserHeartBeatClient': return accessor(new UserHeartBeatClient())! as UserHeartBeatClient;
    case 'UserHeartBeatServer': return accessor(new UserHeartBeatServer())! as UserHeartBeatServer;
    case 'UserErrorCloseServerNotify': return accessor(new UserErrorCloseServerNotify())! as UserErrorCloseServerNotify;
    default: return null;
  }
}

export function unionListToPacketCode(
  type: PacketCode, 
  accessor: (index: number, obj:UserErrorCloseServerNotify|UserHeartBeatClient|UserHeartBeatServer) => UserErrorCloseServerNotify|UserHeartBeatClient|UserHeartBeatServer|null, 
  index: number
): UserErrorCloseServerNotify|UserHeartBeatClient|UserHeartBeatServer|null {
  switch(PacketCode[type]) {
    case 'NONE': return null; 
    case 'UserHeartBeatClient': return accessor(index, new UserHeartBeatClient())! as UserHeartBeatClient;
    case 'UserHeartBeatServer': return accessor(index, new UserHeartBeatServer())! as UserHeartBeatServer;
    case 'UserErrorCloseServerNotify': return accessor(index, new UserErrorCloseServerNotify())! as UserErrorCloseServerNotify;
    default: return null;
  }
}