// automatically generated by the FlatBuffers compiler, do not modify

import * as flatbuffers from 'flatbuffers';

import { PacketErrorCode } from '../packet/packet-error-code.js';


export class UserErrorCloseServerNotify {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):UserErrorCloseServerNotify {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsUserErrorCloseServerNotify(bb:flatbuffers.ByteBuffer, obj?:UserErrorCloseServerNotify):UserErrorCloseServerNotify {
  return (obj || new UserErrorCloseServerNotify()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsUserErrorCloseServerNotify(bb:flatbuffers.ByteBuffer, obj?:UserErrorCloseServerNotify):UserErrorCloseServerNotify {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new UserErrorCloseServerNotify()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

errorCodeIndex():PacketErrorCode {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readInt8(this.bb_pos + offset) : PacketErrorCode.None;
}

static startUserErrorCloseServerNotify(builder:flatbuffers.Builder) {
  builder.startObject(1);
}

static addErrorCodeIndex(builder:flatbuffers.Builder, errorCodeIndex:PacketErrorCode) {
  builder.addFieldInt8(0, errorCodeIndex, PacketErrorCode.None);
}

static endUserErrorCloseServerNotify(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createUserErrorCloseServerNotify(builder:flatbuffers.Builder, errorCodeIndex:PacketErrorCode):flatbuffers.Offset {
  UserErrorCloseServerNotify.startUserErrorCloseServerNotify(builder);
  UserErrorCloseServerNotify.addErrorCodeIndex(builder, errorCodeIndex);
  return UserErrorCloseServerNotify.endUserErrorCloseServerNotify(builder);
}
}