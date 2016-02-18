var Host = function(party) {

    var host = this;


    host.screens = [];

    var offset = { x:0, y:0 }; // used when dragging screens
    var stage;

    host.createRoom = function() {

        var $catBtn = $('<button>');
        $catBtn.html('Add Cat');
        $catBtn.on('click', addCatHost);
        party.$wrap.append($catBtn);

        createCanvas();
    }


    host.roomCreated = function(data) {

        host.roomID = data.id;
        var $roomID = $('<h1>');
        $roomID.html((party.isLocal ? data.ip : party.ipAddress) + "/#" + data.id);
        party.$wrap.append($roomID);

    }



    host.addScreen = function(data) {

        console.log("HOST - addScreen");

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

        var basicText = new PIXI.Text(
            data.id, {
                font : '12px Arial',
                align : 'center',
                width : data.width,
                y: data.height/2
            });

        // basicText.font = '12px Arial';
        // basicText.x = 20;
        // basicText.y = data.height/2;
        //basicText.width = data.width;
        //basicText.align = 'center';
        //basicText.scale.set(0.75);
        sprite.addChild(basicText);

        // var accelTextX = new PIXI.Text("accelX");
        // accelTextX.x = 20;
        // accelTextX.y = 20;
        // accelTextX.scale.set(0.5);
        // sprite.addChild(accelTextX);
        //
        // var accelTexty = new PIXI.Text("accelX");
        // accelTexty.x = 100;
        // accelTexty.y = 20;
        // accelTexty.scale.set(0.5);
        // sprite.addChild(accelTexty);

        var screen = new Screen(data.id, sprite, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        host.screens.push(screen);
    }

    host.moveScreen = function(data) {

        //console.log(data.movement.x);
        for(var i = 0; i < host.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id
            var screen = host.screens[i];

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

    host.removeScreen = function(data) {

        for(var i = 0; i < host.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id

            var screen = host.screens[i];
            //    console.log("checking id of client", data.id, "against all screen id's", screen.socket);
            if(screen.socket == data.id) {
                var matchedScreen = host.screens.splice(i,1)[0];
                stage.removeChild(matchedScreen.sprite);
                break;
            }
        }
    }



    // private methods

    addCatHost = function() {
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
        //console.log(host.roomID);
        party.socket.emit('addCat', { roomID: host.roomID });
    }

    createCanvas = function() {
        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        renderer.backgroundColor = 0xCCCCCC;
        stage = new PIXI.Container();

        $("body").prepend(renderer.view);

        render();
    }

    render = function() {

        renderer.render(stage);
        requestAnimationFrame(render);
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
                room:host.roomID,
                socket:party.socket.id,
                position: {
                    x: this.position.x,
                    y: this.position.y
                }
            });
        }
    }

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


    return host;
}
