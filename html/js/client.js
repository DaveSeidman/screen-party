var Client = function(party) {

    var client = this;


    var stage;
    var container;
    var roomText;
    var cat;


    var agent = getAgent();
    party.socket = io.connect(party.ipAddress + ':80', {
        transports: ['websocket'],
        query:
        "roomID=" + window.location.hash.substring(1) + "&" +
        "agent=" + agent + "&" +
        "width=" + window.innerWidth + "&" +
        "height=" + window.innerHeight + "&" +
        "orientation=" + window.orientation
    });

    client.roomID = window.location.hash.substring(1);
    party.socket.on('roomFound', roomFound);
    party.socket.on('roomNotFound', roomNotFound);
    party.socket.on('hostLeft', hostLeft);
    party.socket.on('addSpriteToScreens', addSprite);
    party.socket.on('moveCat', moveCatScreen);
    party.socket.on('setYourself', setupScreen);
    party.socket.on('adjustContainer', adjustContainer);
    party.socket.on('clearCanvas', clearCanvas);
    createCanvas();

    function roomFound(data) {

        console.log("roomfound");
        stage.removeChild(roomText);
        roomText = new PIXI.Text(party.socket.id, { font : '12px Arial' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
        // window.addEventListener('devicemotion', screenMovement);
    }
    function roomNotFound() {

        stage.removeChild(roomText);
        roomText = new PIXI.Text('Room Not Found', { font : '12px Arial' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
    }

    function hostLeft() {

        stage.removeChild(roomText);
        empty(container);
        roomText = new PIXI.Text('Host Has Left', { font : '12px Arial' });
        roomText.x = window.innerWidth/2 - 50;
        roomText.y = window.innerHeight/2;
        stage.addChild(roomText);
    }


    function addSprite() {

        var texture = PIXI.Texture.fromImage('../img/catPhoto.jpg');
        //var sprite = new PIXI.Sprite(texture);
        cat = new PIXI.Sprite(texture);
        cat.anchor.set(0.5);
        cat.alpha = .8;
        cat.x = 0;
        cat.y = 0;
        container.addChild(cat);
    }

    function moveCatScreen(data) {

        //console.log("move the cat", data);
        cat.position.x = data.position.x;
        cat.position.y = data.position.y;
    }

    function setupScreen(data) {

        container.position.x = -data.offset.x;
        container.position.y = -data.offset.y;

        console.log(data.graphics);
    }

    function adjustContainer(data) {

        // combine this and just use a point?
        container.position.x = -data.offset.x;
        container.position.y = -data.offset.y;
    }

    function assetMovement() {


    }

    function clearStage() {

        for (var i = stage.children.length - 1; i >= 0; i--) {	stage.removeChild(stage.children[i]);};
    }




    function createCanvas() {
        renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
        //console.clear();
        renderer.backgroundColor = 0xCCCCCC;
        client.stage = stage = new PIXI.Container();
        client.container = container = new PIXI.Container();
        stage.addChild(container);
        document.body.appendChild(renderer.view);

        render();
    }

    function clearCanvas() {
        empty(container);
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
                socket:party.socket.id,
                movement: {
                    x: event.acceleration.x,
                    y: event.acceleration.y
                }
            });
        }
    }



    function empty(container) {

        for (var i = container.children.length - 1; i >= 0; i--) {
            container.removeChild(container.children[i]);
        };
    }

    return client;

    function getAgent() {
        var agent = "default";
        if(navigator.userAgent.match(/Android/i)) agent = "android";
        if(navigator.userAgent.match(/BlackBerry/i)) agent = "blackberry";
        if(navigator.userAgent.match(/iPhone|iPad|iPod/i)) agent = "ios";
        if(navigator.userAgent.match(/Opera Mini/i)) agent = "opera";
        if(navigator.userAgent.match(/IEMobile/i)) agent = "ie";
        return agent;
    }
}
