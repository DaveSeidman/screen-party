// TO DO


var Host = function(party) {

    var host = this;
    var stage;
    var graphics;
    var screens;
    var roomText;
    var draggingScreens = false;

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
    }

    function roomCreated(data) {

        host.roomID = data.id;
        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.ipAddress + '/#' + host.roomID, { font : '28px Courier' });
        roomText.x = window.innerWidth;
        roomText.y = window.innerHeight;
        stage.addChild(roomText);

        stage.scale.set(0.5);

        document.onkeypress = function(e) {
            if(e.keyCode == 99) addSprite('../img/catPhoto.jpg');
            if(e.keyCode == 100) addSprite('../img/dogPhoto.jpg');
            if(e.keyCode == 115) addSprite('../img/slothPhoto.jpg');
            if(e.keyCode == 32) clearCanvas();
        };
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
        //grid.anchor.set(0.5);
        //grid.x = window.innerWidth/2;
        //grid.y = window.innerHeight/2;
        //grid.x = -3000;
        //grid.y = -3000;
        grid
            .on('mousedown', dragGridStart)
            .on('mouseup', dragGridEnd)
            .on('mouseupoutside', dragGridEnd);

        graphics.addChild(grid);
        graphics.addChild(screens);
        document.body.appendChild(renderer.view);

        //stage.scale.set(0.5);

        render();
    }

    function addScreen(data) {

        //var randX = Math.random() * (window.innerWidth - 400) + 200;
        //var randY = Math.random() * (window.innerHeight - 400) + 200;
        var centerX = (window.innerWidth - data.width)/2;
        var centerY = (window.innerHeight - data.height)/2;

        var gfx = new PIXI.Graphics();
        gfx.beginFill(0xFFFFFF, .75);
        gfx.drawRect(0, 0, data.width, data.height);
        var text = new PIXI.Text(data.id.substring(2), { font : '14px Courier' });
        text.x = data.width/2 - 60;
        text.y = data.height/2;

        var screen = new PIXI.Sprite();
        screen.interactive = true;
        screen.buttonMode = true;
        screen.anchor.set(0.5);
        screen
            .on('mousedown', dragScreenStart)
            .on('mouseup', dragScreenEnd)
            .on('mouseupoutside', dragScreenEnd);
        //screen.position.x = centerX;
        //screen.position.y = centerY;
        screen.addChild(gfx);
        screen.addChild(text);
        screen.screenID = data.id;
        screens.addChild(screen);
        console.log(screen.width, screen.height);
        var screenObj = new Screen(data.id2, data.id, screen, { x:centerX, y:centerY }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        host.screenArray.push(screenObj);

        var spriteArray = [];

        for(var i = 2; i < graphics.children.length; i++) {

            var sprite = graphics.children[i];
            var spriteData = {};
            spriteData.texture = sprite.texture.baseTexture.imageUrl;
            spriteData.position = sprite.position;
            spriteArray.push(spriteData);
        }

        party.socket.emit('setupScreen', {
            screenID : data.id,
            offset : {
                x : centerX - data.width/2,
                y : centerY - data.height/2
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
        //sprite.anchor.set(0.5);
        sprite.alpha = .5;
        sprite.x = 0;
        sprite.y = 0;
        sprite
            .on('mousedown', dragSpriteStart)
            .on('mouseup', dragSpriteEnd)
            .on('mouseupoutside', dragSpriteEnd);

        host.graphics.addChild(sprite);
        sprite.index = host.graphics.children.length-1;

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
            x: event.data.originalEvent.clientX - graphics.position.x,
            y: event.data.originalEvent.clientY - graphics.position.y
        };
        this.on('mousemove', dragGrid);
    }
    function dragGrid(event) {
        if(!draggingScreens) {
            graphics.position.x = event.data.originalEvent.clientX - this.offset.x;
            graphics.position.y = event.data.originalEvent.clientY - this.offset.y;
        }
    }
    function dragGridEnd() {
        this.off('mousemove', dragGrid);
    }



    function dragScreenStart(event)  {
        this.offset = {
            x: this.x - event.data.originalEvent.x,
            y: this.y - event.data.originalEvent.y
        };
        draggingScreens = true;
        this.on('mousemove', dragScreen);
    }
    function dragScreen() {
        this.position.x = event.clientX + this.offset.x;
        this.position.y = event.clientY + this.offset.y;
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
            x: this.x - event.data.originalEvent.x,
            y: this.y - event.data.originalEvent.y
        };

        this.on('mousemove', dragSprite);
    }
    function dragSprite() {
        this.position.x = event.clientX + this.offset.x;
        this.position.y = event.clientY + this.offset.y;

        console.log(this.index);
        party.socket.emit('moveSprite', {
            room:host.roomID,
            spriteID:this.index,
            position: {
                x: this.position.x,
                y: this.position.y
            }
        });
    }
    function dragSpriteEnd()  {
        this.off('mousemove', dragSprite);
    }








    function empty(graphics) { // duplicated, move to main.js or create utils.js

        for (var i = graphics.children.length - 1; i > 1; i--) {
            graphics.removeChild(graphics.children[i]);
        };
    }

    var Screen = function(id, socket, sprite, position, velocity, prevVelocity, width, height, orientation) {
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
