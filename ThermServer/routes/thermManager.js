const globaljs = require("./global");
const config = require("./config");
const myutils = require("./utils/myutils");
const mongoDBMgr = require("./mongoDBManager");
const mongoDBStatMgr = require("./mongoDBStatManager");

const shellyMgr = require("./shellyManager");
const netList = require("network-list");

var callback = function(options, error) {
  if (error) options.error = error;
  let useCallBack = true;
  if (typeof options.usePromise != "undefined")
    useCallBack = !options.usePromise;
  if (useCallBack) {
    if (options.callback && options.callback.length > 0) {
      if (typeof options.callbackIndex === "undefined")
        options.callbackIndex = 0;
      if (options.callbackIndex < options.callback.length) {
        options.callback[options.callbackIndex++](options);
      }
    }
  } else {
    if (error) options.reject(error);
    else options.resolve(options);
  }
};

exports.callback = callback;
/**
 * Thermostat programming management
 */
exports.manageProgramming = function(options, resolveIn, rejectIn) {
  switch (options.action) {
    case config.TypeAction.READ:
      mongoDBMgr.readProgramming(options);
      break;
    case config.TypeAction.UPDATE:
      options.response = options.programm;
      mongoDBMgr.updateProgramming(options, resolveIn, rejectIn);
      break;
    case config.TypeAction.ADD:
    case config.TypeAction.DELETE:
      new Promise(function(resolve, reject) {
        mongoDBMgr.readProgramming(options, resolve, reject);
      })
        .then(function(options) {
          if (options.action == config.TypeAction.ADD)
            mongoDBMgr.addProgramming(options, resolveIn, rejectIn);
          else if (options.action == config.TypeAction.DELETE)
            mongoDBMgr.deleteProgramming(options, resolveIn, rejectIn);
        })
        .catch(function(error) {
          rejectIn(error);
        });
      break;
  }
};

/**
 * check and update thermostat configuration
 */
exports.checkConfigurationInternal = function(options) {};

/**
 * check and update thermostat configuration
 */
exports.monitorInternal = function(options) {
  mongoDBMgr.monitorSensorData(options);
};

exports.monitorReleData = function(options) {
  mongoDBMgr.monitorReleData(options);
};
/**
 * Thermostat register function
 */
exports.readConfigurationInternal = function(options) {
  //
  options.createIfNull = false;
  options.update = false;
  mongoDBMgr.readConfiguration(options);
};

/**
 * Update configuration
 */
exports.updateConfiguration = function(options, resolveIn, rejectIn) {
  mongoDBMgr.updateConfiguration(options, resolveIn, rejectIn);
};

/**
 * Update configuration
 */
exports.updateStatus = function(options, resolveIn, rejectIn) {
  try {
    let json = options.request;
    let req = JSON.parse(json);
    options.updateField = {
      statusThermostat: parseInt(req.statusThermostat)
    };
    options.macAddress = req.macAddress;
  } catch (error) {
    rejectIn(error);
  }
  new Promise(function(resolve, reject) {
    mongoDBMgr.updateConfigurationInternal(options, resolve, reject);
  })
    .then(function(options) {
      resolveIn(options);
    })
    .catch(function(error) {
      rejectIn(error);
    });
};

/**
 * Update configuration
 */
exports.updateConfigurationInternal = function(options) {
  mongoDBMgr.updateConfiguration(options);
};

/**
 * rigister a device
 */
exports.wifiRegisterInternal = function(options) {
  //
  options.createIfNull = true;
  mongoDBMgr.readConfiguration(options);
};

var readProgramming = function(options) {
  options.createIfNull = true;
  mongoDBMgr.readProgramming(options);
};

/**
 * Check if any shelly device is present. If so register it
 */
exports.shellyRegisterInternal = function(options) {
  console.log("Find shelly devices ..");
  netList.scan({ vendor: false, timeout: 10 }, (err, arr) => {
    if (err) {
      callback(options, err);
    } else {
      // array with all devices
      nAlive = 0;
      nShelly = 0;
      newFound = 0;
      for (let i = 0; i < arr.length; i++) {
        let entry = arr[i];
        if (entry.alive) {
          nAlive++;
          var mac = entry.mac != null ? entry.mac.toUpperCase() : "N/A";
          console.log(
            "Chech for IP address " + entry.ip + " with mac address " + mac
          );
          var outOptions = {
            ip: entry.ip,
            mac: mac
          };
          shellyMgr.updateShellyConfiguration(outOptions);
          newFound++;
        }
      }
      var out = {
        networkDevices: arr.length,
        networkDevicesAlive: nAlive,
        networkDevicesShelly: nShelly,
        networkDevicesNew: newFound
      };
      options.response = out;
      callback(options);
    }
  });
};

let checkThermostatStatus = function(options) {
  // recupera dispositivo rele termostato
  // recupera confugurazione e modalità di misura
  // recupera temperature
  // calcola
  mongoDBMgr.readThermostatProgramming(options);
};

exports.getReleData = function(options, resolveIn, rejectIn) {
  new Promise(function(resolve, reject) {
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_CONF),
      filter: {
        $or: [{ flagReleTemp: 1 }, { flagReleLight: 1 }]
      },
      selectOne: false
    };
    options.genericQuery = query;
    mongoDBMgr.genericQuery(options, resolve, reject);
  })
    .then(function(options) {
      if (options.response && options.response.length > 0) {
        query = {
          collection: globaljs.mongoCon.collection(globaljs.MONGO_SHELLYSTAT),
          selectOne: true,
          sort: { time: -1 }
        };
        let pIn = [];
        // recupero stato rele
        for (let ix = 0; ix < options.response.length; ix++)
          pIn.push(
            new Promise(function(resolve, reject) {
              let conf = options.response[ix];
              let nOptions = {
                genericQuery: query,
                usePromise: true,
                shellyId: conf.shellyMqttId,
                macAddress: conf.macAddress,
                location: conf.location,
                flagReleTemp: conf.flagReleTemp,
                flagReleLight: conf.flagReleLight,
                statusThermostat: conf.statusThermostat
              };
              nOptions.genericQuery.filter = {
                shellyId: nOptions.shellyId
              };
              mongoDBMgr.genericQuery(nOptions, resolve, reject);
            })
          );
        if (pIn.length > 0) {
          Promise.all(pIn)
            .then(function(optionsN) {
              options.response = [];
              for (let ix = 0; ix < optionsN.length; ix++) {
                let entry = optionsN[ix];
                let record = entry.response;
                record.location = entry.location;
                record.flagReleTemp = entry.flagReleTemp;
                record.flagReleLight = entry.flagReleLight;
                record.macAddress = entry.macAddress;
                if (record.flagReleTemp === 1)
                  record.statusThermostat = entry.statusThermostat;
                options.response.push(record);
              }
              resolveIn(options);
            })
            .catch(function(error) {
              rejectIn(error);
            });
        }
      } else resolveIn(options);
    })
    .catch(function(error) {
      rejectIn(error);
    });
};

exports.getSensorData = function(options, resolveIn, rejectIn) {
  new Promise(function(resolve, reject) {
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_CONF),
      filter: {
        $or: [{ flagTemperatureSensor: 1 }, { flagLightSensor: 1 }]
      },
      selectOne: false
    };
    options.genericQuery = query;
    mongoDBMgr.genericQuery(options, resolve, reject);
  })
    .then(function(options) {
      if (options.response) {
        query = {
          collection: globaljs.mongoCon.collection(globaljs.MONGO_SENSORSTAT),
          selectOne: true,
          sort: { time: -1 }
        };
        let optionsN = {
          genericQuery: query,
          usePromise: true
        };
        let pIn = [];
        for (let ix = 0; ix < options.response.length; ix++)
          pIn.push(
            new Promise(function(resolve, reject) {
              let nOptions = Object.assign({}, optionsN);
              nOptions.macAddress = options.response[ix].macAddress;
              nOptions.location = options.response[ix].location;
              nOptions.genericQuery.filter = {
                macAddress: nOptions.macAddress
              };
              mongoDBMgr.genericQuery(nOptions, resolve, reject);
            })
          );
        if (pIn.length > 0) {
          Promise.all(pIn)
            .then(function(optionsN) {
              options.response = [];
              for (let ix = 0; ix < optionsN.length; ix++) {
                let record = optionsN[ix].response;
                record.location = optionsN[ix].location;
                options.response.push(record);
              }
              resolveIn(options);
            })
            .catch(function(error) {
              rejectIn(error);
            });
        }
      } else resolveIn(options);
    })
    .catch(function(error) {
      rejectIn(error);
    });
};

exports.getStatistics = function(options, resolveIn, rejectIn) {
  // leggo sensori - rele
  // per ogni esegui map/reduce
  new Promise(function(resolve, reject) {
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_CONF),
      filter:
        options.statisticType === "RELE"
          ? {
              $or: [{ flagReleTemp: 1 }, { flagReleLight: 1 }]
            }
          : {
              $or: [{ flagTemperatureSensor: 1 }, { flagLightSensor: 1 }]
            },
      selectOne: false
    };
    options.genericQuery = query;
    mongoDBMgr.genericQuery(options, resolve, reject);
  })
    .then(function(options) {
      new Promise(function(resolve, reject) {
        options.configuration = options.response;
        //options.depth = 24; //  hour
        //options.interval = 5; //minutes

        options.endTime = new Date().getTime();
        options.startTime = options.endTime - options.depth * 60 * 60 * 1000;
        mongoDBStatMgr.getStatistics(options, resolve, reject);
      })
        .then(function(options) {
          resolveIn(options);
        })
        .catch(function(error) {
          rejectIn(error);
        });
    })
    .catch(function(error) {
      rejectIn(error);
    });
};

/**
 * Read rele configuration
 * @param {*} options
 */
let readRele = function(options) {
  return new Promise(function(resolve, reject) {
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_CONF),
      filter: { flagReleTemp: 1 },
      selectOne: true
    };
    options.genericQuery = query;
    mongoDBMgr.genericQuery(options, resolve, reject);
  });
};

/**
 * Read sensor configuration
 * @param {*} options
 */
let readSensor = function(options) {
  return new Promise(function(resolve, reject) {
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_CONF),
      filter: { flagTemperatureSensor: 1 },
      selectOne: false
    };
    options.genericQuery = query;
    mongoDBMgr.genericQuery(options, resolve, reject);
  });
};

/**
 * read temperature program
 * @param {*} options
 */
let readTempProgramming = function(options) {
  return new Promise(function(resolve, reject) {
    let query = {
      collection: globaljs.mongoCon.collection(globaljs.MONGO_PROG),
      filter: { _id: config.TypeProgramming.TEMP },
      selectOne: true
    };
    options.genericQuery = query;
    mongoDBMgr.genericQuery(options, resolve, reject);
  });
};

/**
 *
 * @param {*} options
 * @param {*} resolveIn
 * @param {*} rejectIn
 */
let updateTemperatureReleStatus = function(options, resolveIn, rejectIn) {
  // find the temperature rele
  let r1 = readRele(options);
  r1.then(function(options) {
    let conf = options.response;
    options.releConf = conf;
    // find all temperature sensore
    let r2 = readSensor(options);
    r2.then(function(options) {
      // compute temperature according to rele configuration
      options.tempSensor = options.response;
      // read actual programming
      let r3 = readTempProgramming(options);
      r3.then(function(options) {
        evaluateTemperature(options, resolveIn, rejectIn);
        resolveIn(options);
      }).catch(function(error) {
        rejectIn(error);
      });
    }).catch(function(error) {
      rejectIn(error);
    });
  }).catch(function(error) {
    rejectIn(error);
  });
};

let a = function(options, resolveIn, rejectIn) {
  new Promise(function(resolve, reject) {
    thermManager.updateTemperatureReleStatus(options, resolve, reject);
  })
    .then(function(options) {
      let status = config.TypeStatus.OFF;
      switch (conf.statusThermostat) {
        case config.TypeStatus.ON:
          status = config.TypeStatus.ON;
          break;
        case config.TypeStatus.AUTO:
          if (options.response.temperature < options.response.minTempAuto)
            status = config.TypeStatus.ON;
          break;
        case config.TypeStatus.MANUAL:
          if (options.response.temperature < options.response.minTempManual)
            status = config.TypeStatus.ON;
          break;
      }
      options.shellyCommand = {
        command: config.TypeShellyCommand.COMMAND,
        status: status,
        deviceid: options.conf.shellyMqttId
      };
      shelly.shellySendCommand(options);
      resolveIn(options);
    })
    .catch(function(error) {
      rejectIn(error);
    });
};

let checkThermostatStatus2 = function(options, resolveIn, rejectIn) {
  new Promise(function(resolve, reject) {
    updateTemperatureReleStatus(options, resolve, reject);
  })
    .then(function(options) {
      let status = config.TypeStatus.OFF;
      switch (conf.statusThermostat) {
        case config.TypeStatus.ON:
          status = config.TypeStatus.ON;
          break;
        case config.TypeStatus.AUTO:
          if (options.response.temperature < options.response.minTempAuto)
            status = config.TypeStatus.ON;
          break;
        case config.TypeStatus.MANUAL:
          if (options.response.temperature < options.response.minTempManual)
            status = config.TypeStatus.ON;
          break;
      }
      options.shellyCommand = {
        command: config.TypeShellyCommand.COMMAND,
        status: status,
        deviceid: options.conf.shellyMqttId
      };
      shelly.shellySendCommand(options);
      resolveIn(options);
    })
    .catch(function(error) {
      rejectIn(error);
    });
};

exports.checkThermostatStatus = a;
/**
 * get index of current program
 * @param {*} progRecord
 * @param {*} idProg
 */
var getIndexProgram = function(progRecord, idProg) {
  if (typeof idProg === "undefined") idProg = progRecord.activeProg;
  let programming = progRecord.programming;
  let index = 0;
  for (let ix = 0; ix < programming.length; ix++) {
    if (programming[ix].idProg === idProg) {
      index = ix;
      break;
    }
  }
  return index;
};

/**
 * evalute themperature
 */
let evaluateTemperature = function(options, resolveIn, rejectIn) {
  let temperature = 0;
  let conf = options.releConf;
  let sensor = options.tempSensor;
  let prog = options.response;
  let currentProg = prog.programming[getIndexProgram(prog)];
  console.log("Current program : " + currentProg.name);
  let primarySensor = conf.primarySensor;
  if (sensor && sensor.length > 0) {
    console.log(
      "trovati " + sensor.length + " sensori che misurano temperatura"
    );
    for (let ix = 0; ix < sensor.length; ix++) {
      if (primarySensor == sensor[ix].macAddress)
        primarySensor = sensor[ix].location;
      console.log(
        "Location " +
          sensor[ix].location +
          " - Temperatura " +
          sensor[ix].currentTemperature
      );
      console.log(
        "Location " + sensor[ix].location + " - Luce " + sensor[ix].currentLigth
      );
    }
  }
  // get current program
  let minTempManual = currentProg.minTempManual;
  let minTempAuto = currentProg.minTemp;
  let autoRecord = null;
  console.log("Calcolo fascia ora..");
  let now = new Date();
  let minsec = now.getHours() * 60 + now.getMinutes();
  let day = now.getDay();
  minTempAuto = currentProg.minTemp;
  // day su db 0 Lun - 7 Dom
  let dayDb = day - 1;
  if (dayDb < 0) dayDb = 6;
  console.log("Giorno : " + day + " (dayDB) " + dayDb + " - Ora " + minsec);
  for (let ix = 0; ix < 7; ix++)
    if (currentProg.dayProgramming[ix].idDay === dayDb)
      for (let iy = 0; iy < currentProg.dayProgramming[ix].prog.length; iy++) {
        let entry = currentProg.dayProgramming[ix].prog[iy];
        if (minsec >= entry.timeStart && minsec <= entry.timeEnd) {
          autoRecord = entry;
          break;
        }
      }
  let prioritySensor = null;
  if (autoRecord != null) {
    console.log(
      "Trovata fascia oraria da " +
        autoRecord.timeStart +
        " a " +
        autoRecord.timeEnd
    );
    minTempAuto = autoRecord.minTemp;
    prioritySensor = autoRecord.prioritySensor;
  }

  if (sensor.length === 1) temperature = sensor[0].currentTemperature;
  else {
    switch (conf.temperatureMeasure) {
      case config.TypeMeasure.LOCAL:
        temperature = getTemperature(sensor, conf.primarySensor);
        break;
      case config.TypeMeasure.MEDIUM:
        temperature = getTemperature(sensor);
        break;
      case config.TypeMeasure.PRIORITY:
        temperature = getTemperature(
          sensor,
          autoRecord != null ? autoRecord.priorityDisp : ""
        );
        break;
    }
  }
  options.response = {
    temperature: temperature,
    temperatureMeasure: conf.temperatureMeasure,
    primarySensor: primarySensor,
    minTempManual: minTempManual,
    minTempAuto: minTempAuto
  };
  if (prioritySensor != null && prioritySensor != "")
    options.response.prioritySensor = prioritySensor;
  resolveIn(options);
};

let getTemperature = function(sensor, macAddress) {
  let temperature = null;
  if (typeof macAddress != "undefined") {
    for (let ix = 0; ix < sensor.length; ix++)
      if (sensor[ix].macAddress === macAddress) {
        temperature = sensor[ix].currentTemperature;
        break;
      }
  }
  if (temperature === null) {
    // calcolo media
    temperature = 0;
    for (let ix = 0; ix < sensor.length; ix++) {
      temperature += sensor[ix].currentTemperature;
    }
    temperature = temperature / sensor.length;
  }
  return temperature;
};
exports.updateTemperatureReleStatus = updateTemperatureReleStatus;
