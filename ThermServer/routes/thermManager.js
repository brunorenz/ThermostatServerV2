var globaljs = require("./global");
var mongoDBMgr = require("./mongoDBManager");
var TypeAction = { READ: 1, RESET: 2, UPDATE: 3, DELETE: 4 };
exports.TypeAction = TypeAction;

/**
 * Thermostat programming management
 */
exports.programmingInternal = function(options) {
  if (options.action === TypeAction.READ) {
    mongoDBMgr.readProgramming(options);
  }
};
/**
 * check and update thermostat configuration
 */
exports.checkConfigurationInternal = function(options) {};

/**
 * check and update thermostat configuration
 */
exports.monitorInternal = function(options) {};

/**
 * Thermostat register function
 */
exports.wifiRegisterInternal = function(options) {
  //
  options.createIfNull = true;
  mongoDBMgr.readConfiguration(options);
  /*
  var conf = termDBFunction.readConfiguration(
    globaljs.termStatdb,
    remoteConf.macAddress
  );
  if (!conf) {
    // create configuration record
    conf = termDBFunction.readConfiguration(
      globaljs.termStatdb,
      remoteConf.macAddress,
      true,
      remoteConf
    );
    conf.lastUpdate = Date.now();
    // create programming default record if nont present
    termDBFunction.readProgramming(
      globaljs.termStatdb,
      globaljs.PROG_TEMP,
      true
    );
    termDBFunction.readProgramming(
      globaljs.termStatdb,
      globaljs.PROG_LIGHT,
      true
    );
  }
  if (conf) {
    // update last access
    conf.lastAccess = Date.now();
    // var p = myutils.httpGetParam(req);
    conf = updateConfigurationFromRequest(remoteConf, conf);
    termDBFunction.updateConfiguration(globaljs.termStatdb, conf);
    termDBFunction.saveDatabase(
      globaljs.termStatdb,
      "Save Database after wifiRegister completed"
    );
    var d = new Date();
    conf.timeZoneOffset = d.getTimezoneOffset();
  }
  var response = httpUtils.createResponse(conf);
  // if (callBack) callBack(response)
  return response;
  */
};

var readProgramming = function(options) {
  options.createIfNull = true;
  //options.internalCallback
  mongoDBMgr.readProgramming(options);
};
