// TO DO
//mouse movement consistent with zoom (ie, .5 zoom, 2x mouse movement)
// layer screens ABOVE graphics
// when screen gets graphic, grid disappears


var Host = function(party) {

    var host = this;
    var stage;
    var graphics; // container for images
    var screens; // container for screen boxed
    var roomText;
    var draggingScreens = false;
    var zoom = 2;

    var screenArray = [];
    host.screenArray = screenArray;

    connect();
    listen();
    createCanvas();

    function connect() {
        party.socket = io.connect(party.ipAddress + ':80', { transports: ['websocket'] });
    }

    function listen() {
        party.socket.on('roomCreated', roomCreated);
        party.socket.on('clientLeft', removeScreen);
        party.socket.on('clientAdded', addScreen);
        party.socket.on('screenMoved', moveScreen);
        party.socket.on('screenMotion', motionScreen);
    }


    function motionScreen(data) {

        for(var i = 0; i < screenArray.length; i++) {
            if(screenArray[i].id == data.index) {

                var screen = screenArray[i];
                screen.velocity.x += data.movement.x;
                screen.velocity.y += data.movement.y;

                console.log(screen.velocity.x, screen.velocity.y);
                screen.sprite.x += screen.velocity.x;
                screen.sprite.y += screen.velocity.y;
            }
        }
    }

    function createCanvas() {

        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0xCCCCCC;
        host.stage = stage = new PIXI.Container();
        host.graphics = graphics = new PIXI.Container();
        host.screens = screens = new PIXI.Container();

        stage.addChild(graphics);

        var gridTexture = PIXI.Texture.fromImage('img/grid.jpg');

        var grid = new PIXI.Sprite(gridTexture);


        grid.interactive = true;
        grid.buttonMode = true;

        grid
            .on('mousedown', dragGridStart)
            .on('mouseup', dragGridEnd)
            .on('mouseupoutside', dragGridEnd);

        graphics.addChild(grid);
        graphics.addChild(screens);

        document.body.appendChild(renderer.view);

        grid.texture.baseTexture.on('loaded', function() {
            stage.scale.set(1/zoom);
            graphics.x = (window.innerWidth * zoom - grid.width)/2;// + window.innerWidth/2;
            graphics.y = (window.innerHeight * zoom - grid.height)/2;// + window.innerHeight/2;
        });

        //stage.scale.set(0.5);

        render();
    }

    function roomCreated(data) {

        host.roomID = data.id;
        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.ipAddress + '/#' + host.roomID, { font : '28px Courier' });
        roomText.x = window.innerWidth - 120;
        roomText.y = window.innerHeight;
        stage.addChild(roomText);

        //graphics.x = -graphics.width/2;
        //stage.scale.set(1/zoom);

        document.onkeypress = function(e) {
            if(e.keyCode == 99) addSprite('../img/catPhoto.jpg');
            if(e.keyCode == 100) addSprite('../img/dogPhoto.jpg');
            if(e.keyCode == 115) addSprite('../img/slothPhoto.jpg');
            if(e.keyCode == 32) clearCanvas();
        };
    }

    function addScreen(data) {

        var centerX = graphics.width/2 - data.width/2;
        var centerY = graphics.height/2 - data.height/2;

        var gfx = new PIXI.Graphics();
        gfx.beginFill(0xFFFFFF, .75);
        gfx.drawRect(0, 0, data.width, data.height);
        var text = new PIXI.Text(data.id.substring(2), { font : '14px Courier' });
        text.x = data.width/2 - 60;
        text.y = data.height/2;
        var screen = new PIXI.Sprite();
        screen.interactive = true;
        screen.buttonMode = true;
        screen
            .on('mousedown', dragScreenStart)
            .on('mouseup', dragScreenEnd)
            .on('mouseupoutside', dragScreenEnd);
        screen.addChild(gfx);
        screen.addChild(text);
        screen.screenID = data.id;
        screen.x = centerX;
        screen.y = centerY;
        screens.addChild(screen);
        screen.anchor.set(0.5);
        console.log(data.id2);

        var screenObj = new Screen(data.id2, data.id, screen, { x:centerX, y:centerY }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        host.screenArray.push(screenObj);

        var spriteArray = [];
        for(var i = 1; i < graphics.children.length-1; i++) {
            var sprite = graphics.children[i];
            var spriteData = {};
            spriteData.texture = sprite.texture.baseTexture.imageUrl;
            spriteData.position = sprite.position;
            spriteArray.push(spriteData);
        }

        party.socket.emit('setupScreen', {
            screenID : data.id,
            screenIndex : data.id2,
            offset : {
                x : centerX,
                y : centerY
            },
            graphics : spriteArray
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


    function moveScreen(data) {

        //console.log(data);
        //console.log(data.movement.x);
        for(var i = 0; i < host.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id
            var screen = host.screens[i];

            //screen.velocity.x = screen.prevVelocity.x + data.movement.x;
            screen.velocity += data.movement.x/100;
            //screen.velocity.y = screen.prevVelocity.y + data.movement.y;

            screen.sprite.x += screen.velocity.x;
            //    console.log(data.movement.x, screen.velocity.x, screen.sprite.x);

            //screen.sprite.y += screen.velocity.y;

            //screen.prevVelocity.x = screen.velocity.x;
            //screen.prevVelocity.y = screen.velocity.y;

            //screen.sprite.x = screen.position.x;
            //screen.sprite.y = screen.position.y;
        }
    }




    function clearCanvas() {
        empty(graphics);
        party.socket.emit('clearStage', { roomID:host.roomID } );
    }

    function addSprite(image) {

        var texture = PIXI.Texture.fromImage(image);
        var sprite = new PIXI.Sprite(texture);
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.alpha = .5;
        sprite
            .on('mousedown', dragSpriteStart)
            .on('mouseup', dragSpriteEnd)
            .on('mouseupoutside', dragSpriteEnd);
        graphics.addChild(sprite);
        graphics.removeChild(screens);
        graphics.addChild(screens);
        sprite.index = host.graphics.children.length - 1;
        sprite.texture.baseTexture.on('loaded', function() {
            sprite.x = graphics.width/2;
            sprite.y = graphics.height/2;
            sprite.anchor.set(0.5);
        });

        var imgData = {
            texture: image,
            position: {
                x: sprite.x,
                y: sprite.y
            }
        }
        party.socket.emit('addSprite', { roomID: host.roomID, image:imgData });
    }

    function render() {
        renderer.render(stage);
        requestAnimationFrame(render);
    }





    // each of these drag functions are pretty similar but have some differences
    // dragging screens needs to prevent dragging the grid
    // might be able to combine all three.

    function dragGridStart(event) {
        this.offset = {
            x: event.data.originalEvent.clientX * zoom - graphics.position.x,
            y: event.data.originalEvent.clientY * zoom - graphics.position.y
        };
        this.on('mousemove', dragGrid);
    }
    function dragGrid(event) {
        if(!draggingScreens) {
            graphics.position.x = event.data.originalEvent.clientX * zoom - this.offset.x;
            graphics.position.y = event.data.originalEvent.clientY * zoom - this.offset.y;
        }
    }
    function dragGridEnd() {
        this.off('mousemove', dragGrid);
    }



    function dragScreenStart(event)  {
        this.offset = {
            x: this.x - event.data.originalEvent.x * zoom,
            y: this.y - event.data.originalEvent.y * zoom
        };
        draggingScreens = true;
        this.on('mousemove', dragScreen);
    }
    function dragScreen() {
        this.position.x = event.clientX * zoom + this.offset.x;
        this.position.y = event.clientY * zoom + this.offset.y;
        party.socket.emit('moveScreen', {
            screenID : this.screenID,
            offset : {
                x : -this.position.x,
                y : -this.position.y
            }
        });
    }
    function dragScreenEnd()  {
        draggingScreens = false;
        this.off('mousemove', dragScreen);
    }





    function dragSpriteStart(event)  {
        this.offset = {
            x: this.x - event.data.originalEvent.x * 2,
            y: this.y - event.data.originalEvent.y * 2
        };

        this.on('mousemove', dragSprite);
    }
    function dragSprite() {
        if(!draggingScreens) {
            this.position.x = event.clientX * 2 + this.offset.x;
            this.position.y = event.clientY * 2 + this.offset.y;
            party.socket.emit('moveSprite', {
                room:host.roomID,
                spriteID:this.index,
                position: {
                    x: this.position.x,
                    y: this.position.y
                }
            });
        }
    }
    function dragSpriteEnd()  {
        this.off('mousemove', dragSprite);
    }








    function empty(graphics) { // duplicated, move to main.js or create utils.js

        for (var i = 1; i < graphics.children.length; i++) {
            graphics.removeChild(graphics.children[i]);
        };
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
