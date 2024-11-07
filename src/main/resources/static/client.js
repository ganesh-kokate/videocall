const LOCAL_IP_ADDRESS = "192.168.3.107";

const getElement = id => document.getElementById(id);
const [btnConnect, btnToggleVideo, btnToggleAudio, divRoomConfig, roomDiv, roomNameInput, localVideo, remoteVideo] = ["btnConnect",
    "toggleVideo", "toggleAudio", "roomConfig", "roomDiv", "roomName",
    "localVideo", "remoteVideo"].map(getElement);
let remoteDescriptionPromise, roomName, localStream, remoteStream,
    rtcPeerConnection, isCaller;


//here we use localhost so we don't need to signaling the server
//but at real time two differnt devices dosent know their ip so we need to do signaling
const iceServers = {
    iceServers: [
       // {urls: 'stun:stun.l.google.com:19302'}
    ]
};

//using io.connect we conect to server on specified address
let socket = io.connect(window.location.origin, { secure: true , transports: ["websocket"]});

//let socket = io.connect("http://192.168.120.106:8000");


const streamConstraints = {
    'video': true,
    'audio': true
}


btnToggleVideo.addEventListener("click", () => toggleTrack("video"));
btnToggleAudio.addEventListener("click", () => toggleTrack("audio"));


function toggleTrack(trackType) {
    // Exit the function if `localStream` is not available
    if (!localStream) {
        return;
    }

    // Get the correct track (video or audio) based on `trackType`
    let track;
    if (trackType === "video") {
        track = localStream.getVideoTracks()[0];
    } else {
        track = localStream.getAudioTracks()[0];
    }

    // Toggle the track's enabled state (true becomes false, false becomes true)
    let newEnabledState = !track.enabled;
    track.enabled = newEnabledState;

    // Get the button to toggle (e.g., "toggleVideo" or "toggleAudio")
    let buttonId = "toggle" + trackType.charAt(0).toUpperCase() + trackType.slice(1);
    let toggleButton = document.getElementById(buttonId);

    // Get the icon element (e.g., "videoIcon" or "audioIcon")
    let iconId = trackType + "Icon";
    let icon = document.getElementById(iconId);

    // Change button styles to show if it's enabled or disabled
    if (newEnabledState) {
        toggleButton.classList.add("enabled-style");
        toggleButton.classList.remove("disabled-style");
    } else {
        toggleButton.classList.add("disabled-style");
        toggleButton.classList.remove("enabled-style");
    }

    // Update the icon based on the track type and whether it's enabled or disabled
    if (trackType === "video") {
        if (newEnabledState) {
            icon.classList.add("bi-camera-video-fill");
            icon.classList.remove("bi-camera-video-off-fill");
        } else {
            icon.classList.add("bi-camera-video-off-fill");
            icon.classList.remove("bi-camera-video-fill");
        }
    } else if (trackType === "audio") {
        if (newEnabledState) {
            icon.classList.add("bi-mic-fill");
            icon.classList.remove("bi-mic-mute-fill");
        } else {
            icon.classList.add("bi-mic-mute-fill");
            icon.classList.remove("bi-mic-fill");
        }
    }
}

//-----------------------------------------------------------------------------------------------------------------------------------------

//when user clicks on "connect" this function will run
//onclick is event ... arrow function ...
btnConnect.onclick = () => {
    if (roomNameInput.value === "") {
        alert("Room can not be null!");
    } else {
        roomName = roomNameInput.value;
        socket.emit("joinRoom", roomName); //emit fun trigger the event by passing name of the event and some optional data and that event handled by server side
        divRoomConfig.classList.add("d-none");
        roomDiv.classList.remove("d-none");
    }
};

const handleSocketEvent = (eventName, callback) => socket.on(eventName,
    callback);


    // navigator.mediaDevices.getUserMedia({ video: true })
    //     .then(stream => {
    //         localStream = stream;
    //         localVideo.srcObject = stream;
    //         isCaller = true;
    //     })
    //     .catch(error => {
    //         console.error('Error accessing media devices.', error);
    //     });



//removed  and replace with ()
handleSocketEvent("created",e => {
    navigator.mediaDevices.getUserMedia(streamConstraints)  //navigator.mediaDevices.getUserMedia() is a Web API function that prompts the user for permission to use their camera and/or microphone based on the provided streamConstraints.
        .then(stream => { //If the user grants permission, getUserMedia() returns a promise that resolves with a MediaStream object (representing the audio and/or video).
        localStream = stream; // assigns the media stream to the localStream variable, which allows other parts of the code to access the user's audio and video stream.
        localVideo.srcObject = stream; //sets the srcObject property of a <video> element (referenced by localVideo) to the media stream. This displays the local video feed (from the camera) in the browser.
        isCaller = true; //isCaller = true; sets a flag indicating that this user is the "caller" or initiator of the video call. This flag is likely used later in the application to differentiate between the caller and receiver during signaling and setup.
    }).catch(console.error); //If there’s an error (for example, if the user denies camera/microphone access), the .catch() block is executed.
});

handleSocketEvent("joined", e => {
    console.log(e);
    navigator.mediaDevices.getUserMedia(streamConstraints).
    then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit("ready", roomName);
    }).catch(console.error);
});



handleSocketEvent("candidate", e => {
    if (rtcPeerConnection)
    {
        const candidate = new RTCIceCandidate({
            sdpMLineIndex: e.label, candidate: e.candidate,
        });
        //addIceCandidate() is used to receive and process remote ICE candidate information sent by another peer.
        rtcPeerConnection.onicecandidateerror = (error) => {
            console.error("Error adding ICE candidate: ", error);
        };

        if (remoteDescriptionPromise) {
            remoteDescriptionPromise
                .then(() => {
                    if (candidate != null) {
                        return rtcPeerConnection.addIceCandidate(candidate);
                    }
                })
                .catch(error => console.log(
                    "Error adding ICE candidate after remote description: ", error));
        }
    }
});

handleSocketEvent("ready", e => {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers); 
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection
            .createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription) ;
                socket.emit("offer", {
                    type: "offer", sdp: sessionDescription, room: roomName,
                });
            })
            .catch(error => console.log(error));
    }
});

handleSocketEvent("offer", e => {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);

        if (rtcPeerConnection.signalingState === "stable") {
            remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
                new RTCSessionDescription(e));
            remoteDescriptionPromise
                .then(() => {
                    return rtcPeerConnection.createAnswer();
                })
                .then(sessionDescription => {
                    rtcPeerConnection.setLocalDescription(sessionDescription);
                    socket.emit("answer", {
                        type: "answer", sdp: sessionDescription, room: roomName,
                    });
                })
                .catch(error => console.log(error));
        }
    }
});

handleSocketEvent("answer", e => {
    if (isCaller && rtcPeerConnection.signalingState === "have-local-offer") {
        remoteDescriptionPromise = rtcPeerConnection.setRemoteDescription(
            new RTCSessionDescription(e));
        remoteDescriptionPromise.catch(error => console.log(error));
    }
});

handleSocketEvent("userDisconnected", (e) => {
    remoteVideo.srcObject = null;
    isCaller = true;
});

handleSocketEvent("setCaller", callerId => {
    isCaller = socket.id === callerId;
});

handleSocketEvent("full", e => {
    alert("room is full!");
    window.location.reload();
});

//onicecandidate event handler is used to generate and send your own ICE candidate information to another peer
const onIceCandidate = e => {
    console.log(e);
    if (e.candidate) {
        console.log("sending ice candidate");
        socket.emit("candidate", {
            type: "candidate",
            label: e.candidate.sdpMLineIndex,
            id: e.candidate.sdpMid,
            candidate: e.candidate.candidate,
            room: roomName,
        });
    }
}

const onAddStream = e => {
    remoteVideo.srcObject = e.streams[0];
    remoteStream = e.stream;
}







