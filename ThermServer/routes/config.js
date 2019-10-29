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

var status = { OFF: 0, ON: ((1).MANUAL = 2), AUTO: 3 };
var measure = { LOCAL: 1, MEDIUM: 2, PRIORITY: 2 };
var programming = { THEMP: 1, LIGTH: 2 };

exports.TypeStatus = status;
exports.TypeMeasure = measure;
exports.TypeProgramming = programming;

var configurationRecord = {
  ipAddress: "",
  location: "change location name",
  thempMeasure: measure.LOCAL,
  status: status.OFF,
  statusLight: status.OFF,
  firstAccess: 0,
  lastAccess: 0,
  lastUpdate: 0,
  lastCheck: 0,
  flagLcd: 0,
  flagLightSensor: 0,
  flagMotionSensor: 0,
  flagReleTemp: 0,
  flagReleLight: 0,
  currentThemperature: 0.0,
  currentLigth: 0.0
};

exports.getConfigurationRecord = function(macAddress) {
  let cfg = JSON.parse(JSON.stringify(configurationRecord));
  cfg.macAddress = macAddress;
  cfg._id = macAddress;
  return cfg;
};
