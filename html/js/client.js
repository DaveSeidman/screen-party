var Client = function(party) {

    var client = this;


    var stage;
    var container;
    var roomText;
    var cat;

    client.joinRoom = function() {

        console.log("client joining room", client.roomID);

        createCanvas();
        //client.hash = window.location.hash.substring(1); // get hash minus the #
    }


    client.roomFound = function(data) {

        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.socket.id, { font : '12px Arial' });
        stage.addChild(roomText);
        // window.addEventListener('devicemotion', screenMovement);
    }
    client.roomNotFound = function() {

        stage.removeChild(roomText);
        roomText = new PIXI.Text('Room Not Found', { font : '12px Arial' });
        stage.addChild(roomText);
    }

    client.hostLeft = function() {

        stage.removeChild(roomText);
        roomText = new PIXI.Text('Host Has Left', { font : '12px Arial' });
        stage.addChild(roomText);
    }


    client.addCatScreen = function() {

        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        //var sprite = new PIXI.Sprite(texture);
        cat = new PIXI.Sprite(texture);
        cat.anchor.set(0.5);
        cat.alpha = .8;
        cat.x = 0;
        cat.y = 0;
        container.addChild(cat);
    }

    client.moveCatScreen = function(data) {

        //console.log("move the cat", data);
        cat.position.x = data.position.x;
        cat.position.y = data.position.y;
    }

    client.adjustContainer = function(data) {

        // combine this and just use a point?
        container.position.x = -data.offset.x;
        container.position.y = -data.offset.y;
    }

    client.assetMovement = function() {


    }

    function clearStage() {

        for (var i = stage.children.length - 1; i >= 0; i--) {	stage.removeChild(stage.children[i]);};
    }



    // private methods

    function createCanvas() {
        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        console.clear();
        renderer.backgroundColor = 0xCCCCCC;
        client.stage = stage = new PIXI.Container();
        client.container = container = new PIXI.Container();
        stage.addChild(container);
        document.body.appendChild(renderer.view);

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
