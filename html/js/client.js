var Client = function(party) {

    var client = this;


    var stage;

    client.joinRoom = function() {

        console.log("client joining room", client.roomID);

        createCanvas();
        //client.hash = window.location.hash.substring(1); // get hash minus the #
    }


    client.roomFound = function(data) {

        clearStage()
        var idText = new PIXI.Text(party.socket.id, { font : '12px Arial' });
        stage.addChild(idText);
        // window.addEventListener('devicemotion', screenMovement);
    }
    client.roomNotFound = function() {

        clearStage();
        var infoText = new PIXI.Text('Room Not Found', { font : '12px Arial' });
        stage.addChild(infoText);
    }

    client.hostLeft = function() {

        clearStage();
        var infoText = new PIXI.Text('Host Has Left', { font : '12px Arial' });
        stage.addChild(infoText);
    }


    client.addCatScreen = function() {

        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        var sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.alpha = .5;
        sprite.x = 0;
        sprite.y = 0;
        stage.addChild(sprite);
    }

    client.moveCatScreen = function(data) {

        console.log("move the cat", data);
    }

    client.assetMovement = function() {


    }

    function clearStage() {

        for (var i = stage.children.length - 1; i >= 0; i--) {	stage.removeChild(stage.children[i]);};
    }



    // private methods

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

    function screenMovement(event) {

        if(Math.abs(event.acceleration.x) > 0.25 || Math.abs(event.acceleration.y) > 0.25) {
            party.socket.emit('motion',
            {
                room:client.roomID,
                //id:
                socket:party.socket.id,
                movement: {
                    x: event.acceleration.x,
                    y: event.acceleration.y
                }
            });
        }
    }


    return client;

}
