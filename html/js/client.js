'use strict';

var Party = function() {

  var party = {};

  party.partyID;
  party.hash;
  party.screens = [];
  var $wrap;
  var $roomID;
  var $clientID;

  var ipAddress;

  var renderer;
  var stage;
  var texture;
  var local;

  party.renderer = renderer;
  party.stage = stage;

  //var config = require('./package.json');

  $(document).on('ready', function() {

    $wrap = $('.wrap');
    $roomID = $('#roomID');
    $clientID = $('#clientID');

    //setupSocket(); // move this to wait until IP address is aquired.
    local = (window.location.host.indexOf('localhost') > -1 || window.location.host.indexOf('192') > -1);

    if(local) {
        $.getJSON("config.json", function(data) {

            console.log(data);
            ipAddress = data.network.ip;
            setupSocket();
        });
    }
    else {
        ipAddress = 'freelun.ch';
        setupSocket();
    }

  });

  function setupSocket() {

      if(window.location.hash) { // client trying to join a room

        //$wrap.hide();
        $roomID.hide();
        var agent = navigator.userAgent.substring(0,5);

        party.hash = window.location.hash.substring(1);
        //possible to get IP address BEFORE connection established?
        party.socket = io.connect(ipAddress + ':80', { transports: ['websocket'], query:"roomID="+party.hash+"&agent="+agent });
        party.socket.on('roomFound', roomFound);
        party.socket.on('roomNotFound', roomNotFound);
        party.socket.on('hostLeft', hostLeft);
      }
      else { // create a new room

        createCanvas();

        party.socket = io.connect(ipAddress + ':80', { transports: ['websocket'] });
        party.socket.on('roomCreated', roomCreated);
        party.socket.on('clientLeft', removeScreen);
        party.socket.on('clientAdded', addScreen);
      }
  }


  function roomCreated(data) {

      $roomID.html((local ? data.ip : ipAddress) + "/#" + data.id);
  }

  function addScreen(data) { // this is currently running for non-hosts, need to fix

    //console.log("new client added", data.id, party.socket.id);
    //var screenID = data.id.substring(2, data.id.length); // strip the /# at the beginning
    //console.log("----screenID:", screenID);
    //var $newClient = $('<li>' + data.id + '</li>');
  //  $clientList.append($newClient);

    //var screen = new Screen(data.id, Math.random() * window.innerWidth, Math.random() * window.innerHeight);
    var randX = Math.random() * window.innerWidth;
    var randY = Math.random() * window.innerHeight;
    var sprite = new PIXI.Sprite(texture);
    sprite.interactive = true;
    sprite.buttonMode = true;
    sprite.anchor.set(0.5);
    sprite.scale.set(0.5);
    sprite
      .on('mousedown', onDragStart)
      .on('mouseup', onDragEnd)
      .on('mouseupoutside', onDragEnd)
      .on('mousemove', onDragMove);
    sprite.position.x = randX;
    sprite.position.y = randY;

    stage.addChild(sprite);

    var basicText = new PIXI.Text(data.id);
    basicText.x = -140;
    basicText.y = 40;
    basicText.scale.set(0.75);
    sprite.addChild(basicText);

    var screen = new Screen(data.id, sprite, randX, randY);
    party.screens.push(screen);
  }

  function removeScreen(data) {

    //console.log("removing screen", data.id);
    //console.log(party.screens.splice(data.id, 1));
    for(var i = 0; i < party.screens.length; i++) {

      var screen = party.screens[i];
      console.log("checking id of client", data.id, "against all screen id's", screen.socket);
      if(screen.socket == data.id) {
        var matchedScreen = party.screens.splice(i,1)[0];
        stage.removeChild(matchedScreen.sprite);
        break;
      }
    }
  }


  function createCanvas() {

    renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    renderer.backgroundColor = 0xCCCCCC;
    stage = new PIXI.Container();
    texture = PIXI.Texture.fromImage('../img/iPhone5.png');

    $("body").prepend(renderer.view);

    render();

  }

  function render() {

    renderer.render(stage);
    requestAnimationFrame(render);
  }

  function onDragStart(event)  {
      this.data = event.data;
      this.alpha = 1;
      this.dragging = true;
  }

  function onDragEnd()  {
      this.alpha = 1;
      this.dragging = false;
      this.data = null;
  }

  function onDragMove() {
      if (this.dragging)  {
          var newPosition = this.data.getLocalPosition(this.parent);
          this.position.x = newPosition.x;
          this.position.y = newPosition.y;
      }
  }

  function roomFound() {

    $clientID.html(party.socket.id);
  }

  function roomNotFound() {

    $clientID.html("Room Not Found!");
  }

  function hostLeft() {

    $clientID.html("Host has left");
  }


  return party;

} ();


var Screen = function(socket, sprite, x, y) {

  this.socket = socket;
  this.sprite = sprite;
  this.x = x;
  this.y = y;
}
