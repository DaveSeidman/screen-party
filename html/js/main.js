'use strict';

// Program flow:
// go to index.html/[no hash]
// -- You become a host, a hash is assigned

// go to index.html/[hash]
// -- Lookup this hash, if found, you join room.


var Party = function() {

    var party = {};

    document.addEventListener("DOMContentLoaded", function() {

        party.isLocal = (window.location.host.indexOf('localhost') > -1 || window.location.host.indexOf('192') > -1);
        if(party.isLocal) {

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

        }
        else { // create a new room

            var host = new Host(party);
            party.host = host;
        }
    }

    return party;

} ();
