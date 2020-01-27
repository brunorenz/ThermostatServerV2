var globaljs = require("./global");
//var config = require("./config");

// programming type
var progTemp = 1;
var progLight = 2;
// Temperature measurement
var tempLocal = 1;
var tempMedium = 2;
var tempPriority = 3;
// status
var statusOff = 0;
var statusOn = 1;
var statusManual = 2;
var statusAutomatic = 3;

var status = { OFF: 0, ON: 1, MANUAL: 2, AUTO: 3 };
var measure = { LOCAL: 1, MEDIUM: 2, PRIORITY: 2 };
var programming = { THEMP: 1, LIGTH: 2 };
var deviceType = { ANY: 0, ARDUINO: 1, SHELLY: 2 };
var shellyCommand = { RELAY: 0, COMMAND: 1 };

exports.TypeStatus = status;
exports.TypeMeasure = measure;
exports.TypeProgramming = programming;
exports.TypeDeviceType = deviceType;
exports.TypeShellyCommand = shellyCommand;

var configurationRecord = {
  ipAddress: "",
  location: "change location name",
  temperatureMeasure: measure.LOCAL,
  statusThermostat: status.OFF,
  statusLight: status.OFF,
  deviceType: deviceType.ANY,
  firstAccess: 0,
  lastAccess: 0,
  lastUpdate: 0,
  lastCheck: 0,
  flagLcd: 0,
  flagLightSensor: 0,
  flagMotionSensor: 0,
  flagTemperatureSensor: 0,
  flagPressureSensor: 0,
  flagHumiditySensor: 0,
  flagReleTemp: 0,
  flagReleLight: 0,
  shellyMqttId: "",
  currentTemperature: 0.0,
  currentLigth: 0.0
};

/**
 * Return Default Configuration Record
 */

exports.getConfigurationRecord = function(macAddress) {
  let cfg = JSON.parse(JSON.stringify(configurationRecord));
  cfg.macAddress = macAddress;
  cfg._id = macAddress;
  return cfg;
};

var getProgrammingEntryRecord = function(idProg, name) {
  var programmigInfo = {
    idProg: idProg,
    name: name,
    minTemp: 0.0,
    minTempManual: 0.0,
    minLight: 0.0,
    dayProgramming: []
  };
  return programmigInfo;
};

var getDayProgramRecord = function(day) {
  var dayProg = {
    idDay: day,
    prog: []
  };
  return dayProg;
};

var getProgrammingTempRecord = function(idType) {
  var confRecord = {
    idProgType: 0,
    lastUpdate: 0,
    activeProg: -1,
    programming: []
  };
  return confRecord;
};

function getDefaultDayProgrammingTempRecord(id, name) {
  var prog = getProgrammingEntryRecord(id, name);
  prog.minTemp = globaljs.MIN_TEMP_OFF;
  prog.minTempManual = globaljs.MIN_TEMP_ON;
  prog.minLight = globaljs.MIN_LIGHT_OFF;
  for (var day = 0; day < 7; day++) {
    var dayProg = getDayProgramRecord(day);
    var morning = {
      timeStart: globaljs.TIME_START1,
      timeEnd: globaljs.TIME_END1,
      minTemp: globaljs.MIN_TEMP_ON,
      priorityDisp: 0
    };
    var nigth = {
      timeStart: globaljs.TIME_START2,
      timeEnd: globaljs.TIME_END2,
      minTemp: globaljs.MIN_TEMP_ON,
      priorityDisp: 0
    };
    dayProg.prog.push(morning);
    dayProg.prog.push(nigth);
    prog.dayProgramming[day] = dayProg;
  }
  return prog;
}

function getDefaultProgrammingTempRecord(idType) {
  var conf = getProgrammingTempRecord(idType);
  conf.idProgType = idType;
  conf.activeProg = 0;
  conf.lastUpdate = Date.now();
  var prog = getDefaultDayProgrammingTempRecord(0, "Default Program");
  conf.programming[0] = prog;
  return conf;
}

/**
 * Return Default Programming Record
 */
exports.getProgrammingRecord = function(idType) {
  var conf;
  if (idType === programming.THEMP) {
    conf = getDefaultProgrammingTempRecord(idType);
  } else if (idType === programming.LIGTH) {
    var confRecord = {
      idProgType: programming.LIGTH,
      lastUpdate: Date.now(),
      programming: []
    };
    conf = confRecord;
  }
  return conf;
};
