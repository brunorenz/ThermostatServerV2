// MongoDB configuration
var urlDB_ = "192.168.0.120:27017";
var urlDB = "srvwas1.bpbari.it:27017";
var DBName = "ThermDB";
var mongoCon;

exports.DBName = DBName;
exports.urlDB = urlDB;
exports.mongoCon = mongoCon;

exports.CONF = "configuration";
exports.LOG = "log";
exports.PROG = "prog";
exports.STAT = "stat";

// MQTT
var urlMQTT_ = "mqtt://192.168.0.120";
var urlMQTT = "mqtt://172.28.154.233";
exports.urlMQTT = urlMQTT;

exports.MQTopicWifi = "ThermApp/wifiRegister";
exports.MQTopicMonitor = "ThermApp/monitor";
exports.MQTopicLastWill = "ThermApp/lastWill";
exports.MQTopicMonitor = "ThermApp/updateConfiguration";
exports.MQTopicMonitor = "ThermApp/updateThemperature";

// HTTP
var serverPort = 8100;
var dbName = "/DB/termStat.db";
var termStatdb;

// const PREFIX = '/term';

var monitorTimeout = 30000;
var basicAuth = "Basic YnJ1bm86cHdk";
var basicAuthRequired = false;

var minTemp = 17.0;
var minTempOn = 21.0;
var minLight = 30.0;
var startTime1 = 6 * 60;
var endTime1 = 7 * 60 + 30;

var startTime2 = 18 * 60 + 30;
var endTime2 = 23 * 60;
var interval = 15;

// programming type
var progTemp = 1;
var progLight = 2;
// Temperature measurement
var tempLocal = 1;
var tempMedium = 2;
var tempPriority = 3;
// staus
var statusOff = 0;
var statusOn = 1;
var statusManual = 2;
var statusAutomatic = 3;
//
var wss;

exports.SERVER_PORT = serverPort;
exports.DB_NAME = dbName;
exports.termStatdb = termStatdb;
exports.MONITOR_TIMEOUT = monitorTimeout;
exports.BASIC_AUTH = basicAuth;
exports.BASIC_AUTH_REQUIRED = basicAuthRequired;

exports.MIN_TEMP_OFF = minTemp;
exports.MIN_TEMP_ON = minTempOn;
exports.MIN_LIGHT_OFF = minLight;
exports.TIME_START1 = startTime1;
exports.TIME_START2 = startTime2;
exports.TIME_END1 = endTime1;
exports.TIME_END2 = endTime2;
exports.INTERVAL = interval;

exports.TEMP_LOCAL = tempLocal;
exports.TEMP_MEDIUM = tempMedium;
exports.TEMP_PRIORITY = tempPriority;

exports.PROG_TEMP = progTemp;
exports.PROG_LIGHT = progLight;

exports.STATUS_OFF = statusOff;
exports.STATUS_ON = statusOn;
exports.STATUS_MAN = statusManual;
exports.STATUS_AUTO = statusAutomatic;
exports.WSS = wss;
