// TO DO
// when screen gets graphic, grid goes black (mobile only?)


var Host = function(party) {

    var host = this;
    var stage;
    var graphics; // container for images
    var screens; // container for screen boxed
    var roomText;
    var draggingScreens = false;
    var zoom = 0.5;
    var grid;
    var socket;
    var screenArray = [];
    var graphicArray = [];
    host.screenArray = screenArray;

    connect();
    listen();
    createCanvas();

    function connect() {
        party.socket = socket = io.connect(party.ipAddress + ':80', { transports: ['websocket'] });
    }

    function listen() {
        socket.on('roomCreated', roomCreated)
              .on('clientLeft', removeScreen)
              .on('clientAdded', addScreen)
              .on('screenMotion', motionScreen)
              .on('screenStop', screenStop);
        window.addEventListener('resize', debouncedResize);
    }

    var debouncedResize = debounce(resize, 100);

    function resize() {

        console.log(window.innerWidth, window.innerHeight);
    }




    function roomCreated(data) {

        host.roomID = data.id;
        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.ipAddress + '/#' + host.roomID, { font : '28px Courier' });
        roomText.x = window.innerWidth - 120;
        roomText.y = window.innerHeight;
        stage.addChild(roomText);

        document.onkeypress = function(e) {
            if(e.keyCode == 99) addGraphic('../img/catPhoto.jpg');
            if(e.keyCode == 100) addGraphic('../img/dogPhoto.jpg');
            if(e.keyCode == 115) addGraphic('../img/slothPhoto.jpg');
            if(e.keyCode == 32) clearCanvas();
        };
    }

    function addScreen(data) {

        var gfx = new PIXI.Graphics();
        var sprite = new PIXI.Sprite();

        gfx.beginFill(0xFFFFFF, 0.75);
        gfx.drawRect(0, 0, data.width, data.height);
        var text = new PIXI.Text(data.id.substring(2), { font : '28px Courier' });
        text.x = data.width/2 - 160;
        text.y = data.height/2;
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.dragEvent = "moveScreen";
        sprite.on('mousedown', dragStart).on('mouseup', dragEnd).on('mouseupoutside', dragEnd);
        sprite.addChild(gfx);
        sprite.addChild(text);

        //sprite.screenID = data.id; // <-- remove this
        sprite.id = data.id;

        screens.addChild(sprite);
        //sprite.anchor.set(0.5);

        var screen = new Screen(data.id2, data.id, sprite, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        screenArray.push(screen);

        /*var graphicArray = [];
        for(var i = 1; i < graphics.children.length; i++) {
            var sprite = graphics.children[i];
            var spriteData = {};
            spriteData.texture = sprite.texture.baseTexture.imageUrl;
            spriteData.position = sprite.position;
            graphicArray.push(spriteData);
        }
        */
        console.log(graphicArray)
        socket.emit('setupScreen', {
            id : data.id,
            offset : {
                x : 0,
                y : 0
            },
            graphics : graphicArray
        });
    }

    function removeScreen(data) {

        for(var i = 0; i < screenArray.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id
            var screen = screenArray[i];
            if(screen.socket == data.id) {
                screens.removeChild(screen.sprite);
                screen = null;
                break;
            }
        }
    }



    function addGraphic(image) {

        var img = PIXI.Texture.fromImage(image);
        var sprite = new PIXI.Sprite(img);
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on('mousedown', dragStart).on('mouseup', dragEnd).on('mouseupoutside', dragEnd);
        graphics.addChild(sprite);
        sprite.dragEvent = "moveGraphic";
        sprite.id = host.graphics.children.length - 1;
        sprite.texture.baseTexture.on('loaded', function() {
        //    sprite.x = graphics.width/2;
        //    sprite.y = graphics.height/2;
        //    sprite.anchor.set(0.5);
        });
        graphicArray.push({
            texture: image,
            position: {
                x:0,
                y:0
            }
        });

        socket.emit('addGraphic', {
            id: host.roomID,
            texture: image,
            position: {
                x: sprite.x,
                y: sprite.y
            }
        });
    }

    var layers = [];

    function dragStart() {
        this.offset = {
            x: event.clientX * 1/zoom - this.x,
            y: event.clientY * 1/zoom - this.y
        }
        layers.push(this);
        this.on('mousemove', drag);
    }
    function dragEnd() {
        this.off('mousemove', drag);
        layers.splice(this);
    }

    function drag() {

        var layer = layers[0]; // only take top most mouse event

        layer.x = event.clientX * 1/zoom - layer.offset.x;
        layer.y = event.clientY * 1/zoom - layer.offset.y;

        if(layer.dragEvent == "moveContainer") {
            // move graphics
            graphics.x = screens.x = layer.x;
            graphics.y = screens.y = layer.y;
        }
        else {

            if(this.id != undefined) {
                // tell server we're moving graphic or screen
                socket.emit(layer.dragEvent, {
                    room:host.roomID,
                    id:this.id,
                    position: {
                        x: this.position.x,
                        y: this.position.y
                    }
                });
            }
        }
    }




    // Canvas functions

    function createCanvas() {

        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0x555555;
        host.stage = stage = new PIXI.Container();
        host.graphics = graphics = new PIXI.Container();
        host.screens = screens = new PIXI.Container();

        var gridTexture = PIXI.Texture.fromImage('img/grid2.jpg');
        grid = new PIXI.Sprite(gridTexture);
        grid.interactive = true;
        grid.buttonMode = true;
        grid.dragEvent = "moveContainer";
        grid.on('mousedown', dragStart).on('mouseup', dragEnd).on('mouseupoutside', dragEnd);

        stage.addChild(grid);
        stage.addChild(graphics);
        stage.addChild(screens);

        document.body.appendChild(renderer.view);

        grid.texture.baseTexture.on('loaded', function() {
            stage.scale.set(zoom);
        });

        update();
    }
    function clearCanvas() {
        //empty(graphics);
        graphics.removeChildren();
        graphicArray = [];
        socket.emit('clearStage', { roomID:host.roomID } );
    }
    function update() {

        updateScreenPositions();
        render();
        requestAnimationFrame(update);
    }
    function render() {

        renderer.render(stage);
    }






    function motionScreen(data) {

        for(var i = 0; i < screenArray.length; i++) {
            if(screenArray[i].id == data.index) {

                var screen = screenArray[i];
                screen.velocity.x -= data.movement.x;
                screen.velocity.y += data.movement.y;
            }
        }
    }

    function screenStop(data) {

        for(var i = 0; i < screenArray.length; i++) {
            if(screenArray[i].id == data.index) {
                var screen = screenArray[i];
                screen.velocity.x = 0;
                screen.velocity.y = 0;
            }
        }
    }

    function updateScreenPositions() {

        for(var i = 0; i < screenArray.length; i++) {
            var screen = screenArray[i];
            //screen.velocity.x *= 0.95;
            //screen.velocity.y *= 0.95;
            if(screen.velocity.x < 0.1) screen.velocity.x = 0;
            else screen.sprite.x += screen.velocity.x;
            if(screen.velocity.y < 0.1) screen.velocity.y = 0;
            else screen.sprite.y += screen.velocity.y;
            if(screen.velocity.x || screen.velocity.y) {
                socket.emit('moveScreen', {
                    screenID : screen.ID,
                    offset : {
                        x : -screen.sprite.x,
                        y : -screen.sprite.y
                    }
                });
            }
        }
    }





    var Screen = function(id, socket, sprite, position, velocity, prevVelocity, width, height, orientation) {
        this.id = id;
        this.socket = socket;
        this.sprite = sprite;
        this.position = position;
        this.velocity = velocity;
        this.prevVelocity = prevVelocity;
        this.width = width;
        this.height = height;
        this.orientation = orientation;
    }


    return host;
}
