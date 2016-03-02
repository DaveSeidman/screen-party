'use strict';

// to do
// remove jquery, it's mostly unused

// Program flow:
// go to index.html/[no hash]
// -- You become a host, a has is assigned

// go to index.html/[hash]
// -- Lookup this hash, if found, you are a client



var Party = function() {

    var party = {};

    document.addEventListener("DOMContentLoaded", function() {

        party.isLocal = (window.location.host.indexOf('localhost') > -1 || window.location.host.indexOf('192') > -1);
        if(party.isLocal) {
            /*$.getJSON("config.json", function(data) {
                party.ipAddress = data.network.ip;
                setupSocket();
            });*/
            var httpRequest = new XMLHttpRequest();
            httpRequest.onreadystatechange = function() {
               if (httpRequest.readyState === 4) {
                   if (httpRequest.status === 200) {
                       var data = JSON.parse(httpRequest.responseText);
                       //if (callback) callback(data);
                       party.ipAddress = data.network.ip;
                       setupSocket();
                   }
               }
           };
           httpRequest.open('GET', 'config.json');
           httpRequest.send();
        }
        else {
            party.ipAddress = 'freelun.ch';
            setupSocket();
        }
    });

    function setupSocket() {

        if(window.location.hash) { // client trying to join a room

            var client = new Client(party);
            party.client = client;
            var agent = getAgent();
            party.socket = io.connect(party.ipAddress + ':80', {
                transports: ['websocket'],
                query:
                "roomID=" + window.location.hash.substring(1) + "&" +
                "agent=" + agent + "&" +
                "width=" + window.innerWidth + "&" +
                "height=" + window.innerHeight + "&" +
                "orientation=" + window.orientation
            });

            client.roomID = window.location.hash.substring(1);
            client.joinRoom();
            party.socket.on('roomFound', client.roomFound);
            party.socket.on('roomNotFound', client.roomNotFound);
            party.socket.on('hostLeft', client.hostLeft);
            party.socket.on('addCatToScreens', client.addCatScreen);
            party.socket.on('moveCat', client.moveCatScreen);
            party.socket.on('adjustContainer', client.adjustContainer);
        }
        else { // create a new room

            var host = new Host(party);
            party.host = host;
            host.createRoom();
            party.socket = io.connect(party.ipAddress + ':80', { transports: ['websocket'] });
            party.socket.on('roomCreated', host.roomCreated);
            party.socket.on('clientLeft', host.removeScreen);
            party.socket.on('clientAdded', host.addScreen);
            party.socket.on('screenMoved', host.moveScreen);
        }
    }

    return party;

} ();


function getAgent() {
    var agent = "default";
    if(navigator.userAgent.match(/Android/i)) agent = "android";
    if(navigator.userAgent.match(/BlackBerry/i)) agent = "blackberry";
    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) agent = "ios";
    if(navigator.userAgent.match(/Opera Mini/i)) agent = "opera";
    if(navigator.userAgent.match(/IEMobile/i)) agent = "ie";
    return agent;
}
