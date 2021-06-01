import {LoopBackApplication} from "loopback";

// Need a bunch of express-related modules to use passport.js
let session = require('express-session');
let flash = require('express-flash');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
/**
 * @function
 * @description
 * Performs the first portion of our Passport.JS setup, which occurs prior to booting the app.
 * This primarily includes adding the appropriate middleware to ensure Passport.JS works correctly
 * @param app {LoopBackApplication} the loopback application where we use passportJS
 * @param sessionSecret {string} the session secret for express / passport / loopback
 * @return {void}
**/
export function beginPassportJSSetup(app: LoopBackApplication, sessionSecret: string): void {
  // to support JSON-encoded bodies
  app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
  app.middleware('parse', bodyParser.urlencoded({extended: true}));
  app.middleware('session:before', cookieParser(sessionSecret));
  app.middleware('session', session({
    secret: sessionSecret,
    saveUninitialized: true,
    resave: true,
  }));
};
/**
 * @function
 * @description
 * Performs the last portion of our Passport.JS setup, which occurs after booting the app
 * @param app {LoopBackApplication} the loopback application where we use passportJS
 * @return {void}
**/
export function finishPassportJSSetup(app: LoopBackApplication): void {
  // Setting up flash
  app.use(flash());
}