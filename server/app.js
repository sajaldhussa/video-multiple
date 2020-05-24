const express = require('express')
const app = express()
app.use(express.static('../client/', {index: 'index.html'}))

const server = app.listen(3000, function(){
	console.log("Express server listening on port 3000");
});
var io = require('socket.io')(server);

const MeetingRoutes = require('./routes/meeting')
app.use('/meeting', MeetingRoutes)

io.on('connection', function(socket){
	io.sockets.emit("user-joined", socket.id, io.engine.clientsCount, Object.keys(io.sockets.clients().sockets));

	socket.on('signal', (toId, message) => {
		io.to(toId).emit('signal', socket.id, message);
  	});

    socket.on("message", function(data){
		io.sockets.emit("broadcast-message", socket.id, data);
    })

	socket.on('disconnect', function() {
		io.sockets.emit("user-left", socket.id);
	})
});

module.exports = server
