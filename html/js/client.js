var Client = function(party) {

    var client = this;
    var stage;
    var graphics;
    var roomText;
    var screenIndex;
    var agent = getAgent();
    var socket;
    var grid;
    var room;
    var renderer;
    var rotation;

    connect();
    listen();
    createCanvas();

    function connect() {
        party.socket = socket = io.connect(party.ipAddress + ':80', {
            transports: ['websocket'],
            query:
            "roomID=" + window.location.hash.substring(1) + "&" +
            "agent=" + agent + "&" +
            "width=" + window.innerWidth + "&" +
            "height=" + window.innerHeight + "&" +
            "orientation=" + window.orientation
        });
        client.room = room = window.location.hash.substring(1);
    }

    function listen() {

        socket.on('roomFound', roomFound)
              .on('roomNotFound', roomNotFound)
              .on('hostLeft', hostLeft)
              .on('addGraphic', addGraphic)
              .on('moveGraphic', moveGraphic)
              .on('setupScreen', setupScreen)
              .on('moveScreen', moveScreen)
              .on('clearCanvas', clearCanvas);

        var dbResize = debounce(resize, 100);
        window.addEventListener('resize', dbResize);
        Compass.watch(function (heading) {

            if(rotation != heading) {

                socket.emit('rotate', {
                    room: room,
                    index: screenIndex,
                    rotation: heading
                });

                roomText.rotation = -((heading + 225) * Math.PI/180);
            }
            rotation = heading;
        });
    }

    function resize() {
        socket.emit('resize', {
            room: room,
            index: screenIndex,
            size: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        renderer.resize(window.innerWidth, window.innerHeight);

        roomText.x = window.innerWidth/2 - 70;
        roomText.y = window.innerHeight/2;
    }







    // Room functions ----

    function roomFound(data) {

        stage.removeChild(roomText);
        roomText = new PIXI.Text(data.id, fontStyle);
        roomText.anchor.x = 0.5;
        roomText.anchor.y = 0.5;
        roomText.x = window.innerWidth/2;
        roomText.y = window.innerHeight/2;
        roomText.alpha = 0.25;
        stage.addChild(roomText);

    }
    function roomNotFound() {

        stage.removeChild(roomText);
        roomText = new PIXI.Text('Room Not Found', { font : '14px courier' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
    }
    function hostLeft() {
        stage.removeChild(roomText);
        roomText = new PIXI.Text('Host Has Left', { font : '14px courier' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
        clearCanvas();
    }





    function setupScreen(data) {
        client.screenIndex = screenIndex = data.index;
        for(var i = 0; i < data.graphics.length; i++) {

            addGraphic(data.graphics[i]);
        }
        window.addEventListener('devicemotion', screenMovement);
    }

    function addGraphic(data) {
        var texture = PIXI.Texture.fromImage(data.texture);
        sprite = new PIXI.Sprite(texture);
        graphics.addChild(sprite);
        sprite.texture.baseTexture.on('loaded', function() {
            sprite.x = data.position.x;
            sprite.y = data.position.y;
            //sprite.anchor.set(0.5);
        });
    }

    function moveGraphic(data) {
        var graphic = graphics.getChildAt(data.id);
        graphic.x = data.position.x;
        graphic.y = data.position.y;
    }



    function moveScreen(data) {
        grid.x = graphics.x = -data.position.x;
        grid.y = graphics.y = -data.position.y;
    }

    function assetMovement() {


    }

    function createCanvas() {
        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0x555555;
        client.stage = stage = new PIXI.Container();
        client.graphics = graphics = new PIXI.Container();
        var gridTexture = PIXI.Texture.fromImage('img/grid2.jpg');
        grid = new PIXI.Sprite(gridTexture);
        stage.addChild(grid);
        grid.texture.baseTexture.on('loaded', function() {
            //graphics.x = -data.offset.x;
            //graphics.y = -data.offset.y;
        });
        //graphics.x = -3000;
        //graphics.y = -3000;
        stage.addChild(graphics);
        document.body.removeChild(document.getElementById('form'));
        document.body.appendChild(renderer.view);
        render();
    }

    function clearCanvas() {
        graphics.removeChildren();
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

    var moveStartTime = new Date().getTime();
    var moveEndTime = new Date().getTime();

    function screenMovement(event) {


        if(Math.abs(event.acceleration.x) > 0.05 || Math.abs(event.acceleration.y) > 0.05) {

            moveEndTime = new Date().getTime();

            socket.emit('motion', {
                room: room,
                socket: socket.id,
                index: screenIndex,
                movement: {
                    x: event.acceleration.x,
                    y: event.acceleration.y
                },
                time : moveEndTime - moveStartTime > 2000 ? 0 : moveEndTime - moveStartTime
            });

            moveStartTime = new Date().getTime();
        }
        // else {
        //     socket.emit('stop', {
        //         room: roomID,
        //         socket: socket.id,
        //         index: screenIndex
        //     });
        // }
    }

    return client;

}
