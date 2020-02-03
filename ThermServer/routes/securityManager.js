const globaljs = require("./global");
const config = require("./config");
const myutils = require("./utils/myutils");
const mongoDBMgr = require("./mongoDBManager");

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
  let token = jwt.sign({ id: user.email }, globalks.JWTSecret, {
    expiresIn: globaljs.JWTExpire
  });
};

let verify = function(token) {
  try {
    let user = jwt.sign(token, globalks.JWTSecret);
    console.log("JWT OK for " + user);
  } catch (error) {
    console.log("JWT KO for token " + token + " : " + error);
    return false;
  }
  return true;
};
exports.readUser = function(user) {};

exports.registerUser = function(user) {};
