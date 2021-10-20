const socket = io();

const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const camerasSelect = document.getElementById('cameras');

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(device => device.kind === 'videoinput');
  const currentCamera = myStream.getVideoTracks()[0];
  cameras.forEach(camera => {
    const option = document.createElement('option');
    option.value = camera.deviceId;
    option.innerText = camera.label;
    if(currentCamera.label === camera.label)  option.selected = true;
    camerasSelect.appendChild(option);
  })
}

async function getMedia(deviceId){
  const initConstrains = {
    audio: true,
    video: { facingMode: 'user' }
  }
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } }
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConstrains : initConstrains);
    myFace.srcObject = myStream;

    if(!deviceId){
      await getCameras();
    }
  } catch (e) {
    console.log(`get media error`, e);
  }
}

getMedia()

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
