var globaljs = require("./global");
var config = require("./config");
var thermManager = require("./thermManager");
//var mq = require("./thermServerMQ");
var shelly = require("./shellyManager");

/**
 * Manage last function callback
 * @param {*} options
 */
// var callback = function(options, error) {
//   return thermManager.callback(options, error);
//   // if (error) options.error = error;
//   // if (options.callback && options.callback.length > 0) {
//   //   if (typeof options.callbackIndex === "undefined") options.callbackIndex = 0;
//   //   if (options.callbackIndex < options.callback.length) {
//   //     options.callback[options.callbackIndex++](options);
//   //   }
//   // }
//   //if (options.internallCallback) options.internallCallback(options);
//   //else if (options.callback) options.callback(options);
// };

// var callbackOLD = function(options, error) {
//   if (error) options.error = error;
//   if (options.internallCallback) options.internallCallback(options);
//   else if (options.callback) options.callback(options);
// };

/**
 * Update management attribute of configuration
 *
 */
exports.updateConfiguration = function(options) {
  var confcoll = globaljs.mongoCon.collection(globaljs.MONGO_CONF);
  let json = options.request;
  //console.log(json);
  var req = JSON.parse(json);
  let updateField = {
    location: req.location,
    flagReleLight: req.flagReleLight,
    flagReleTemp: req.flagReleTemp,
    lastUpdate: new Date().getTime()
  };
  console.log(
    "Aggiorno MAC : " + req.macAddress + " => " + JSON.stringify(updateField)
  );
  if (updateField.flagReleTemp === 1) {
    updateField.statusThermostat = parseInt(req.statusThermostat);
    updateField.temperatureMeasure = parseInt(req.temperatureMeasure);
  }
  if (updateField.flagReleLight === 1) {
    //statusLight: req.statusThermostat
  }
  confcoll.updateOne(
    {
      _id: req.macAddress
    },
    {
      $set: updateField
    },
    function(err, r) {
      if (!err) {
        // aggiorna dispositivi shelly
        thermManager.checkThermostatStatus({callback:[]});
      }
      options.response = { update: r.modifiedCount };
      thermManager.callback(options);
    }
  );
};

/**
 * Update configuration after WifiRegister
 *
 * @param {*} confColl
 * @param {*} options
 */
var updateConfigurationFull = function(confColl, options) {
  if (options.response) {
    let updateField = {};
    let req = options.request;
    if (options.register) {
      updateField.lastAccess = Date.now();
      if (req.ipAddress) updateField.ipAddress = req.ipAddress;
    } else updateField.lastCheck = Date.now();
    updateField.deviceType = req.deviceType;
    updateField.flagReleTemp = req.flagReleTemp;
    updateField.flagReleTemp = req.flagReleTemp;
    updateField.flagReleLight = req.flagReleLight;
    options.response.flagReleTemp = req.flagReleTemp;
    options.response.flagReleLight = req.flagReleLight;
    //
    updateField.flagLcd = req.flagLcd;
    updateField.flagLightSensor = req.flagLightSensor;
    updateField.flagMotionSensor = req.flagMotionSensor;
    updateField.flagTemperatureSensor = req.flagTemperatureSensor;
    updateField.flagPressureSensor = req.flagPressureSensor;
    updateField.flagHumiditySensor = req.flagHumiditySensor;
    updateField.shellyMqttId = req.shellyMqttId;
    if (confColl) {
      confColl.updateOne(
        {
          _id: options.request.macAddress
        },
        {
          $set: updateField
        }
      );
    }
  }
  return thermManager.callback(options);
};

exports.monitorReleData = function(options) {
  var monitorColl = globaljs.mongoCon.collection(globaljs.MONGO_SHELLYSTAT);
  let logRecord = options.request.toString();
  var now = new Date();
  var record = {
    shellyId: options.shellyCommand.deviceid,
    time: now.getTime(),
    date: now,
    status: logRecord === "on" ? 1 : 0
  };
  monitorColl.insertOne(record, function(err, doc) {
    if (err) {
      console.log("ERRORE inserimento monitor data " + err);
    } else {
    }
    thermManager.callback(options, err);
  });
};

/**
 * Manage registration of monitor data
 */
exports.monitorSensorData = function(options) {
  var monitorColl = globaljs.mongoCon.collection(globaljs.MONGO_SENSORSTAT);
  var confcoll = globaljs.mongoCon.collection(globaljs.MONGO_CONF);
  let logRecord = options.request;
  var now = new Date();
  var record = {
    temperature: logRecord.temperature,
    humidity: logRecord.humidity,
    pressure: logRecord.pressure,
    statusThermostat: logRecord.statusThermostat,
    numSurveys: logRecord.numSurveys,
    light: logRecord.light,
    macAddress: logRecord.macAddress,
    time: now.getTime(),
    date: now
  };
  monitorColl.insertOne(record, function(err, doc) {
    if (err) {
      console.log("ERRORE inserimento monitor data " + err);
    } else {
      let updateField = {
        currentTemperature: record.temperature,
        currentLigth: record.light,
        lastCheck: new Date().getTime()
      };
      confcoll.updateOne(
        {
          _id: record.macAddress
        },
        {
          $set: updateField
        }
      );
    }
    thermManager.callback(options, err);
  });
};

/**
 * Read configuration
 * update if options.update = true
 * create a new one if not found and options.createIfNull = true
 */
exports.readConfiguration = function(options) {
  var confColl = globaljs.mongoCon.collection(globaljs.MONGO_CONF);
  if (typeof options.macAddress !== "undefined") {
    confColl.findOne({ _id: options.macAddress }, function(err, doc) {
      if (err) {
        console.error("ERRORE lettura configurazione " + err);
        return thermManager.callback(options, err);
      } else {
        if (doc) {
          options.response = doc;
          if (options.update) updateConfigurationFull(confColl, options);
          else return thermManager.callback(options, err);
        } else if (options.createIfNull) {
          // create new configuration
          var conf = config.getConfigurationRecord(options.macAddress);
          conf.firstAccess = Date.now();
          confColl.insertOne(conf, function(err, doc) {
            if (err) {
              console.log("ERRORE inserimento configurazione " + err);
              return thermManager.callback(options, err);
            } else {
              options.response = conf;
              if (options.update) updateConfigurationFull(confColl, options);
              else return thermManager.callback(options, err);
            }
          });
        }
      }
    });
  } else {
    confColl.find({}).toArray(function(err, elements) {
      if (err) {
        console.error("ERRORE lettura configurazione " + err);
        return thermManager.callback(options, err);
      } else {
        options.response = elements;
        return thermManager.callback(options, err);
        // for (let ix = 0; ix < elements.length; ix++) {
        //   let entry = elements[ix];
        //   let a = 1;
        // }
      }
    });
  }
};
/**
 * Aggiorna record di programmazione
 * @param {*} options
 */
var updateProgrammingInternal = function(options, resolve, reject) {
  var progColl = globaljs.mongoCon.collection(globaljs.MONGO_PROG);
  console.log(
    "Aggiorna record programmazione di tipo " + options.programmingType
  );
  options.response.lastUpdate = new Date().getTime();
  progColl.updateOne(
    {
      _id: options.programmingType
    },
    {
      $set: options.response
    },
    function(err, doc) {
      if (err) {
        console.error("Errore in aggiornamento record programmazione " + err);
      } else {
        options.response = doc;
        console.log("Aggiornamento effettuato con successo!");
      }
      if (options.usePromise) {
        if (err) reject(err);
        else resolve(options);
      } else thermManager.callback(options, err);

      //XXXthermManager.callback(options, err);
    }
  );
};
exports.updateProgramming = updateProgrammingInternal;

/**
 * Aggionge record di programmazione
 */
exports.addProgramming = function(options, resolve, reject) {
  let prog = options.response;
  //let type = options.programmingType;
  let index = 0;
  for (let ix = 0; ix < prog.programming.length; ix++)
    if (prog.programming[ix].idProg > index)
      index = prog.programming[ix].idProg;
  if (options.programmingType === config.TypeProgramming.THEMP) {
    var dayProg = config.getDefaultDayProgrammingTempRecord(
      ++index,
      "New Program " + index
    );
    prog.programming.push(dayProg);
  } else {
    // aggiorna programamzione Luce
  }
  updateProgrammingInternal(options, resolve, reject);
};

exports.deleteProgramming = function(options, resolve, reject) {
  let prog = options.response;
  let idProg = options.idProg;
  console.log("Elimina programmazione giornaliera con id " + idProg);
  //let type = options.programmingType;
  let index = 0;
  let newProg = [];
  for (let ix = 0; ix < prog.programming.length; ix++)
    if (prog.programming[ix].idProg != idProg)
      newProg.push(prog.programming[ix]);
    else
      console.log(
        "Travata ed eliminata programmazione giornaliera con id " + idProg
      );
  prog.programming = newProg;
  updateProgrammingInternal(options, resolve, reject);
  //resolve(options);
  //thermManager.callback(options);
};

/**
 * manage read programming info request
 * create a new one if options.createIfNull = true
 */
var readProgramming = function(options, resolve, reject) {
  var progColl = globaljs.mongoCon.collection(globaljs.MONGO_PROG);
  progColl.findOne(
    {
      _id: options.programmingType
    },
    function(err, doc) {
      if (err) {
        console.error("ERRORE lettura programmazione " + err);
        //return thermManager.callback(options, err);
      } else {
        if (doc) {
          options.response = doc;
          //return thermManager.callback(options);
        } else if (options.createIfNull) {
          // create new configuration
          console.log(
            "Programming info not found for type : " +
              options.programmingType +
              " .. add default"
          );
          var prog = config.getProgrammingRecord(options.programmingType);
          prog._id = options.programmingType;
          progColl.insertOne(prog, function(err, doc) {
            if (err) {
              console.log("ERRORE inserimento programmazione " + err);
            } else {
              options.response = prog;
            }
            thermManager.callback(options, err);
          });
        }
      }
      if (options.usePromise) {
        if (err) reject(err);
        else resolve(options);
      } else thermManager.callback(options, err);
    }
  );
};
exports.readProgramming = readProgramming;

/**
 * Execute a generic query
 * @param {*} options
 * @param {*} resolve
 * @param {*} reject
 */
exports.genericQuery = function(options, resolve, reject) {
  let qf = function(err, doc) {
    if (err) {
      console.error("ERRORE esecuzione query " + err);
    } else {
      if (doc) {
        options.response = doc;
      } else options.response = [];
    }
    if (options.usePromise) {
      if (err) reject(err);
      else resolve(options);
    } else thermManager.callback(options, err);
  };
  let query = options.genericQuery;
  let confColl = query.collection;
  let filter = {};
  let sort = {};
  if (typeof query.filter != "undefined") filter = query.filter;
  if (typeof query.sort != "undefined") sort = query.sort;
  let selectOne = true;
  if (typeof query.selectOne != "undefined") selectOne = query.selectOne;
  if (selectOne) confColl.findOne(filter, { sort: sort }, qf);
  else confColl.find(filter, { sort: sort }).toArray(qf);
};

/**
 * evalute themperature
 */
exports.readThermostatProgramming = function(options) {
  options.programmingType = config.TypeProgramming.THEMP;
  var confColl = globaljs.mongoCon.collection(globaljs.MONGO_CONF);
  confColl.find({ flagReleTemp: 1 }).toArray(function(err, doc) {
    if (err) {
      console.error("ERRORE lettura configurazione " + err);
      //callback(options, err);
    } else {
      if (doc && doc.length === 1) {
        let conf = doc[0];
        console.log(
          "trovato dispositivo " +
            conf.location +
            " con misurazione di tipo " +
            conf.temperatureMeasure
        );
        // verifico tipo programmazione
        options.shellyCommand = {
          command: config.TypeShellyCommand.COMMAND,
          status: conf.statusThermostat,
          measure: conf.temperatureMeasure,
          deviceid: conf.shellyMqttId
        };
        if (
          conf.statusThermostat === config.TypeStatus.ON ||
          conf.statusThermostat === config.TypeStatus.OFF
        ) {
          shelly.shellySendCommand(options);
        } else {
          // ora cerco sensori temperatura
          confColl
            .find({ flagTemperatureSensor: 1 })
            .toArray(function(err, doc) {
              if (err) {
                console.error("ERRORE lettura configurazione " + err);
                //callback(options, err);
              } else {
                if (doc && doc.length > 0) {
                  console.log(
                    "trovati " +
                      doc.length +
                      " sensori che misurano temperatura"
                  );
                  for (let ix = 0; ix < doc.length; ix++) {
                    console.log(
                      "Location " +
                        doc[ix].location +
                        " - Temperatura " +
                        doc[ix].currentTemperature
                    );
                    console.log(
                      "Location " +
                        doc[ix].location +
                        " - Luce " +
                        doc[ix].currentLigth
                    );
                  }
                  // leggi programmazione
                  options.shellyCommand.temperature = doc;
                  options.callback.push(shelly.shellySendCommand);
                  readProgramming(options);
                } else {
                  options.error =
                    "Non trovati sensori che misurano temperatura";
                  console.log(options.error);
                }
              }
            });
        }
      } else {
        options.error =
          "Trovati un numero di dispositivi non valido : " + doc.length;
        console.log(options.error);
      }
      return thermManager.callback(options, err);
    }
  });
};
