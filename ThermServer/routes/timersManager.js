const thermManager = require("./thermManager");
const shellyMgr = require("./shellyManager");
const globaljs = require("./global");
const config = require("./config");

let releTimer = [];

var checkTemperature = function () {
  var options = {
    usePromise: true
  };
  console.log("Start Timer for CheckTemperature ..");
  new Promise(function (resolve, reject) {
    thermManager.checkThermostatStatus(options, resolve, reject);
  })
    .then(function (options) {
      console.log(
        "Aggiornato stato timer : " + JSON.stringify(options.response)
      );
    })
    .catch(function (error) {
      console.log("Errore in task checkThermostatStatus : " + error);
    });
  setTimeout(checkTemperature, globaljs.MONITOR_TIMEOUT);
};


var manageLightRele = function (options) {
  //let timeout = true;

  let shellyCommand = {
    command: config.TypeShellyCommand.COMMAND,
    status: 1,
    deviceid: options.deviceid,
    macAddress : options.macAddress,
    timeoutRunning: new Date(),
    timeout: 20000
  };

  // verifica se Timer già impostato
  let entry = null;
  for (let ix = 0; ix < releTimer.length; ix++) {
    if (releTimer[ix].shellyId === shellyCommand.deviceid) {
      entry = releTimer[ix];
      releTimer.splice(ix);
      break;
    }
  }
  if (entry != null) {
    // Timer trovato .. lo resetto
    clearTimeout(entry.timeoutObj)
  }
  if (typeof options.timeoutRunning === "undefined") {
    // prima volta
    callShelly(shellyCommand);
  } else {
    // verifico se lo stato è 0 se si spegni
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_MOTIONSTATS),
      selectOne: true,
      sort: { time: -1 },
      filter : {
        macAddress: options.macAddress
      }
    };
    return new Promise(function (resolveIn, rejectIn) {
      new Promise(function (resolve, reject) {
        mongoDBMgr.genericQuery(options, resolve, reject);
      })
        .then(function (options) {
          options.shellyData = options.response;
          if (options.conf.flagReleTemp === 1) {
            //updateTemperatureReleStatus(options, resolveIn, rejectIn);
            resolveIn(options);
          }
          else {
            shellyCommand = options;
            shellyCommand.status = 0;
            shellyCommand.timeout = 0;
            callShelly(shellyCommand);
            resolveIn(options);
          }
        })
        .catch(function (error) {
          rejectIn(error);
        });
    });

  }

  // console.log("Start Timer for manageLightRele ..");
  // shellyMgr.shellySendCommand({shellyCommand : shellyCommand});
  // shellyCommand.timeoutRunning = true;
  // if (timeout)
  // {
  //     entry = 
  //     {
  //       timeoutObj : setTimeout(manageLightRele, 20000, shellyCommand),
  //       shellyId : shellyCommand.deviceid
  //     }
  //     releTimer.push(entry);
  // }

};

let callShelly = function (shellyCommand) {
  console.log("Start Timer for manageLightRele ..");
  shellyMgr.shellySendCommand({ shellyCommand: shellyCommand });
  shellyCommand.timeoutRunning = true;
  if (shellyCommand.timeout > 0) {
    entry =
    {
      timeoutObj: setTimeout(manageLightRele, shellyCommand.timeout, shellyCommand),
      shellyId: shellyCommand.deviceid
    }
    releTimer.push(entry);
  }
}
exports.checkTemperature = checkTemperature;
exports.manageLightRele = manageLightRele;
