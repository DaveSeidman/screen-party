// todo, maybe maintain a list of screens as well,
// we kind of have an array of sockets per room but it
// might be more efficient (wouldn't need to loop and find by id)
// to store arrays of screens inside of rooms array


// ssh -i freelunchkey.pem ec2-user@54.191.185.110

// color scheme:
//   gray = server only
//   cyan = host
//   green = client

'use strict';

var party = require('./screenparty');  // try to offload game logic to this class
var app = require('express')();
var express = require('express');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var colors = require('colors');
var updateConfig = require('updateConfig');

var rooms = []; // maintain a list of rooms
var hosts = []; // maintain a list of hosts for each room


server.listen(80);
app.use('/', express.static('html/'));

console.log(colors.gray("starting server on port 80"));

io.on('connection', function (socket) {

    console.log(colors.gray("incoming connection", socket.id));

    if(socket.request._query.roomID) { // --- CLIENT --- there was a hash, meaning a client is trying to enter a room

        var _roomID = socket.request._query.roomID;
        var _agent = socket.request._query.agent; // get the client's browser type (or device type hopefully);
        var _width = socket.request._query.width;
        var _height = socket.request._query.height;
        var _orientation = socket.request._query.orientation;

        console.log(colors.green("client trying to join existing room", _roomID));
        console.log(colors.green("-- screen resolution:", _width, "x", _height));
        console.log(colors.green("-- user agent:", _agent));

        if(rooms[_roomID]) { // room exists

            console.log(colors.gray("room found"));
            socket.join(_roomID);
            var clientAmount = io.sockets.adapter.rooms[_roomID].length;
            hosts[_roomID].emit('clientAdded', {
                id: socket.id,
                id2: clientAmount,
                agent:_agent,
                width:_width,
                height:_height,
                orientation:_orientation
            });
            console.log(colors.gray("there are now", clientAmount, "sockets in room", _roomID, "including the host"));
            socket.emit('roomFound');
        }
        else {  // room doesn't exist
            console.log(colors.red("room not found"));
            socket.emit('roomNotFound');
        }
    }
    else {  // --- HOST -- create a room with a random ID

        _roomID = Math.floor(Math.random()*900) + 100; // add check to make sure this isn't already in rooms array
        rooms[_roomID] = _roomID;
        hosts[_roomID] = socket;

        socket
            .join(_roomID)
            .emit('roomCreated', { id: _roomID })
            .on('addSprite', function(data) { io.to([data.roomID]).emit('addSprite', data.image); })
            .on('moveSprite', function(data) { io.to([data.room]).emit('moveSprite', data); })
            .on('setupScreen', function(data) { io.to(data.screenID).emit('setYourself', data); })
            .on('moveScreen', function(data) { io.to(data.screenID).emit('adjustContainer', data); })
            .on('clearStage', function(data) { io.to(data.roomID).emit('clearCanvas'); });

        console.log(colors.cyan("no roomID found, creating one", _roomID));
        console.log(colors.cyan("there are now", Object.keys(rooms).length, "rooms"));

    }

    socket.on('disconnect', function() {

        console.log(colors.gray("disconnecting"));

        // loop through array of hosts
        for(var id in hosts) {
            var wasHost = false;
            if(hosts[id].id == socket.id) {
                console.log("the host is disconnecting");
                wasHost = true;
                socket.to(rooms[id]).emit('hostLeft');
                delete rooms[id];
                delete hosts[id];
                break;
            }
        }
        if(!wasHost) {
            for (_roomID in socket.adapter.rooms) break;
            console.log("a client is leaving room", _roomID);
            // make sure host is still around
            if(hosts[_roomID]) hosts[_roomID].emit('clientLeft', { id: socket.id });
        }
        console.log("there are " + Object.keys(rooms).length + " rooms remaining");
    });
});



/*function screenMoved(data) {
    // tell the host to move the screen
    hosts[data.room].emit('screenMoved', data);
}*/

function setupScreen(data) {

    io.to(data.screenID).emit('setYourself', data);
}

function moveScreen(data) {

    // tell this screen to adjust it's container
    io.to(data.screenID).emit('adjustContainer', data);
}

function hostAddedSprite(data) {

    console.log(colors.cyan("host in room", data.roomID, "added", data.image.texture));
    io.to([data.roomID]).emit('addSprite', data.image);
}

function hostMovedSprite(data) {

    //console.log("hose moved a cat", data.room, data.position.x, data.position.y);
    io.to([data.room]).emit('moveSprite', data);
}
