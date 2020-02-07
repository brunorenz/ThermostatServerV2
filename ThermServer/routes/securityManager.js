const globaljs = require("./global");
const config = require("./config");
const myutils = require("./utils/myutils");
const mongoDBMgr = require("./mongoDBManager");
var thermManager = require("./thermManager");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let getUserRecord = function() {
  let u = {
    email: "",
    password: "",
    name: ""
  };
  return u;
};

let sign = function(user) {
  let token = jwt.sign(user, globaljs.JWT.secret, {
    expiresIn: globaljs.JWT.expire
  });
  return token;
};

let verify = function(token) {
  try {
    let user = jwt.verify(token, globaljs.JWT.secret);
    console.log("JWT OK for " + user.email);
  } catch (error) {
    console.log("JWT KO for token " + token + " : " + error);
    return false;
  }
  return true;
};

exports.verifyToken = verify;

exports.readUser = function(options) {
  // mongodb
  let user = JSON.parse(options.request);
  console.log("USER " + typeof user);
  console.log("EMAIL " + typeof user.email);
  if (typeof user != "undefined" && typeof user.email != "undefined") {
    if (user.email === "65bruno@gmail.com" && user.password === "pippo") {
      let userOut = {
        email: user.email,
        name: "Bruno"
      };
      let token = sign(userOut);
      userOut.token = token;
      options.response = userOut;
    } else {
      options.errorCode = 200;
      options.error = "Utente o Password errati!";
    }
  }
  thermManager.callback(options);
};

exports.registerUser = function(user) {};
