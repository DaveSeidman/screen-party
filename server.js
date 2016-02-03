'use strict';


var party = require('./screenparty');  // try to offload game logic to this class
var app = require('express')();
var express = require('express');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var multer = require('multer');

var rooms = [];


var os = require('os');
var ifaces = os.networkInterfaces();
var ipAddr;


server.listen(80);
app.use('/', express.static('html/'));

console.log("starting server on port 80");

io.on('connection', function (socket) {

  console.log("incoming connection");

  if(socket.request._query.partyID) { // client trying to enter a room

    var roomID = socket.request._query.partyID;
    var agent = socket.request._query.agent;
    console.log("Client trying to join existing room", agent);
    if(rooms[roomID]) { // room exists

      console.log("room exists");
      socket.join(roomID);
      io.to(roomID).emit('clientAdded', { id: socket.id });
      socket.emit('messageForScreen', { id: roomID });

    }
    else {  // room doesn't exist
      console.log("no such room");
    }
  }
  else {  // create a random room

    console.log("no roomID found, create one");
    roomID = Math.floor(Math.random()*900) + 100;
    rooms[roomID] = roomID;
    socket.join(roomID);
    socket.emit('messageForHost', { id: roomID, ip:ipAddr });
  }

  socket.on('startParty', createParty);
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });


});


function createParty(data) {
  console.log("client asked to start a new party", data);
}





Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {

    } else {
      // this interface has only one ipv4 adress
      //console.log(ifname, iface.address);
      ipAddr = iface.address;
    }
    ++alias;
  });
});
