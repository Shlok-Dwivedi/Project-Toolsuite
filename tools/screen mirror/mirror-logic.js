'use strict';

let peer = null;
let localStream = null;

async function startSharing() {
    try {
        // 1. Get the screen stream first
        localStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: false 
        });
        
        const video = document.getElementById('videoElement');
        video.srcObject = localStream;

        const shortId = Math.floor(1000 + Math.random() * 9000).toString();
        // Use a clean PeerJS configuration
        peer = new Peer('toolsuite-' + shortId, {
            debug: 2
        });

        peer.on('open', () => {
            document.getElementById('setup-zone').classList.add('hidden');
            document.getElementById('display-zone').classList.remove('hidden');
            document.getElementById('share-id-display').innerHTML = `CODE: <strong style="font-size:2rem;">${shortId}</strong>`;
            document.getElementById('status-text').innerText = "WAITING FOR MOBILE...";
        });

        peer.on('call', (call) => {
            console.log("Phone is connecting...");
            call.answer(localStream);
            
            call.on('stream', () => {
                document.getElementById('status-text').innerText = "CONNECTED & STREAMING";
            });
        });

    } catch (err) {
        alert("Screen share failed: " + err.message);
    }
}

function joinStream() {
    const code = document.getElementById('joinCode').value.trim();
    if (!code) return;

    peer = new Peer(); // Mobile gets random ID

    peer.on('open', () => {
        document.getElementById('status-text').innerText = "SHAKING HANDS...";
        document.getElementById('setup-zone').classList.add('hidden');
        document.getElementById('display-zone').classList.remove('hidden');

        // On mobile, we MUST provide a dummy stream or an empty MediaStream
        // so the laptop has something to "answer" to.
        const call = peer.call('toolsuite-' + code, new MediaStream());

        call.on('stream', (remoteStream) => {
            console.log("Stream received on mobile!");
            const video = document.getElementById('videoElement');
            
            // Critical for Mobile: Set srcObject then explicitly call .play()
            video.srcObject = remoteStream;
            
            document.getElementById('status-text').innerText = "LIVE VIEW";
            
            // Force play for Safari/Chrome mobile
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // If it fails, show a button to the user to manually play
                    document.getElementById('status-text').innerHTML = 
                        '<button onclick="document.getElementById(\'videoElement\').play()">TAP TO VIEW STREAM</button>';
                });
            }
        });
    });

    peer.on('error', (err) => {
        document.getElementById('status-text').innerText = "ERROR: " + err.type;
        console.error(err);
    });
}
