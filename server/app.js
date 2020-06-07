const express = require('express')
const app = express()
app.use(express.static('../client/', {index: 'index.html'}))

const server = app.listen(3000, function(){
	console.log("Express server listening on port 3000");
});
var io = require('socket.io')(server);

const MeetingRoutes = require('./routes/meeting')
app.use('/meeting', MeetingRoutes)

app.set('socketio', io);
let meetingId;;
io.on('connection', function(socket){
   socket.on('create', function(room) {
	   console.log(room);
	  meetingId = room;
      socket.join(room);
      io.sockets.in(room).emit("user-joined", socket.id, io.nsps['/'].adapter.rooms[room].length, Object.keys(io.nsps['/'].adapter.rooms[room].sockets), room);
  });

	

	socket.on('signal', (toId, message) => {
		io.to(toId).emit('signal', socket.id, message);
  	});

    socket.on("message", function(data){
		io.sockets.in(meetingId).emit("broadcast-message", socket.id, data);
    })

	socket.on('disconnect', function() {
		io.sockets.in(meetingId).emit("user-left", socket.id);
	})
});

module.exports = server
