'use strict';

var party = require('./screenparty');  // try to offload game logic to this class
var app = require('express')();
var express = require('express');
var server = require('http').Server(app);
var io = require('socket.io')(server);
//var multer = require('multer');
var fs = require('fs');

var rooms = []; // maintain a list of rooms
var hosts = []; // maintain a list of hosts for each room

var os = require('os');
var ifaces = os.networkInterfaces();
var ipAddr;
var configFile = './html/config.json';
var config = require(configFile);


server.listen(80);
app.use('/', express.static('html/'));

console.log("starting server on port 80");

io.on('connection', function (socket) {

  console.log("incoming connection");

  if(socket.request._query.roomID) { // there was a hash, meaning a client is trying to enter a room

    var roomID = socket.request._query.roomID;
    var agent = socket.request._query.agent; // get the client's browser type (or device type hopefully);

    console.log("Client trying to join existing room", roomID, agent);
    if(rooms[roomID]) { // room exists

      console.log("room found");
      socket.join(roomID);
      hosts[roomID].emit('clientAdded', { id: socket.id });
      socket.emit('roomFound');
    }
    else {  // room doesn't exist
      console.log("room not found");
      socket.emit('roomNotFound');
    }
  }
  else {  // create a room with a random ID

    roomID = Math.floor(Math.random()*900) + 100; // add check to make sure this isn't already in rooms array
    console.log("no roomID found, creating one", roomID);
    rooms[roomID] = roomID;
    hosts[roomID] = socket;
    socket.join(roomID);
    socket.emit('roomCreated', { id: roomID, ip:ipAddr });

    console.log("room created, there are now " + Object.keys(rooms).length + " rooms.");
  }

  socket.on('disconnect', function() {

    for(var id in hosts) {

      console.log("---", hosts[id].id);
      if(hosts[id].id == socket.id) {
        console.log("the host is disconnecting");
        socket.to(rooms[id]).emit('hostLeft');
        delete rooms[id];
        break;
      }
      else {
        for (roomID in socket.adapter.rooms) break;
        console.log("a client is leaving room", roomID);
        hosts[roomID].emit('clientLeft', { id: socket.id });
      }
    }

    console.log("there are " + Object.keys(rooms).length + " rooms remaining");
  });
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
      console.log("--1");
    }
    if (alias >= 1) {
        console.log("--2");

    } else {
        console.log("--3");
      // this interface has only one ipv4 adress
      //console.log(ifname, iface.address);
      ipAddr = iface.address;
      console.log(config);
      config.network.ip = ipAddr;

      fs.writeFile(configFile, JSON.stringify(config, null, 2), function(e) { // can probably delete 'e'

        console.log("updated config file with IP address");
      });

    }
    ++alias;
  });
});
