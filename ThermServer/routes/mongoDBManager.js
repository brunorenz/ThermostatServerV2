var globaljs = require("./global");
var config = require("./config");

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
  if (options.internallCallback) options.internallCallback(options);
  else if (options.callback) options.callback(options);
};

exports.readConfiguration = function(options) {
  var confColl = globaljs.mongoCon.collection(globaljs.CONF);
  confColl.findOne(
    {
      _id: options.macAddress
    },
    function(err, doc) {
      if (err) console.error("ERRORE lettura configurazione " + err);
      else {
        if (doc) {
          options.configuration = doc;
          updateConfiguration(confColl, options);
        } else if (options.createIfNull) {
          // create new configuration
          var conf = config.getConfigurationRecord(options.macAddress);
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

var createProgramming = function(options) {};
exports.readProgramming = function(options) {
  var progColl = globaljs.mongoCon.collection(globaljs.PROG);
  progColl.findOne(
    {
      _id: options.programmingType
    },
    function(err, doc) {
      if (err) {
        console.error("ERRORE lettura programmazione " + err);
        options.error = err;
      } else {
        if (doc) {
          options.response = doc;
        } else if (options.createIfNull) {
          // create new configuration
          var prog = config.getProgrammingRecord(options.programmingType);
          progColl.insertOne(conf, function(err, doc) {
            if (err) {
              console.log("ERRORE inserimento programmazione " + err);
              options.error = err;
            } else {
              options.response = prog;
            }
          });
        }
      }
      if (options.internallCallback) options.internallCallback(options);
      else if (options.callback) options.callback(options);
    }
  );
};
