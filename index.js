// @flow
const { app, BrowserWindow, ipcMain: ipc } = require('electron');

const fp = require('lodash/fp');

const windows = [];

const windowsReady = {};

const windowOnReady = {};

const resultsByWindowId = {};

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  windowsReady[win.id] = new Promise(resolve => windowOnReady[win.id] = resolve).then(() => console.info(`yarr ${win.id} be ready`));

  win.title = `IPC test ${win.id}`;
  win.loadFile('src/index.html');
  windows.push(win);
}

function handleWindowReady(event, args) {
  console.info('window is ready');
  console.info(event.sender.id);
  windowOnReady[event.sender.id]();
}

let outgoingIndex = 0;

function onIpc(event, args) {
  const { sendIndex: incomingIndex } = args;
  windows.forEach(win => win.send('ipc-check', { incomingIndex, outgoingIndex, winId: event.sender.id }));
  outgoingIndex++;
}

const validateResults = fp.debounce(3000, () => {
  console.info('begin validation');
  const resultArray = Object.values(resultsByWindowId)[0];
  for (let i = 0; i < resultArray.length; i++) {
    if (resultArray[i].incomingIndex !== i) {
      console.error(`${i} != ${resultArray[i].incomingIndex}`);
    }
  }
  console.info('ye finish');
  // const validated = resultArray.map((values, ix) => {
  //   if (ix === 0) {
  //     values.valid = true;
  //     return values;
  //   }
  //   const prev = resultArray[ix];
  //   if (prev.length !== values.length) {
  //     values.valid = false;
  //     console.info(`invalid result, different length ${prev.length} !== ${values.length}`);
  //     return values;
  //   }
  //   values.valid = true;
  //   for (let i = 0; i < prev.length; i++) {
  //     let pindex = prev[i];
  //     let vindex = values[i];
  //     if (vindex.outgoingIndex !== i) {
  //       console.info(`wrong outgoing index at ${i} ${vindex.outgoingIndex}`);
  //       values.valid = false;
  //     }
  //     if (pindex.incomingIndex !== vindex.incomingIndex) {
  //       values.valid = false;
  //       console.info(`item ${i} incorrect incoming index ${pindex.incomingIndex} ${vindex.incomingIndex}`);
  //     }
  //     if (pindex.outgoingIndex !== vindex.outgoingIndex) {
  //       values.valid = false;
  //       console.info(`item ${i} incorrect outgoing index ${pindex.outgoingIndex} ${vindex.outgoingIndex}`);
  //     }
  //     if (pindex.winId !== vindex.winId) {
  //       values.valid = false;
  //       console.info(`item ${i} incorrect winId ${pindex.winId} ${vindex.winId}`);
  //     }
  //   }
  //   return values;
  // });
  // validated.forEach(value => console.info(`result is valid? ${value.valid}`));
})

function handleResults(event, args) {
  const { id: winId } = event.sender;

  console.info(`yarrr results for ${winId}`);

  resultsByWindowId[winId] = args;

  validateResults();
}

ipc.on('ipc-check', onIpc);
ipc.on('ipc-ready', handleWindowReady);
ipc.on('ipc-results', handleResults);

app.whenReady().then(() => {
  // for (let i = 0; i < 30; i++) {
    createWindow();
  // }

  Promise.all(Object.values(windowsReady)).then(() => {
    console.info('yar.. windows be ready arrrrr');
    windows.forEach(win => win.send('ipc-start'));
  });
});
