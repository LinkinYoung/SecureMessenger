var express = require('express');
var server = require('http').createServer();
var receiver = require('socket.io')(server);
var sender = require('socket.io-client');

port = Math.floor(Math.random() * 10000 + 20000);
server.on("error", (e) => {
  alert("端口被占用，请重启app");
})
server.listen(port);
alert(port);

var incoming = null;
receiver.on('connection', function(socket){
  incoming = socket;
  alert("a client connected");
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    alert(data.my);
  });
  socket.on('disconnect', function(){
    alert("a client disconnected");
  });
  socket.on("message", function(data) {
    alert(data.user + data.message);
  })
});

var socket;
function makeConnection() {
  target = document.getElementById("port").value;
  socket = sender.connect("http://localhost:" + target);
  socket.on('news', function (data) {
    alert(data.hello);
    socket.emit('my other event', { my: 'data' });
  });
  socket.on('message', function(data) {
    alert(data.user + data.message);
  })
}
function sendMsg() {
  message = document.getElementById("msg").value;
  if (incoming != null) {
    incoming.emit("message", {user: "u1", message: message}, function() {
      document.getElementById('msg').value = "sent!";
    });
  } else {
    alert("not responding");
    socket.emit("message", {user: "u1", message: message}, function() {
      document.getElementById('msg').value = "sent!";
    })
  }
}