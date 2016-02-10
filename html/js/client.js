'use strict';

var Party = function() {

    var party = {};

    party.roomID;
    party.socket;
    party.hash;
    party.screens = [];
    var $wrap;
    var $roomID;
    var $clientID;

    var ipAddress;

    var renderer;
    var stage;
    var texture;
    var local;

    var image;

    var offset = { x:0, y:0 };

    party.renderer = renderer;
    party.stage = stage;

    //var config = require('./package.json');

    $(document).on('ready', function() {
        $wrap = $('.wrap');
        $roomID = $('#roomID');
        $clientID = $('#clientID');
        //setupSocket(); // move this to wait until IP address is aquired.
        local = (window.location.host.indexOf('localhost') > -1 || window.location.host.indexOf('192') > -1);
        if(local) {
            $.getJSON("config.json", function(data) {
                console.log(data);
                ipAddress = data.network.ip;
                setupSocket();
            });
        }
        else {
            ipAddress = 'freelun.ch';
            setupSocket();
        }
    });

    function setupSocket() {

        // -----------------------------------------
        //
        //      Screen Code
        //
        // -----------------------------------------

        if(window.location.hash) { // client trying to join a room
            party.roomID = window.location.hash.substring(1);
            $roomID.hide();
            var agent = "default";
            if(navigator.userAgent.match(/Android/i)) agent = "android";
            if(navigator.userAgent.match(/BlackBerry/i)) agent = "blackberry";
            if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) agent = "ios";
            if(navigator.userAgent.match(/Opera Mini/i)) agent = "opera";
            if(navigator.userAgent.match(/IEMobile/i)) agent = "ie";
            party.hash = window.location.hash.substring(1); // get hash minus the #
            party.socket = io.connect(ipAddress + ':80',
            {
                transports: ['websocket'],
                query:
                "roomID=" + party.hash + "&" +
                "agent=" + agent + "&" +
                "width=" + window.innerWidth + "&" +
                "height=" + window.innerHeight + "&" +
                "orientation=" + window.orientation
            });
            party.socket.on('roomFound', roomFound);
            party.socket.on('roomNotFound', roomNotFound);
            party.socket.on('hostLeft', hostLeft);
        }




        // -----------------------------------------
        //
        //      Host Code
        //
        // -----------------------------------------

        else { // create a new room
            createCanvas();
            party.socket = io.connect(ipAddress + ':80', { transports: ['websocket'] });
            party.socket.on('roomCreated', roomCreated);
            party.socket.on('clientLeft', removeScreen);
            party.socket.on('clientAdded', addScreen);
            party.socket.on('screenMoved', moveScreen);
        }
    }







    // ---------------------------------------------------------
    //
    //    screen code
    //
    // ---------------------------------------------------------

    function roomFound() {

        $clientID.html(party.socket.id);
        window.ondevicemotion = function(event) {

            if(Math.abs(event.acceleration.x) > .25 || Math.abs(event.acceleration.y) > .25) {
                party.socket.emit('motion',
                {
                    room:party.roomID,
                    socket:party.socket.id,
                    movement: {
                        x: event.acceleration.x,
                        y: event.acceleration.y
                    }
                });
            }
        }
    }

    function roomNotFound() {

        $clientID.html("Room Not Found!");
    }

    function hostLeft() {

        $clientID.html("Host has left");
    }

    // ---------------------------------------------------------











    // ---------------------------------------------------------
    //
    //    host code
    //
    // ---------------------------------------------------------

    function roomCreated(data) {

        $roomID.html((local ? data.ip : ipAddress) + "/#" + data.id);
    }

    function addScreen(data) { // this is currently running for non-hosts, need to fix

        //console.log("new client added", data.id, party.socket.id);
        //var screenID = data.id.substring(2, data.id.length); // strip the /# at the beginning
        //console.log("----screenID:", screenID);
        //var $newClient = $('<li>' + data.id + '</li>');
        //  $clientList.append($newClient);

        //var screen = new Screen(data.id, Math.random() * window.innerWidth, Math.random() * window.innerHeight);
        var randX = Math.random() * window.innerWidth;
        var randY = Math.random() * window.innerHeight;

        var graphics = new PIXI.Graphics();
        graphics.lineStyle(20, 0x000000, 1);
        graphics.beginFill(0xFFFFFF, .75);
        graphics.drawRect( 0 , 0 , data.width , data.height );

        var sprite = new PIXI.Sprite();
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.anchor.set(0.5);
        sprite
        .on('mousedown', onDragStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('mousemove', onDragMove);
        sprite.position.x = randX;
        sprite.position.y = randY;

        sprite.addChild(graphics);
        stage.addChild(sprite);

        var basicText = new PIXI.Text(data.id);
        basicText.x = 20;
        basicText.y = 20;
        basicText.scale.set(0.75);
        sprite.addChild(basicText);

        var screen = new Screen(data.id, sprite, randX, randY, data.width, data.height, data.orientation);
        party.screens.push(screen);
    }

    function moveScreen(data) {

        //console.log("a screen moved", data.movement.x);
        for(var i = 0; i < party.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id
            var screen = party.screens[i];
            if(screen.socket.substring(2) == data.socket) {
                screen.sprite.x += data.movement.x * 2;
                screen.sprite.y += data.movement.y * 2;
            }
        }
    }

    function removeScreen(data) {

        for(var i = 0; i < party.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id

            var screen = party.screens[i];
        //    console.log("checking id of client", data.id, "against all screen id's", screen.socket);
            if(screen.socket == data.id) {
                var matchedScreen = party.screens.splice(i,1)[0];
                stage.removeChild(matchedScreen.sprite);
                break;
            }
        }
    }

    function createCanvas() {

        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0xCCCCCC;
        stage = new PIXI.Container();
        texture = PIXI.Texture.fromImage('../img/iPhone5.png');

        $("body").prepend(renderer.view);

        render();
    }

    function render() {

        renderer.render(stage);
        requestAnimationFrame(render);
    }

    function onDragStart(event)  {
        this.data = event.data;
        this.alpha = 1;
        this.dragging = true;
        //offset.x =
        //console.log(this.x, this.y);
        offset.x = this.x - this.data.originalEvent.x;
        offset.y = this.y - this.data.originalEvent.y;
    }

    function onDragEnd()  {
        this.alpha = 1;
        this.dragging = false;
        this.data = null;
    }

    function onDragMove() {
        if (this.dragging)  {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x + offset.x;
            this.position.y = newPosition.y + offset.y;
        }
    }



    return party;

} ();


var Screen = function(socket, sprite, x, y, width, height, orientation) {

    this.socket = socket;
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.orientation = orientation;
}
