var localVideo;
var firstPerson = false;
var socketCount = 0;
var socketId;
var localStream;
var connections = [];

var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};

function pageReady() {

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');
    let roomName;

    var constraints = {
        video: true,
        audio: true,
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(getUserMediaSuccess)
            .then(function(){

                socket = io.connect(config.host, {secure: true});
                const url = window.location.href
                const meetingId = url.split("meeting/")[1];
                socket.emit('create', meetingId);
                socket.on('signal', gotMessageFromServer);    

                socket.on('connect', function(){

                    socketId = socket.id;

                    socket.on('user-left', function(id){
                        var video = document.querySelector('[data-socket="'+ id +'"]');
                        var parentDiv = video.parentElement;
                        video.parentElement.parentElement.removeChild(parentDiv);
                    });


                    socket.on('user-joined', function(id, count, clients, room){
                        console.log(room);
                        roomName = room;
                        clients.forEach(function(socketListId) {
                            if(!connections[socketListId]){
                                connections[socketListId] = new RTCPeerConnection(peerConnectionConfig);
                                //Wait for their ice candidate       
                                connections[socketListId].onicecandidate = function(){
                                    if(event.candidate != null) {
                                        console.log('SENDING ICE');
                                        socket.emit('signal', socketListId, JSON.stringify({'ice': event.candidate}),roomName);
                                    }
                                }

                                //Wait for their video stream
                                connections[socketListId].onaddstream = function(){
                                    gotRemoteStream(event, socketListId)
                                }    

                                //Add the local video stream
                                connections[socketListId].addStream(localStream);                                                                
                            }
                        });

                        //Create an offer to connect with your local description
                        
                        if(count >= 2){
                            connections[id].createOffer().then(function(description){
                                connections[id].setLocalDescription(description).then(function() {
                                    // console.log(connections);
                                    socket.emit('signal', id, JSON.stringify({'sdp': connections[id].localDescription}),roomName);
                                }).catch(e => console.log(e));        
                            });
                        }
                    });                    
                })       
        
            }); 
    } else {
        alert('Your browser does not support getUserMedia API');
    } 
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.srcObject = stream;
}

function gotRemoteStream(event, id) {

    var videos = document.querySelectorAll('video'),
        video  = document.createElement('video'),
        div    = document.createElement('div')

    video.setAttribute('data-socket', id);
    video.srcObject = event.stream;
    video.autoplay    = true; 
    video.muted       = false;
    video.playsinline = true;

    var iconDiv = document.createElement('div');
    iconDiv.className ="video-control";
    var icon = document.createElement('i');
    icon.className ="fas fa-volume-mute";

    iconDiv.appendChild(icon);
    div.appendChild(video);   
    div.appendChild(iconDiv);      
    document.querySelector('.videos').appendChild(div);
    updateLayOut();
}

function updateLayOut(){
    var videos = document.querySelectorAll('video');
    var height = screen.height;
    var width = screen.width;
    var peers = videos.length;
    var gridRow;
    var gridCol =2;

    if(peers<=2){
        gridRow=1;
    }
    if(peers>2 && peers<=6){
        gridRow=2;
    }
    if(peers>6 && peers<=9){
        gridRow=3;
    }
    if(peers>9 && peers<=12){
        gridRow=4;
    }

    if(peers>4){
        gridCol=3;  
    }
    for (var i = 0; i < peers; i++) {
        videos[i].style.width=((width/gridCol)-10+"px");
        videos[i].style.height=(height/gridRow+"px");
    }
}

function gotMessageFromServer(fromId, message) {

    //Parse the incoming signal
    var signal = JSON.parse(message)

    //Make sure it's not coming from yourself
    if(fromId != socketId) {

        if(signal.sdp){            
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {                
                if(signal.sdp.type == 'offer') {
                    connections[fromId].createAnswer().then(function(description){
                        connections[fromId].setLocalDescription(description).then(function() {
                            socket.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
                        }).catch(e => console.log(e));        
                    }).catch(e => console.log(e));
                }
            }).catch(e => console.log(e));
        }
    
        if(signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
        }                
    }
}