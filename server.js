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

    var _roomID = socket.request._query.roomID;
    var _agent = socket.request._query.agent; // get the client's browser type (or device type hopefully);
    var _width = socket.request._query.width;
    var _height = socket.request._query.height;
    var _orientation = socket.request._query.orientation;

    console.log("Client trying to join existing room", _roomID, _agent, _width, _height, _orientation);
    if(rooms[_roomID]) { // room exists

      console.log("room found");
      socket.join(_roomID);
      hosts[_roomID].emit('clientAdded',
      {
          id: socket.id,
          agent:_agent,
          width:_width,
          height:_height,
          orientation:_orientation
      });
      socket.emit('roomFound');
      socket.on('motion', screenMoved);
    }
    else {  // room doesn't exist
      console.log("room not found");
      socket.emit('roomNotFound');
    }
  }
  else {  // create a room with a random ID

    _roomID = Math.floor(Math.random()*900) + 100; // add check to make sure this isn't already in rooms array
    console.log("no roomID found, creating one", _roomID);
    rooms[_roomID] = _roomID;
    hosts[_roomID] = socket;
    socket.join(_roomID);
    socket.emit('roomCreated', { id: _roomID, ip:ipAddr });

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
        for (_roomID in socket.adapter.rooms) break;
        console.log("a client is leaving room", _roomID);
        hosts[_roomID].emit('clientLeft', { id: socket.id });
      }
    }
    console.log("there are " + Object.keys(rooms).length + " rooms remaining");
  });
});



function screenMoved(data) {
    // tell the host to move the screen
    hosts[data.room].emit('screenMoved', data);
}


function createParty(data) {
  console.log("client asked to start a new party", data);
}


Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;
  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      return;
    }
    if (alias >= 1) {

    } else {
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
