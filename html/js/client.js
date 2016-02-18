var Client = function(party) {

    var client = this;


    var stage;

    client.joinRoom = function() {

        console.log("client joining room", client.roomID);

        createCanvas();
        //client.hash = window.location.hash.substring(1); // get hash minus the #
    }


    client.roomFound = function(data) {

        var $clientID = $('<h1>');
        $clientID.html(party.socket.id);
        party.$wrap.append($clientID);
        window.addEventListener('devicemotion', screenMovement);
    }
    client.roomNotFound = function() {

        console.log("CLIENT - roomNotFound");
        var $clientID = $('<h2>');
        $clientID.html("Room Not Found!");
        party.$wrap.append($clientID);
    }

    client.hostLeft = function() {

        var $clientID = $('<h2>');
        $clientID.html("Host has left");
        party.$wrap.append($clientID);
    }



    client.addCatScreen = function() {

        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        var sprite = new PIXI.Sprite(texture);
        //sprite.interactive = true;
        //sprite.buttonMode = true;
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

        if(Math.abs(event.acceleration.x) > .25 || Math.abs(event.acceleration.y) > .25) {
            party.socket.emit('motion',
            {
                room:client.roomID,
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
