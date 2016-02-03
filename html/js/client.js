'use strict';

var Party = function() {

  var party = {};

  party.partyID;
  party.hash;
  party.clients = [];
  var $wrap;
  var $roomID;
  var $clientID;
  var $clientList;
  //var $canvas;
  //var context;
  //var $phoneImg;
  var $catImg;


  var renderer;
  var stage;
  var texture;

  party.renderer = renderer;
  party.stage = stage;

  $(document).on('ready', function() {

    $wrap = $('.wrap');
    $roomID = $('#roomID');
    $clientID = $('#clientID');
    $clientList = $('#clients');

    if(window.location.hash) { // client trying to join a room

      //$wrap.hide();
      $roomID.hide();
      $clientList.hide();
      var agent = navigator.userAgent.substring(0,5);

      party.hash = window.location.hash.substring(1);
      //possible to get IP address BEFORE connection established?
      party.socket = io.connect('192.168.108.27:80', { transports: ['websocket'], query:"partyID="+party.hash+"&agent="+agent });
      party.socket.on('messageForScreen', messageToScreen);

    }
    else { // create a new room

      createCanvas();

      party.socket = io.connect('192.168.108.27:80', { transports: ['websocket'] });
      party.socket.on('messageForHost', messageToHost);

    }

    party.socket.on('clientAdded', clientAdded);

  });

  function messageToHost(data) {

      console.log("got an id from server", data);
      $roomID.html(data.ip + "/#" + data.id);
    //  $clientID.html(party.socket.id);
      console.log(party.socket.id);
  }

  function messageToScreen(data) {

    $clientID.html(party.socket.id);
  }


  function clientAdded(data) { // this is currently running for non-hosts, need to fix

    console.log("new client added", data.id, party.socket.id);
    var screenID = party.socket.id;
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

    var basicText = new PIXI.Text(screenID);
    basicText.x = -140;
    basicText.y = 60;
    basicText.scale.set(0.8);
    sprite.addChild(basicText);

    var screen = new Screen(sprite, randX, randY);
    party.clients.push(screen);
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



  return party;

} ();





var Screen = function(id, x, y) {

  this.id = id;
  this.x = x;
  this.y = y;
}
