var globaljs = require("./global");
var config = require("./config");
var httpUtils = require("./utils/httpUtils");
var thermManager = require("./thermManager");

exports.getConfiguration = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;
  httpResponse.header("Access-Control-Allow-Origin", "*");
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
      createIfNull: false,
      update: false
    };
    options.callback = genericHTTPPostService;
    thermManager.readConfigurationInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
  }
};
/**
 * Get programming info type = temp/light prog = all / reset
 * @param {*} httpRequest
 * @param {*} httpResponse
 */
exports.getProgramming = function(httpRequest, httpResponse) {
  if (!httpUtils.checkSecurity(httpRequest, httpResponse)) return;

  try {
    var type = config.TypeProgramming.THEMP;
    //    var p = myutils.httpGetParam(req);
    if (httpRequest.query.type) {
      if (httpRequest.query.type === "temp")
        type = config.TypeProgramming.THEMP;
      else if (httpRequest.query.type === "light")
        type = config.TypeProgramming.LIGTH;
    }
    var options = {
      httpRequest: httpRequest,
      httpResponse: httpResponse,
      programmingType: type,
      action: thermManager.TypeAction.READ,
      createIfNull: true
    };
    options.callback = genericHTTPPostService;
    thermManager.programmingInternal(options);
  } catch (error) {
    httpResponse.json(httpUtils.createResponseKo(500, error));
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
