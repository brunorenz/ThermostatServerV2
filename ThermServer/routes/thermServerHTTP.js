var globaljs = require("./global");
var config = require("./config");
var httpUtils = require("./utils/httpUtils");
var thermManager = require("./thermManager");
var mq = require("./thermServerMQ");

exports.monitor = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  httpResponse.header("Access-Control-Allow-Origin", "*");
  try {
    var options = {
      httpRequest: httpRequest,
      httpResponse: httpResponse,
      callback: [],
      request: httpRequest.body,
      lastCallback: genericHTTPPostService
    };
    options.callback.push(genericHTTPPostService);
    thermManager.monitorInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 * Update Configuration
 */
exports.updateConfiguration = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  httpResponse.header("Access-Control-Allow-Origin", "*");
  try {
    var options = {
      httpRequest: httpRequest,
      httpResponse: httpResponse,
      callback: [],
      request: httpRequest.body.data,
      lastCallback: genericHTTPPostService
    };
    // propagate configuration change

    //options.callback.push(mq.sendProgrammingData);
    options.callback.push(genericHTTPPostService);
    thermManager.updateConfigurationInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 * Read Configuration
 */
exports.getConfiguration = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  httpResponse.header("Access-Control-Allow-Origin", "*");
  httpResponse.header("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
  try {
    var type = config.TypeProgramming.THEMP;
    if (httpRequest.query.type) {
      if (httpRequest.query.type === "temp")
        type = config.TypeProgramming.THEMP;
      else if (httpRequest.query.type === "light")
        type = config.TypeProgramming.LIGTH;
    }
    var options = {
      httpRequest: httpRequest,
      httpResponse: httpResponse,
      action: thermManager.TypeAction.READ,
      callback: [],
      createIfNull: false,
      update: false,
      lastCallback: genericHTTPPostService
    };
    options.callback.push(genericHTTPPostService);
    thermManager.readConfigurationInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};

/**
 *
 */

exports.checkThermostatStatus = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  var options = {
    httpRequest: httpRequest,
    httpResponse: httpResponse,
    callback: [],
    lastCallback: genericHTTPPostService
  };
  options.callback.push(genericHTTPPostService);
  try {
    thermManager.checkThermostatStatus(options);
  } catch (error) {
    options.error = error;
    genericHTTPPostService(options, error);
  }
};
/**
 * Scan th local network finding for Schelly devices
 */
exports.shellyRegister = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  var options = {
    httpRequest: httpRequest,
    httpResponse: httpResponse,
    action: thermManager.TypeAction.READ,
    callback: [],
    createIfNull: true,
    lastCallback: genericHTTPPostService
  };
  options.callback.push(genericHTTPPostService);
  try {
    thermManager.shellyRegisterInternal(options);
  } catch (error) {
    options.error = error;
    genericHTTPPostService(options, error);
  }
};

/**
 * Get programming info type = temp/light prog = all / reset
 * @param {*} httpRequest
 * @param {*} httpResponse
 */
exports.getProgramming = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;

  var type = config.TypeProgramming.THEMP;
  //    var p = myutils.httpGetParam(req);
  if (httpRequest.query.type) {
    if (httpRequest.query.type === "temp") type = config.TypeProgramming.THEMP;
    else if (httpRequest.query.type === "light")
      type = config.TypeProgramming.LIGTH;
  }
  var options = {
    httpRequest: httpRequest,
    httpResponse: httpResponse,
    programmingType: type,
    action: thermManager.TypeAction.READ,
    callback: [],
    createIfNull: true,
    lastCallback: genericHTTPPostService
  };
  options.callback.push(genericHTTPPostService);
  try {
    thermManager.manageProgramming(options);
  } catch (error) {
    options.error = error;
    genericHTTPPostService(options, error);
  }
};

/**
 * Send JSON response
 */
var genericHTTPPostService = function(options) {
  if (options.httpResponse) {
    let res = options.httpResponse;
    if (options.error) {
      res.json(httpUtils.createResponseKo(500, options.error));
    } else {
      if (options.response)
        res.json(httpUtils.createResponse(options.response));
      else res.json(httpUtils.createResponse(null, 100, "Record not Found"));
    }
  }
};
