var express = require("express");
var path = require("path");
var fs = require("fs");
var favicon = require("serve-favicon");
var bodyParser = require("body-parser");
var morgan = require("morgan");
var errorhandler = require("errorhandler");
var httpUtils = require("./routes/utils/httpUtils");
var securityManager = require("./routes/securityManager");
var termManagment = require("./routes/thermServerHTTP");
var app = express();

function getNextTime() {
  var now = new Date();
  var millis =
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 02, 0, 0, 0) -
    now;
  if (millis < 0) {
    millis += 86400000;
  }
  console.log("Timer expire in " + millis + " msec");
  return millis;
}

/*
var cumulateStatistics = function() {
  console.log("Executute cumulateStatistics..");
  termDBStatFunction.cumulateStatistics(globaljs.termStatdb);
  setTimeout(cumulateStatistics, getNextTime());
};
*/
// all environments
//FIXME app.use(favicon(path.join(__dirname, "public/images", "favicon.png")));
// HTTP LOGGER

var logPath = path.join(__dirname, "logs");

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath);
}

var accessLogStream = fs.createWriteStream(logPath + "/ThermServer.log", {
  flags: "a"
});
app.use(
  morgan(
    ":date :res[content-length] :remote-addr :method :url - RC: :status :response-time ms",
    { stream: accessLogStream }
  )
);

app.use(securityManager.checkBasicSecurity);

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.disable("x-powered-by");
app.use(express.static(__dirname + "/"));

// development only
if ("development" === app.get("env")) {
  app.use(errorhandler());
}

// DB
console.log("Working directory is " + __dirname);

// Gestione Termostato
// GET METHOD
app.get("/rest/getProgramming", termManagment.getProgramming);
app.get("/rest/getConfiguration", termManagment.getConfiguration);
app.get("/rest/shellyRegister", termManagment.shellyRegister);

app.get("/rest/check", termManagment.checkThermostatStatus);

app.post("/rest/login", urlencodedParser, termManagment.login);

app.get("/rest/getSensorData", termManagment.getSensorData);
app.get("/rest/getReleData", termManagment.getReleData);

app.get("/rest/getReleStatistics", termManagment.getReleStatistics);
app.get("/rest/getSensorStatistics", termManagment.getSensorStatistics);

// POST METHOD

app.post("/rest/updateStatus", urlencodedParser, termManagment.updateStatus);
app.post(
  "/rest/updateConfiguration",
  urlencodedParser,
  termManagment.updateConfiguration
);
app.post(
  "/rest/addProgramming",
  urlencodedParser,
  termManagment.addProgramming
);
app.post(
  "/rest/deleteProgramming",
  urlencodedParser,
  termManagment.deleteProgramming
);

app.post(
  "/rest/updateProgramming",
  urlencodedParser,
  termManagment.updateProgramming
);

app.post("/rest/monitor", jsonParser, termManagment.monitor);
/**
app.get("/rest/addProgramming", termManagment.addProgramming);
app.get("/rest/removeProgramming", termManagment.removeProgramming);
app.get("/rest/getStatistics/:key", termManagment.getStatistics);
app.get("/rest/readDB", termManagment.readDB);
app.get(
  "/rest/checkConfigurationChange/:key",
  termManagment.checkConfigurationChange
);
app.get("/rest/cumulateStatistics", termManagment.cumulateStatistics);
app.get("/rest/getCurrentData", termManagment.getCurrentData);
app.get("/rest/wifiRegisterGet/:key", termManagment.wifiRegisterGet);

// POST METHOD
app.post("/rest/wifiRegister", jsonParser, termManagment.wifiRegister);
app.post("/rest/monitor/:key", jsonParser, termManagment.monitor);
app.post(
  "/rest/updateTempProgramming",
  urlencodedParser,
  termManagment.updateTempProgramming
);
// Applicazione WEB

// app.use(rewriter);
// app.get('/', rewriter.rewrite('/dashboard'));

app.get("/", function(req, res) {
  var newPath = req.originalUrl;
  if (newPath.slice(-1) == "/") res.redirect(newPath + "dashboard");
  else res.redirect(newPath + "/dashboard");
});

app.get("/dashboard", function(req, res) {
  res.sendFile(__dirname + "/views/dashboard.html");
});
app.get("/statistiche", function(req, res) {
  res.sendFile(__dirname + "/views/statistiche.html");
});
app.get("/configurazione", function(req, res) {
  res.sendFile(__dirname + "/views/configurazione.html");
});
app.get("/programmazioneLight", function(req, res) {
  res.sendFile(__dirname + "/views/programmazioneLight.html");
});
app.get("/programmazioneTemp", function(req, res) {
  res.sendFile(__dirname + "/views/programmazioneTemp.html");
});shellies
****/
/*
 * http.createServer(app).listen(app.get('port'), function(){
 * console.log('Express server listening on port ' + app.get('port')); });
 */

//setTimeout(cumulateStatistics, getNextTime());

module.exports = app;
