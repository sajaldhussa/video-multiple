const express = require('express')
const Router = express.Router();
Router.use(express.urlencoded())

var AWS = require("aws-sdk");

let awsConfig = {
    "region": "us-east-2",
    "endpoint": "http://dynamodb.us-east-2.amazonaws.com",
    "accessKeyId": "AKIAJLU6BFKKGNTGRADQ", "secretAccessKey": "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"
};
AWS.config.update(awsConfig);

let docClient = new AWS.DynamoDB.DocumentClient();
const server = require('.././app')
var io = require('socket.io')(server);
Router.get('/:id', function (req, res) {
    const meetingId = req.params.id;
    res.sendFile('index.html', { root: '../client' });
    io.on('connection', function(socket){
        socket.join(meetingId, function(room) {
            room.emit("user-joined", Object.keys(room.sockets.clients().sockets).length, Object.keys(room.sockets.clients().sockets));

            room.on('signal', (toId, message) => {
                room.emit('signal', socket.id, message);
              });
        
              room.on("message", function(data){
                room.emit("broadcast-message", socket.id, data);
            })
        
            room.on('disconnect', function() {
                room.emit("user-left", socket.id);
            })
          });
    });
  })

let save = function (email) {

    const  id = uniqid();
    var input = {
        "user_id": email, "created_on": new Date().toString(),
        "activated": false, "meeting_id": id,"verified": false
    };
    var params = {
        TableName: "users",
        Item:  input
    };
    docClient.put(params, function (err, data) {

        if (err) {
            console.log("users::save::error - " + JSON.stringify(err, null, 2));                      
        } else {
            console.log("users::save::success" );    
        }
    });
    return id;  
}

module.exports = Router;