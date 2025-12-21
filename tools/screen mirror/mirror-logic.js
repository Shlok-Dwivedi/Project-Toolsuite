'use strict';

let peer = null;
let localStream = null;

// 1. SHARING YOUR SCREEN (LAPTOP)
async function startSharing() {
    try {
        // Request screen capture FIRST (User Gesture)
        localStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { cursor: "always" },
            audio: false 
        });
        
        // Show local preview
        const video = document.getElementById('videoElement');
        video.srcObject = localStream;

        // Generate ID
        const shortId = Math.floor(1000 + Math.random() * 9000).toString();
        peer = new Peer('toolsuite-' + shortId);

        peer.on('open', (id) => {
            document.getElementById('setup-zone').classList.add('hidden');
            document.getElementById('display-zone').classList.remove('hidden');
            document.getElementById('share-id-display').innerHTML = `SHARE CODE: <span style="font-size:2rem; background:#000; color:#fff; padding:0 10px;">${shortId}</span>`;
            document.getElementById('status-text').innerText = "Waiting for viewer...";
        });

        // When the phone calls, answer with the stream we already captured
        peer.on('call', (call) => {
            console.log("Receiving call from phone...");
            call.answer(localStream);
            document.getElementById('status-text').innerText = "STREAMING LIVE";
        });

        peer.on('error', (err) => {
            console.error(err);
            alert("Connection error. Is this code already in use?");
        });

    } catch (err) {
        alert("Permission denied or error: " + err.message);
    }
}

// 2. WATCHING A SCREEN (PHONE)
function joinStream() {
    const code = document.getElementById('joinCode').value.trim();
    if (code.length < 4) return alert("Enter the 4-digit code.");

    // Phone gets a random ID
    peer = new Peer();

    peer.on('open', (id) => {
        document.getElementById('setup-zone').classList.add('hidden');
        document.getElementById('display-zone').classList.remove('hidden');
        document.getElementById('status-text').innerText = "Connecting to " + code + "...";

        // Call the laptop. We don't send a stream (null), we just wait for theirs.
        const call = peer.call('toolsuite-' + code, new MediaStream()); 
        
        call.on('stream', (remoteStream) => {
            console.log("Stream received!");
            const video = document.getElementById('videoElement');
            video.srcObject = remoteStream;
            document.getElementById('status-text').innerText = "VIEWING REMOTE SCREEN";
            
            // Safari/iOS fix: videos often need an explicit play() call
            video.play().catch(e => console.log("Auto-play blocked, wait for user interaction."));
        });

        call.on('error', (err) => {
            document.getElementById('status-text').innerText = "Connection Failed.";
        });
    });
}
