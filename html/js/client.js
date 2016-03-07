var Client = function(party) {

    var client = this;
    var stage;
    var graphics;
    var roomText;

    var agent = getAgent();


    connect();
    listen();
    createCanvas();

    function connect() {
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
    }

    function listen() {

        party.socket.on('roomFound', roomFound);
        party.socket.on('roomNotFound', roomNotFound);
        party.socket.on('hostLeft', hostLeft);
        party.socket.on('addSprite', addSprite);
        party.socket.on('moveSprite', moveSprite);
        party.socket.on('setYourself', setupScreen);
        party.socket.on('adjustContainer', adjustContainer);
        party.socket.on('clearCanvas', clearCanvas);
    }

    function roomFound(data) {

        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.socket.id, { font : '12px courier' });
        roomText.x = window.innerWidth/2 - 70;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
        // window.addEventListener('devicemotion', screenMovement);
    }
    function roomNotFound() {

        stage.removeChild(roomText);
        roomText = new PIXI.Text('Room Not Found', { font : '12px courier' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
    }

    function hostLeft() {

        stage.removeChild(roomText);
        empty(graphics);
        roomText = new PIXI.Text('Host Has Left', { font : '12px courier' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
    }


    function addSprite(data) {

        var texture = PIXI.Texture.fromImage(data.texture);
        sprite = new PIXI.Sprite(texture);
        sprite.alpha = 1;
        sprite.x = data.position.x;
        sprite.y = data.position.y;
        graphics.addChild(sprite);
    }

    function moveSprite(data) {

        graphics.getChildAt(data.spriteID-1).x = data.position.x;
        graphics.getChildAt(data.spriteID-1).y = data.position.y;
    }

    function setupScreen(data) {

        var gridTexture = PIXI.Texture.fromImage('img/grid.jpg');
        var grid = new PIXI.Sprite(gridTexture);
        graphics.addChild(grid);
        //grid.anchor.set(0.5);
        graphics.x = data.offset.x;
        graphics.y = data.offset.y;

        for(var i = 0; i < data.graphics.length; i++) {

            addSprite(data.graphics[i]);
        }
    }

    function adjustContainer(data) {

        // combine this and just use a point?
        graphics.position.x = data.offset.x;
        graphics.position.y = data.offset.y;
    }

    function assetMovement() {


    }

    function createCanvas() {
        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0xCCCCCC;
        client.stage = stage = new PIXI.Container();
        client.graphics = graphics = new PIXI.Container();
        graphics.x = -3000;
        graphics.y = -3000;
        stage.addChild(graphics);
        document.body.removeChild(document.getElementById('form'));
        document.body.appendChild(renderer.view);
        render();
    }

    function clearCanvas() {
        empty(graphics);
    }

    function empty(container) { // duplicated, move to main.js or create utils.js

        for (var i = container.children.length - 1; i > 1; i--) {
            container.removeChild(container.children[i]);
        };
    }


    function render() {

        renderer.render(stage);
        requestAnimationFrame(render);
    }

    function screenMovement(event) {

        if(Math.abs(event.acceleration.x) > 0.25 || Math.abs(event.acceleration.y) > 0.25) {
            party.socket.emit('motion',
            {
                room:client.roomID,
                socket:party.socket.id,
                movement: {
                    x: event.acceleration.x,
                    y: event.acceleration.y
                }
            });
        }
    }

    return client;

    function getAgent() {
        var agent = "default";
        if(navigator.userAgent.match(/Android/i)) agent = "android";
        if(navigator.userAgent.match(/BlackBerry/i)) agent = "blackberry";
        if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) agent = "ios";
        if(navigator.userAgent.match(/Opera Mini/i)) agent = "opera";
        if(navigator.userAgent.match(/IEMobile/i)) agent = "ie";
        return agent;
    }
}
