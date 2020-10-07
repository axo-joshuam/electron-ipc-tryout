const {
  ipcRenderer: ipc,
  remote
} = require('electron');

const fp = require('lodash/fp');

remote.getCurrentWindow().openDevTools();

let sendIndex = 0;
let returnIndex = 0;

let returnedIndexes = [];

function sendIpcMessage() {
  const message = { sendIndex };
  sendIndex++;
  setTimeout(() => ipc.send('ipc-check', message), Math.random() * 30);
}

const sendResults = fp.debounce(3000, () => ipc.send('ipc-results', returnedIndexes));

function getIpcMessage(event, args) {
  console.info('ye message', args);
  const { incomingIndex, outgoingIndex, winId } = args;
  returnedIndexes.push({ incomingIndex, outgoingIndex, winId });
  sendResults();
}

function doIPC() {
  console.info('aaand go');
  while (sendIndex < 6000) {
    sendIpcMessage();
  }
}

ipc.on('ipc-check', getIpcMessage);
ipc.on('ipc-start', doIPC);

ipc.send('ipc-ready');
