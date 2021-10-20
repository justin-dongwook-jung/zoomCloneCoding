const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');
const call = document.getElementById('call');

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) option.selected = true;
      camerasSelect.appendChild(option);
    })
  } catch (e) {
    console.log('getCamera error', e);
  }
}

async function getMedia(deviceId){
  const initConstrains = { audio: false, video: { facingMode: 'user' } };
  const cameraConstrains = { audio: false, video: { deviceId: { exact: deviceId } } };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstrains : initConstrains);
    myFace.srcObject = myStream;

    if(!deviceId)  await getCameras();
  } catch (e) {
    console.log(`getMedia error`, e);
  }
}

function handleMuteClick() {
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
  muteBtn.innerText = muted? 'Mute' : 'Unmute'
  muted = !muted;
}

function handleCameraClick() {
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
  cameraBtn.innerText = cameraOff ? 'Camera Off' : 'Camera On'
  cameraOff = !cameraOff;
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);

}

muteBtn.addEventListener('click', handleMuteClick)
cameraBtn.addEventListener('click', handleCameraClick)
camerasSelect.addEventListener('input', handleCameraChange)

// Welcome Form
const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

async function initCall(){
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event){
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  await initCall();
  socket.emit('join_room', input.value);
  roomName = input.value;
  input.value = '';
}
welcomeForm.addEventListener('submit', handleWelcomeSubmit)

// Socket Code

socket.on('welcome', async () => {
  const offer = await myPeerConnection.createOffer();
  await myPeerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, roomName);
})

socket.on('offer', async offer => {
  await myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  await myPeerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomName);
})

socket.on('answer', async answer => {
  await myPeerConnection.setRemoteDescription(answer);
})

socket.on('ice', async ice => {
  await myPeerConnection.addIceCandidate(ice);
})

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myPeerConnection.addEventListener('icecandidate', handleIce);
  myPeerConnection.addEventListener('addstream', handleAddStream);
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
  socket.emit('ice', data.candidate, roomName);
}

function handleAddStream(data){
  const peerFace = document.getElementById('peerFace');
  peerFace.srcObject = data.stream;
}
