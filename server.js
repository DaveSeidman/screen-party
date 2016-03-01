// todo, maybe maintain a list of screens as well,
// we kind of have an array of sockets per room but it
// might be more efficient (wouldn't need to loop and find by id)
// to store arrays of screens inside of rooms array


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
var os = require('os');
var fs = require('fs');
var colors = require('colors');
var ifaces = os.networkInterfaces();
var ipAddr;
var configFile = './html/config.json';
var config = require(configFile);

var rooms = []; // maintain a list of rooms
var hosts = []; // maintain a list of hosts for each room


server.listen(80);
app.use('/', express.static('html/'));

console.log(colors.gray("starting server on port 80"));

io.on('connection', function (socket) {

    console.log(colors.gray("incoming connection", socket.id));

    if(socket.request._query.roomID) { // there was a hash, meaning a client is trying to enter a room

        // ------------------------
        //   client code
        // ----------------------

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
            //socket.on('motion', screenMoved);
            //socket.on('buttonPressed', screenButtonPressed);
        }
        else {  // room doesn't exist
            console.log(colors.red("room not found"));
            socket.emit('roomNotFound');
        }
    }
    else {  // create a room with a random ID

        // ------------------------
        //   host code
        // ----------------------

        _roomID = Math.floor(Math.random()*900) + 100; // add check to make sure this isn't already in rooms array
        rooms[_roomID] = _roomID;
        hosts[_roomID] = socket;
        socket.join(_roomID);
        socket.emit('roomCreated', { id: _roomID, ip:ipAddr });
        socket.on('addCat', hostAddedCat);
        socket.on('moveCat', hostMovedCat);

        socket.on('moveScreen', moveScreen);

        console.log(colors.cyan("no roomID found, creating one", _roomID));
        console.log(colors.cyan("there are now", Object.keys(rooms).length, "rooms"));

    }

    socket.on('disconnect', function() {

        console.log(colors.gray("disconnecting"));
    /*    var rooms = this.adapter.rooms;
        var roomID = Object.keys(rooms)[0];
        var socketsInRoom = io.sockets.adapter.rooms[roomID].sockets;

        var i = 0;
        for(var socket in socketsInRoom) {
            console.log(socket, this.id);
            if(socket == this.id) {
                if(i == 0) {
                    console.log(colors.cyan("host is disconnecting"));
                    socket.to(roomID).emit('hostLeft');
                    delete rooms[roomID];
                }
                else {
                    console.log(colors.green("client is disconnecting"));
                    hosts[roomID].emit('clientLeft', { id: client });
                }
                break;
            }
            i++;
        }*/


    //    console.log(socketsInRoom, this.id);

        /*if(socketsInRoom[0] == this.id) {
            console.log(colors.cyan("host is disconnecting"));
            socket.to(roomID).emit('hostLeft');
            delete rooms[roomID];
        }
        else {
            console.log(colors.green("client is disconnecting"));
            //console.log(hosts[roomID]);
            //hosts[roomID].emit('clientLeft', { id: client });
        }*/

        for(var id in hosts) {
            if(hosts[id].id == socket.id) {
                console.log("the host is disconnecting");
                socket.to(rooms[id]).emit('hostLeft');
                delete rooms[id];
                delete hosts[id];
                break;
            }
            else {
                for (_roomID in socket.adapter.rooms) break;
                console.log("a client is leaving room", _roomID);
                if(hosts[_roomID]) hosts[_roomID].emit('clientLeft', { id: socket.id });
            }
        }
        console.log("there are " + Object.keys(rooms).length + " rooms remaining");
    });
});



/*function screenMoved(data) {
    // tell the host to move the screen
    hosts[data.room].emit('screenMoved', data);
}*/

function moveScreen(data) {

    // tell this screen to adjust it's container
    io.to(data.screenID).emit('adjustContainer', data);
}

function hostAddedCat(data) {

    console.log(colors.cyan("cat added in room", data.roomID));
    io.to([data.roomID]).emit('addCatToScreens');
}

function hostMovedCat(data) {

    //console.log("hose moved a cat", data.room, data.position.x, data.position.y);
    io.to([data.room]).emit('moveCat', data);
}


// get local IP address

Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            return;
        }
        if (alias >= 1) {

        }
        else {
            ipAddr = iface.address;
            //console.log(config);
            config.network.ip = ipAddr;
            fs.writeFile(configFile, JSON.stringify(config, null, 2), function(e) { // can probably delete 'e'
                console.log(colors.gray("updated config file with IP address"));
            });
        }
        ++alias;
    });
});
