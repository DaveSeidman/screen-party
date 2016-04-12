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
    var renderer;
    var screenArray = [];
    var graphicArray = [];
    host.screenArray = screenArray;



    var movement = false;
    var newMotion = true;
    var motionTimeout;
    var startTime;
    var chart = new PIXI.Sprite();
    var chartHeight = 400;
    var chartWidth = 600;
    var lastPoint;
    var graph;
    var total;
    var rect1 = new PIXI.Graphics();
    var rect2 = new PIXI.Graphics();
    var lines = new PIXI.Graphics();
    var thisTime = new Date().getTime();
    var lastTime = new Date().getTime();
    var interval = 1;
    var idletime = 3;

    var acl = 0;
    var vel = 0;
    var pos = 0;

    var count = 0;

    var motionArray = [];

    connect();
    listen();
    createCanvas();

    function connect() {
        party.socket = socket = io.connect(party.ipAddress + ':80', { transports: ['websocket'] });
        socket.io.on('connect_error', function() {
            console.log('connection error');
        });
    }

    function listen() {
        socket.on('roomCreated', roomCreated)
              .on('clientLeft', removeScreen)
              .on('clientAdded', addScreen)
              .on('resizeScreen', resizeScreen)
              .on('motionScreen', motionScreen)
              .on('stopScreen', stopScreen)
              .on('rotateScreen', rotateScreen);
        var dbResize = debounce(resize, 100);
        window.addEventListener('resize', dbResize);
    }


    function resize() {

        renderer.resize(window.innerWidth, window.innerHeight);
        roomText.x = window.innerWidth - 120;
        roomText.y = window.innerHeight;
    }


    function resizeScreen(data) {

        var screen = screenArray[data.index];
        var rect = screen.sprite.children[0];
        var text = screen.sprite.children[1];
        rect.width = data.size.width * 10;
        rect.height = data.size.height * 10;
        text.x = data.size.width/2 - 160;
        text.y = data.size.height/2;
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

        var sprite = new PIXI.Sprite();

        var frame = new PIXI.Graphics();
        frame.beginFill(0x111111);
        frame.fillAlpha = 0.5;
        frame.drawRoundedRect(-30,-60,parseInt(data.width)+60,parseInt(data.height)+120, 20);
        frame.endFill();
        sprite.addChild(frame)

        var area = new PIXI.Graphics();
        area.beginFill(0xffffff);
        area.fillAlpha = 0.25;
        area.drawRect(0,0,data.width,data.height);
        area.endFill();
        sprite.addChild(area);

        var text = new PIXI.Text(data.id2, fontStyle);
        text.anchor.x = 0.5;
        text.anchor.y = 0.5;
        text.x = data.width/2;
        text.y = data.height/2;
        text.alpha = 0.25;
        sprite.idText = text;
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.dragEvent = "moveScreen";
        sprite.on('mousedown', dragStart).on('mouseup', dragEnd).on('mouseupoutside', dragEnd);
        //sprite.addChild(frame);


        sprite.addChild(text);
        sprite.pivot.x = data.width/2;
        sprite.pivot.y = data.height/2;
        sprite.x = window.innerWidth/2;
        sprite.y = window.innerHeight/2;
        sprite.id = data.id;
        screens.addChild(sprite);


        var screen = new Screen(data.id2, data.id, sprite, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        screenArray.push(screen);

        socket.emit('setupScreen', {
            id : data.id,
            index : screenArray.length - 1,
            offset : {
                x : window.innerWidth/2,
                y : window.innerHeight/2
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

        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, null, false, true);
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

        //if(movement) sampleMotion();
        sampleMotion();
        updateScreenPositions();
        render();
        requestAnimationFrame(update);
    }
    function render() {

        renderer.render(stage);
    }




    function rotateScreen(data) {

        if(screenArray[data.index]) {
            var screen = screenArray[data.index].sprite;
            var radians = (data.rotation + 225) * (Math.PI/180);

            TweenLite.to(screen, 0.5, {rotation: radians });
            TweenLite.to(screen.idText, 0.5, {rotation: -radians });

            socket.emit('rotateScreen', {
                room:host.roomID,
                id:screen.id,
                rotation: radians
            });

        }
    }




    function motionScreen(data) {

        acl = Math.abs(data.movement.x) > .05 ? data.movement.x : 0;
        //drawChart(data);
        //console.log("go", data.movement);
        //for(var i = 0; i < screenArray.length; i++) {
        if(screenArray[data.index]) { // shouldn't need to check for this since the screen just moved

            var screen = screenArray[data.index];
            //screen.velocity.x += data.movement.x;
            //screen.velocity.y += data.movement.y;
            //screen.velocity.x += data.movement.x * (data.time/10);
            //screen.velocity.y += data.movement.y * (data.time/10);

        }
    }

    function clearChart() {

        chart.removeChildren(0, chart.children.length);
        chart.x = 100;
        chart.y = 100;
        stage.addChild(chart);

        var bg = new PIXI.Graphics();
        bg.beginFill(0xffffff);
        bg.drawRect(0,0,chartWidth,chartHeight);
        bg.endFill();
        chart.addChild(bg);


        rect1.clear();
        lines.clear();
        total = 0;

        if(motionArray.length > idletime + 10) analyzeMotion();
        count = 0;
        startTime = new Date().getTime();
        motionArray.length = 0;
    }

    function sampleMotion() {

        //if(Math.abs(acl) <= .1) acl = 0;


        if(acl == 0) count++;
        else count = 0;
        if(count > idletime) clearChart();

        thisTime = new Date().getTime();

        velocity = acl * (thisTime - lastTime);

        var elapsed = thisTime - startTime;
        motionArray.push({accel:acl,time:elapsed});
        var point = { x : elapsed/(chartWidth/100), y : acl * chartHeight/10 };

        rect1.beginFill(0x111111);
        rect1.drawRect(point.x, chartHeight/2, 10, point.y);
        rect1.endFill();
        chart.addChild(rect1);

        lastTime = thisTime;
    }


    function analyzeMotion() {

        var motionArraySliced = motionArray.slice(0, motionArray.length - idletime);
        var motionArraySmoothed = [];

        var offset = 0;
        for(var i = 0; i < motionArraySliced.length; i++) {
            //offset += motionArraySliced[i];
            if(i > 2 && i < motionArraySliced.length - 2) {

                var avgAccel = (motionArraySliced[i-2].accel +
                                motionArraySliced[i-1].accel +
                                motionArraySliced[i-0].accel +
                                motionArraySliced[i+1].accel +
                                motionArraySliced[i+2].accel)/5;
                motionArraySmoothed.push({accel:avgAccel, time:motionArraySliced[i].time});
            }
        }

        var beg = 0;
        var end = 0;
        var max = 0;

        for(var i = 0; i < motionArraySmoothed.length; i++) {

            var point = { x : motionArraySmoothed[i].time/(chartWidth/100), y : motionArraySmoothed[i].accel * chartHeight/10 };
            rect1.beginFill(0x111111);
            rect1.drawRect(point.x, chartHeight/2, 10, point.y);
            rect1.endFill();
            chart.addChild(rect1);

            if(motionArraySmoothed[i].accel > max) max = motionArraySmoothed[i].accel;
            if(i < motionArraySmoothed.length/2) {
                beg += motionArraySmoothed[i].accel;
            }
            else {
                end += motionArraySmoothed[i].accel;
            }
        }
        console.log(beg > end ? "Moved Left" : "Moved Right", max, motionArraySmoothed[i-1].time);
        var pos = (max * motionArraySmoothed[i-1].time * (beg > end ? -1 : 1))/10;
        var screen = screenArray[0].sprite;
        TweenLite.to(screen, 0.5, { x: screen.x + pos });
    }



    function stopScreen(data) {

        console.log("stop", data);
        //for(var i = 0; i < screenArray.length; i++) {
            if(screenArray[data.index]) {

                var screen = screenArray[data.index];
                //screen.velocity.y = 0;
            }
        //}
    }

    function updateScreenPositions() {

        for(var i = 0; i < screenArray.length; i++) {

            var screen = screenArray[i];

            screen.velocity.x *= 0.9;
            screen.velocity.y *= 0.9;

            if(Math.abs(screen.velocity.x) > 0.05 || Math.abs(screen.velocity.y) > 0.05) {

                screen.sprite.x -= screen.velocity.x;
                screen.sprite.y += screen.velocity.y;

                socket.emit('moveScreen', {
                    room:host.roomID,
                    id:screen.id,
                    position: {
                        x: screen.sprite.x,
                        y: screen.sprite.y
                    }
                });
            }
            // if(screen.velocity.x < 0.1) screen.velocity.x = 0;
            // else screen.sprite.x += screen.velocity.x;
            // if(screen.velocity.y < 0.1) screen.velocity.y = 0;
            // else screen.sprite.y += screen.velocity.y;
            // if(screen.velocity.x || screen.velocity.y) {
            //     socket.emit('moveScreen', {
            //         screenID : screen.ID,
            //         offset : {
            //             x : -screen.sprite.x,
            //             y : -screen.sprite.y
            //         }
            //     });
            // }
        }
    }




    // move this into it's own file
    var Screen = function(id, socket, sprite, position, velocity, prevVelocity, width, height, orientation) {
        this.id = id;
        this.socket = socket;
        this.sprite = sprite;
        this.position = position;
        this.velocity = velocity;
        this.acceleration = 0;
        this.prevVelocity = prevVelocity;
        this.width = width;
        this.height = height;
        this.orientation = orientation;
    }


    return host;
}
