'use strict';

var Party = function() {

    var party = {};

    party.roomID;
    party.socket;
    party.hash;
    party.screens = [];
    party.image;
    party.renderer = renderer;
    party.stage = stage;

    var $wrap;
    var $roomID;
    var $clientID;
    var $catBtn;
    var ipAddress;
    var renderer;
    var stage;
    var texture;
    var isLocal;
    var lastX = 0;

    var offset = { x:0, y:0 }; // used when dragging screens

    $(document).on('ready', function() {

        $wrap = $('.wrap');
        $roomID = $('#roomID');
        $clientID = $('#clientID');
        $catBtn = $('#catBtn');

        isLocal = (window.location.host.indexOf('localhost') > -1 || window.location.host.indexOf('192') > -1);
        if(isLocal) {
            $.getJSON("config.json", function(data) {
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
        //      Screen Code
        // -----------------------------------------

        if(window.location.hash) { // client trying to join a room
            party.roomID = window.location.hash.substring(1);
            $roomID.hide();
            $catBtn.hide();
            var agent = "default";
            if(navigator.userAgent.match(/Android/i)) agent = "android";
            if(navigator.userAgent.match(/BlackBerry/i)) agent = "blackberry";
            if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) agent = "ios";
            if(navigator.userAgent.match(/Opera Mini/i)) agent = "opera";
            if(navigator.userAgent.match(/IEMobile/i)) agent = "ie";
            party.hash = window.location.hash.substring(1); // get hash minus the #
            party.socket = io.connect(ipAddress + ':80', {
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
            party.socket.on('addCatToScreens', addCatScreen);
            party.socket.on('moveCat', moveCatScreen);
        }


        // -----------------------------------------
        //      Host Code
        // -----------------------------------------

        else { // create a new room

            party.socket = io.connect(ipAddress + ':80', { transports: ['websocket'] });
            party.socket.on('roomCreated', roomCreated);
            party.socket.on('clientLeft', removeScreen);
            party.socket.on('clientAdded', addScreen);
            party.socket.on('screenMoved', moveScreen);
            $catBtn.on('click', addCatHost);
        }


        createCanvas();
    }







    // ---------------------------------------------------------
    //
    //    screen code
    //
    // ---------------------------------------------------------

    function roomFound() {

        $clientID.html(party.socket.id);
        window.addEventListener('devicemotion', screenMovement);
    }

    function screenMovement(event) {

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

    function addCatScreen() {

        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        var sprite = new PIXI.Sprite(texture);
        //sprite.interactive = true;
        //sprite.buttonMode = true;
        sprite.anchor.set(0.5);
        sprite.alpha = .5;
        sprite.x = 0;
        sprite.y = 0;

        stage.addChild(sprite);

    }

    function moveCatScreen(data) {

        console.log("move the cat", data);

    }

    function assetMovement() {


    }

    function roomNotFound() {

        $clientID.html("Room Not Found!");
    }

    function hostLeft() {

        $clientID.html("Host has left");
    }












    // ---------------------------------------------------------
    //
    //    host code
    //
    // ---------------------------------------------------------

    function roomCreated(data) {

        party.roomID = data.id;
        $roomID.html((isLocal ? data.ip : ipAddress) + "/#" + data.id);
    }

    function addCatHost() {
        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        var sprite = new PIXI.Sprite(texture);
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.anchor.set(0.5);
        sprite.alpha = .5;
        sprite.x = -400;
        sprite.y = -400;
        sprite
            .on('mousedown', dragCatStart)
            .on('mouseup', dragCatEnd)
            .on('mouseupoutside', dragCatEnd)
            .on('mousemove', dragCat);
        stage.addChild(sprite);
        console.log(party.roomID);
        party.socket.emit('addCat', { roomID: party.roomID });
    }

    function addScreen(data) {

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
            .on('mousedown', dragScreenStart)
            .on('mouseup', dragScreenEnd)
            .on('mouseupoutside', dragScreenEnd)
            .on('mousemove', dragScreen);
        sprite.position.x = randX;
        sprite.position.y = randY;

        sprite.addChild(graphics);
        stage.addChild(sprite);

        var basicText = new PIXI.Text(data.id);
        basicText.x = 20;
        basicText.y = data.height/2;
        basicText.scale.set(0.75);
        sprite.addChild(basicText);

        var accelTextX = new PIXI.Text("accelX");
        accelTextX.x = 20;
        accelTextX.y = 20;
        accelTextX.scale.set(0.5);
        sprite.addChild(accelTextX);

        var accelTexty = new PIXI.Text("accelX");
        accelTexty.x = 100;
        accelTexty.y = 20;
        accelTexty.scale.set(0.5);
        sprite.addChild(accelTexty);

        var screen = new Screen(data.id, sprite, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        party.screens.push(screen);
    }

    function moveScreen(data) {

        //console.log(data.movement.x);
        for(var i = 0; i < party.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id
            var screen = party.screens[i];

            screen.velocity.x = screen.prevVelocity.x + data.movement.x;
            screen.velocity.y = screen.prevVelocity.y + data.movement.y;

            //screen.sprite.x += screen.velocity.x;
            //screen.sprite.y += screen.velocity.y;

            screen.prevVelocity.x = screen.velocity.x;
            screen.prevVelocity.y = screen.velocity.y;

            //screen.sprite.x = screen.position.x;
            //screen.sprite.y = screen.position.y;
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

    function dragScreenStart(event)  {
        this.data = event.data;
        this.dragging = true;
        offset.x = this.x - this.data.originalEvent.x;
        offset.y = this.y - this.data.originalEvent.y;
    }

    function dragScreenEnd()  {
        this.dragging = false;
        this.data = null;
    }

    function dragScreen() {
        if (this.dragging)  {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x + offset.x;
            this.position.y = newPosition.y + offset.y;

        }
    }

    function dragCatStart(event)  {
        this.data = event.data;
        this.dragging = true;
        offset.x = this.x - this.data.originalEvent.x;
        offset.y = this.y - this.data.originalEvent.y;
    }

    function dragCatEnd()  {
        this.dragging = false;
        this.data = null;
    }

    function dragCat() {
        if (this.dragging)  {
            var newPosition = this.data.getLocalPosition(this.parent);
            this.position.x = newPosition.x + offset.x;
            this.position.y = newPosition.y + offset.y;

            party.socket.emit('moveCat',
            {
                room:party.roomID,
                socket:party.socket.id,
                position: {
                    x: this.position.x,
                    y: this.position.y
                }
            });
        }
    }






    // ---------------------------------------------------------
    //
    //    shared code
    //
    // ---------------------------------------------------------

    function createCanvas() {

        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0xCCCCCC;
        stage = new PIXI.Container();

        $("body").prepend(renderer.view);

        render();
    }

    function render() {

        renderer.render(stage);
        requestAnimationFrame(render);
    }


    return party;

} ();


var Screen = function(socket, sprite, position, velocity, prevVelocity, width, height, orientation) {

    this.socket = socket;
    this.sprite = sprite;
    this.position = position;
    this.velocity = velocity;
    this.prevVelocity = prevVelocity;
    this.width = width;
    this.height = height;
    this.orientation = orientation;
}
