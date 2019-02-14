const {
  Router
} = require("express");
const router = Router();

const WsClient = require("../entities/ws-client");
const SocketEvent = require("../entities/socket-event");

let clients = {};
let se = null;
const getConnected = () => Object.entries(clients).map(([cn, c]) => c.user.username); //clients ={username: user}...
router.ws("/party", function (ws, req) {
  //TODO: What if is the user already connected?(in same or another tab/window/device)
  //no need to press subscribe again, 'cause allready signed in.

  //WsClient - simple Type to keep who the user who made the req is, and the connection/webSocket(ws)
  //between him and the server
  const currentClient = new WsClient(req.currentUser, ws);

  clients[currentClient.username] = currentClient;
  const se1 = new SocketEvent(currentClient, SocketEvent.Events.USER_ONLINE, {
    connected: getConnected()
  });

  //tell everybody that a user is now logged in
  Object.entries(clients).forEach(([cname, c]) => {
    se1.dispatch(c);
  });

  ws.on("message", function (msg) { //on recieving message from client

    //SocketEvent: recievs (client, type, payload) as constuctur args,
    //and can: (1) return who is the client who triggered the event and so forth.
    //(2)dispatch an event to another client(if specified in func dispatch)
    //or to the client who triggered the event himself.
    //(3)fire- create a new socketEvent who will be able to do these same things.
    //(type, payload, client, toClient)- are the args.
    //the func will dispatch an event to the client if defined, else to toClient.
    //if(msg==="is typing...").. if first time, new event.
    if (se === null) {
      se = new SocketEvent(currentClient, SocketEvent.Events.INCOMING_MSG, {
        msg
      }); //msg === "is typing..."
      Object.entries(clients).forEach(([cname, c]) => { //dispatch the new event to all connected clients.
        se.dispatch(c);
      });
    }
    if (msg != "is typing...") { //means user wants to publish his post
      se.payload.msg = msg;
      Object.entries(clients).forEach(([cname, c]) => { //dispatch the new event to all connected clients.
        se.dispatch(c);
      });
      //after sending it out...
      se = null;
    }
  });

  //TODO: add showing this to the connected clients
  ws.on("close", () => {
    delete clients[currentClient.username]
  })
});

module.exports = router;