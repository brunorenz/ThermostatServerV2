var globaljs = require("./global");
var config = require("./config");
/**
 * last function
 * @param {*} options
 */
var callback = function(options, error) {
  if (error) options.error = error;
  if (options.internallCallback) options.internallCallback(options);
  else if (options.callback) options.callback(options);
};

/**
 * Update configuration
 *
 * @param {*} confColl
 * @param {*} options
 */
var updateConfiguration = function(confColl, options) {
  if (options.response) {
    let updateField = {};
    if (options.register) {
      updateField.lastAccess = Date.now();
      if (options.request.ipAddress)
        updateField.ipAddress = options.request.ipAddress;
    } else updateField.lastCheck = Date.now();
    let req = options.request;
    if (typeof req.flagReleTemp !== "undefined") {
      updateField.flagReleTemp = req.flagReleTemp;
      options.response.flagReleTemp = req.flagReleTemp;
    }
    if (typeof req.flagReleLight !== "undefined") {
      updateField.flagReleLight = req.flagReleLight;
      options.response.flagReleLight = req.flagReleLight;
    }
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
 * Read and update Configuration
 */
exports.readConfiguration = function(options) {
  var confColl = globaljs.mongoCon.collection(globaljs.CONF);
  confColl.findOne(
    {
      _id: options.macAddress
    },
    function(err, doc) {
      if (err) {
        console.error("ERRORE lettura configurazione " + err);
        callback(options, err);
      } else {
        if (doc) {
          options.response = doc;
          if (options.update) updateConfiguration(confColl, options);
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
              if (options.update) updateConfiguration(confColl, options);
              else callback(options, err);
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
