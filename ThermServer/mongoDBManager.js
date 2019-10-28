var globaljs = require("./routes/global");

var getConfigurationRecord = function(macAddress) {
  var confRecord = {
    _id: macAddress,
    macAddress: macAddress,
    ipAddress: "",
    location: "change location name",
    tempMeasure: globaljs.TEMP_LOCAL,
    status: globaljs.STATUS_OFF,
    statusLight: globaljs.STATUS_OFF,
    firstAccess: 0,
    lastAccess: 0,
    lastUpdate: 0,
    lastCheck: 0,
    flagLcd: 0,
    flagLightSensor: 0,
    flagMotionSensor: 0,
    flagReleTemp: 0,
    flagReleLight: 0
  };
  return confRecord;
};

var updateConfiguration = function(confColl, options) {
  if (options.configuration) {
    let updateField = {};
    if (options.register) {
      updateField.lastAccess = Date.now();
      if (options.inputMessage.ipAddress)
        updateField.ipAddress = options.inputMessage.ipAddress;
    } else updateField.lastCheck = Date.now();
    if (confColl) {
      confColl.updateOne(
        {
          _id: options.inputMessage.macAddress
        },
        {
          $set: updateField
        }
      );
    }
  }
  if (options.callback) options.callback(options);
};

exports.readConfiguration = function(options) {
  var confColl = globaljs.mongoCon.collection(globaljs.CONF);
  confColl.findOne(
    {
      _id: options.inputMessage.macAddress
    },
    function(err, doc) {
      if (err) console.error("ERRORE lettura configurazione " + err);
      else {
        if (doc) {
          options.configuration = doc;
          updateConfiguration(confColl, options);
        } else if (options.createIfNull) {
          // create new configuration
          var conf = getConfigurationRecord(options.inputMessage.macAddress);
          conf.firstAccess = Date.now();
          confColl.insertOne(conf, function(err, doc) {
            if (err) console.log("ERRORE inserimento configurazione " + err);
            else {
              options.configuration = conf;
              updateConfiguration(confColl, options);
            }
          });
        }
      }
    }
  );
};
