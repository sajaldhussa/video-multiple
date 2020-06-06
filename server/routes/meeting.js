const express = require('express')
const app = express()
const Router = express.Router();
Router.use(express.urlencoded())

var AWS = require("aws-sdk");

AWS.config.loadFromPath('.././config/config.json');

let docClient = new AWS.DynamoDB.DocumentClient();
const server = require('.././app')
var io = require('socket.io')(server);
Router.get('/:id', function (req, res) {
    const meetingId = req.params.id;
    res.sendFile('index.html', { root: '../client' });
    app.set('meetingId', meetingId);
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