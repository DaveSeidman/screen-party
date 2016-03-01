// TO DO


var Host = function(party) {

    var host = this;


    host.screens = [];

    var offset = { x:0, y:0 }; // used when dragging screens
    var stage;
    var container;
    var roomText;

    host.createRoom = function() {

        createCanvas();
    }


    host.roomCreated = function(data) {

        host.roomID = data.id;
        //clearStage();
        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.ipAddress + '/#' + host.roomID, { font : '12px Arial' });
        stage.addChild(roomText);

        $(document).on('keypress', function() { if(event.code == "KeyC") addCat(); });

    }


    host.addScreen = function(data) {

        console.log("HOST - addScreen");

        var randX = Math.random() * (window.innerWidth - 200) + 100;
        var randY = Math.random() * (window.innerHeight - 200) + 100;

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
        .on('mousemove', dragScreen); // To Do: this will result in too many listeners, add and remove as necessary
        sprite.position.x = randX;
        sprite.position.y = randY;

        sprite.addChild(graphics);
        sprite.screenID = data.id;
        stage.addChild(sprite);

        var myID = data.id2;
        var basicText = new PIXI.Text(data.id.substring(2), { font : '12px Arial' });
        sprite.addChild(basicText);

        var screen = new Screen(myID, data.id, sprite, { x:randX, y:randY }, { x:0, y:0 }, { x:0, y:0 }, data.width, data.height, data.orientation);
        //console.log(screen);
        host.screens.push(screen);

        party.socket.emit('moveScreen', {
            screenID : data.id,
            offset : {
                x : randX,
                y : randY
            }
        });

    }

    host.removeScreen = function(data) {

        console.log("remove screen", data);
        for(var i = 0; i < host.screens.length; i++) {   // these loops should be replaced with associative arrays, the key being the socket id

            var screen = host.screens[i];
              // console.log("looking for this screen id", data.id, "=", screen.socket);
            if(screen.socket == data.id) {
                //this is a clean way to remove the screen from the array
                //var matchedScreen = host.screens.splice(i,1)[0];
                //stage.removeChild(matchedScreen.sprite);

                //but I'd like to keep the array positions of all screens so I'll do this instead
               stage.removeChild(screen.sprite);
               screen = null;
                //so that if screen 3 leaves, screen 4 retains it's position and doesn't become the 3rd screen
               break;
            }
        }
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

    createCanvas = function() {

        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        console.clear();
        renderer.backgroundColor = 0xCCCCCC;
        host.stage = stage = new PIXI.Container();
        host.container = container = new PIXI.Container();
        stage.addChild(container);
        $("body").prepend(renderer.view);

        render();
    }

    addCat = function() {

        party.socket.emit('addCat', { roomID: host.roomID });

        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        var sprite = new PIXI.Sprite(texture);
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.anchor.set(0.5);
        sprite.alpha = .5;
        sprite.x = 0;
        sprite.y = 0;
        sprite
        .on('mousedown', dragCatStart)
        .on('mouseup', dragCatEnd)
        .on('mouseupoutside', dragCatEnd)
        .on('mousemove', dragCat);
        host.container.addChild(sprite);
        console.log(container.children.length)
        //console.log(host.roomID);
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

            party.socket.emit('moveScreen', {
                screenID : this.screenID,
                offset : {
                    x : this.position.x,
                    y : this.position.y
                }
            });
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
