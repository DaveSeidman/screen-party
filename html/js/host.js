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

        var myID = data.id2;
        var basicText = new PIXI.Text(
            myID, {
                font : '12px Arial',
                align : 'center',
                width : data.width,
                y: data.height/2
            });

        sprite.addChild(basicText);

        var screen = new Screen(myID, data.id, sprite, { x:0, y:0 }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        //console.log(screen);
        host.screens.push(screen);
    }

    host.removeScreen = function(data) {

        console.log("remove screen", data);
        //for(var i = 0; i < host.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id

            //var screen = host.screens[i];
            //    console.log("checking id of client", data.id, "against all screen id's", screen.socket);
            //if(screen.socket == data.id) {
                // this is a clean way to remove the screen from the array
                //var matchedScreen = host.screens.splice(i,1)[0];
                //stage.removeChild(matchedScreen.sprite);

                // but I'd like to keep the array positions of all screens so I'll do this instead
            //    stage.removeChild(screen);
            //    screen = null;
                // so that if screen 3 leaves, screen 4 retains it's position and doesn't become the 3rd screen
            //    break;
            //}
        //}
    }


    host.moveScreen = function(data) {

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
