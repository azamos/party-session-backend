const {
  Router
} = require("express");
const router = Router();

const WsClient = require("../entities/ws-client");
const SocketEvent = require("../entities/socket-event");

let clients = {};
let se = null;
let userLikedSocketEvent;
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
    //if(msg==="is typing...").. if first time, new event.
    if (se === null) {
      se = new SocketEvent(currentClient, SocketEvent.Events.INCOMING_MSG, {
        msg
      }); //msg === "is typing..."
      Object.entries(clients).forEach(([cname, c]) => { //dispatch the new event to all connected clients.
        se.dispatch(c);
      });
    }
    if (msg != "is typing..."&&!(msg in clients)) { //means user wants to publish his post
      se.payload.msg = msg;
      //TODO: if EVENT!=USER_LOGIN than create message instance, and keep message in DB.
      Object.entries(clients).forEach(([cname, c]) => { //dispatch the new event to all connected clients.
        se.dispatch(c);
      });
      //after sending it out...
      se = null;
    }
    if(msg in clients&& msg!==currentClient.username){//means the a username was send: means it's a like

        //TODO: Oh there is so much potential in here, for example: for the post instance, keeps users who liked this post.
        //for the user instance, create att usersWhoLikeAPostImade, and trigger event to check if they are friend of user,
        //And if not, send a pop up to user to ask to add them as friends.
        if(msg!==currentClient.username){
          se.likes++;
          clients[msg].points+=10;
          console.log(se.likes);
          se.payload.msg = `${currentClient.username} liked a post made by ${msg}`;
          Object.entries(clients).forEach(([cname, c]) => { //dispatch the new event to all connected clients.
            se.dispatch(c);
          });
          se = null;
        }
    }
  });

  ws.on("close", () => {
    const userLoggedOfSE = new SocketEvent(currentClient,SocketEvent.Events.USER_DISCONNECTED);
    delete clients[currentClient.username];
    Object.entries(clients).forEach(([cname, c]) => { //dispatch the new event to all connected clients.
      userLoggedOfSE.dispatch(c);
    });
  })
});

module.exports = router;