const MD5 = require('md5');
const ZERO = 0;
class SocketEvent {
  constructor(client, type, payload) {//in case of usermsg: payload = msg in string.
    this.client = client;
    this.type = type;
    this.payload = payload;
    this.timestamp = Date.now();
    this.id = MD5(this.timestamp);
    this.likes = ZERO;
  }

  get data() {
    return {
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      client: this.client.user.username,
      id: this.id,
      likes: this.likes
    };
  }

  async dispatch(toClient) {
    toClient = toClient ? toClient : this.client;
    toClient.ws.send(JSON.stringify(this.data));//this.data = {type,payload,timestamp,client}
  }

  static fire(type, payload, client, toClient) {
    const e = new SocketEvent(client, type, payload);
    e.dispatch(toClient || client);
  }
}

SocketEvent.Events = Object.freeze({
  USER_ONLINE: "USER_ONLINE",
  INCOMING_MSG: "INCOMING_MSG",
  USER_DISCONNECTED: "USER_DISCONNECTED",
  USER_LIKED_POST: "USER_LIKED_POST"
});

module.exports = SocketEvent;