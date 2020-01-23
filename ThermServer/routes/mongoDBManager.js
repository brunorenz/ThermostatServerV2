var globaljs = require("./global");
var config = require("./config");
var thermManager = require("./thermManager");
var mq = require("./thermServerMQ");
/**
 * Manage last function callback
 * @param {*} options
 */
var callback = function(options, error) {
  thermManager.callback(options, error);
  // if (error) options.error = error;
  // if (options.callback && options.callback.length > 0) {
  //   if (typeof options.callbackIndex === "undefined") options.callbackIndex = 0;
  //   if (options.callbackIndex < options.callback.length) {
  //     options.callback[options.callbackIndex++](options);
  //   }
  // }
  //if (options.internallCallback) options.internallCallback(options);
  //else if (options.callback) options.callback(options);
};

var callbackOLD = function(options, error) {
  if (error) options.error = error;
  if (options.internallCallback) options.internallCallback(options);
  else if (options.callback) options.callback(options);
};

/**
 * Update management attribute of configuration
 *
 */
exports.updateConfiguration = function(options) {
  var confcoll = globaljs.mongoCon.collection(globaljs.CONF);
  let json = options.request;
  console.log(json);
  var req = JSON.parse(json);
  let updateField = {
    location: req.location,
    flagReleLight: req.flagReleLight,
    flagReleTemp: req.flagReleTemp,
    lastUpdate: new Date().getTime()
  };
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
      options.response = { update: r.modifiedCount };
      callback(options);
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
  callback(options);
};

/**
 * Manage registration of monitor data
 */
exports.monitorData = function(options) {
  var monitorColl = globaljs.mongoCon.collection(globaljs.STAT);
  var confcoll = globaljs.mongoCon.collection(globaljs.CONF);
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
        currentThemperature: record.temperature,
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
    callback(options, err);
  });
};

/**
 * Read configuration
 * update if options.update = true
 * create a new one if not found and options.createIfNull = true
 */
exports.readConfiguration = function(options) {
  var confColl = globaljs.mongoCon.collection(globaljs.CONF);
  if (typeof options.macAddress !== "undefined") {
    confColl.findOne({ _id: options.macAddress }, function(err, doc) {
      if (err) {
        console.error("ERRORE lettura configurazione " + err);
        callback(options, err);
      } else {
        if (doc) {
          options.response = doc;
          if (options.update) updateConfigurationFull(confColl, options);
          else callback(options, err);
        } else if (options.createIfNull) {
          // create new configuration
          var conf = config.getConfigurationRecord(options.macAddress);
          conf.firstAccess = Date.now();
          confColl.insertOne(conf, function(err, doc) {
            if (err) {
              console.log("ERRORE inserimento configurazione " + err);
              callback(options, err);
            } else {
              options.response = conf;
              if (options.update) updateConfigurationFull(confColl, options);
              else callback(options, err);
            }
          });
        }
      }
    });
  } else {
    confColl.find({}).toArray(function(err, elements) {
      if (err) {
        console.error("ERRORE lettura configurazione " + err);
        callback(options, err);
      } else {
        options.response = elements;
        callback(options, err);
        // for (let ix = 0; ix < elements.length; ix++) {
        //   let entry = elements[ix];
        //   let a = 1;
        // }
      }
    });
  }
};

/**
 * manage read programming info request
 * create a new one if options.createIfNull = true
 */
var readProgramming = function(options) {
  var progColl = globaljs.mongoCon.collection(globaljs.PROG);
  progColl.findOne(
    {
      _id: options.programmingType
    },
    function(err, doc) {
      if (err) {
        console.error("ERRORE lettura programmazione " + err);
        callback(options, err);
      } else {
        if (doc) {
          options.response = doc;
          callback(options);
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
            callback(options, err);
          });
        }
      }
    }
  );
};
exports.readProgramming = readProgramming;

/**
 * evalute themperature
 */
exports.readThermostatProgramming = function(options) {
  options.programmingType = config.TypeProgramming.THEMP;
  var confColl = globaljs.mongoCon.collection(globaljs.CONF);
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
        // ora cerco sensori temperatura
        confColl.find({ flagTemperatureSensor: 1 }).toArray(function(err, doc) {
          if (err) {
            console.error("ERRORE lettura configurazione " + err);
            //callback(options, err);
          } else {
            if (doc && doc.length > 0) {
              console.log(
                "trovati " + doc.length + " sensori che misurano temperatura"
              );
              for (let ix = 0; ix < doc.length; ix++) {
                console.log(
                  "Location " +
                    doc[ix].location +
                    " - Temperatura " +
                    doc[ix].currentThemperature
                );
                console.log(
                  "Location " +
                    doc[ix].location +
                    " - Luce " +
                    doc[ix].currentLigth
                );
              }
            } else {
              options.error = "Non trovati sensori che misurano temperatura";
              console.log(options.error);
            }
          }
        });
      } else {
        options.error =
          "Trovati un numero di dispositivi non valido : " + doc.length;
        console.log(options.error);
      }
      callback(options, err);
    }
  });
};
