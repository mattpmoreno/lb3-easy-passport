import {LoopBackApplication} from "loopback";
import {IncomingHttpHeaders} from "http";
import * as core from "express-serve-static-core";
import {packageName} from "./global.constants";
let express = require('express');
let cookieParser = require('cookie');
/**
 * @function
 * @description
 * Fixes the cookies, parses out the new access token and user id, then routes users to the correct post-auth url
 * @param app {LoopBackApplication} the application handling authentication
 * @param basePath {string} the base url for the frontend, users will be routed here after auth success
 * @param redirect {string} the route users are sent to following third-party authentication
 * @return {core.Router} a router object we are using to update how routing is done
**/
export function fixCookies(app: LoopBackApplication, basePath: string, redirect: string): core.Router {
  // We create a separate router object to handle this new routing
  let router = express.Router();
  // Set up the authentication success route
  router.get(redirect, function(
    req: core.Request, res: core.Response, next: core.NextFunction
  ) {
    // Whenever we get a request from here, we need to extract the access token and user ID
    let tokenAndID: AccessTokenAndID = extractTokenAndIDFromHeaders(req.headers);
    // Then send that to the frontend for correct handling
    res.redirect(basePath + tokenAndID.access_token + '/' + tokenAndID.userId);
  });
  // Then we pass the new router out
  return router;
}
/**
 * @interface
 * @description
 * Interface for how we pass the token and ID around
**/
interface AccessTokenAndID {
  access_token: string,
  userId: string
}
/**
 * @function
 * @description
 * Extracts the token and ID from the passport.js headers after social media
 * authentication, so that we can put them in a redirect link
 * @param headers {IncomingHttpHeaders} the headers object in the request
 * @return {AccessTokenAndID}
 **/
function extractTokenAndIDFromHeaders(headers: IncomingHttpHeaders): AccessTokenAndID {
  // Parse it using this very simple package
  let parsedCookieObj = cookieParser.parse(headers.cookie);
  // Then we want to check if it has the right stuff
  if (parsedCookieObj.access_token && parsedCookieObj.userId) {
    // Then we have to fix some issues with the cookies as sent to us
    // eslint-disable-next-line camelcase
    parsedCookieObj.access_token = fixCookieIssue(parsedCookieObj.access_token);
    parsedCookieObj.userId = fixCookieIssue(parsedCookieObj.userId);
    return parsedCookieObj;
  } else {
    // Otherwise we throw
    throw packageName + ': Could not extract access_token and userId fields from third-party auth cookies.';
  }
}
/**
 * @function
 * @description
 * Because of new middleware, cookies now come in with weird stuff at the
 * front and back -- i need to cut that off then return the real object
 * @param brokenCookie {string} the broken cookie
 * @return {string} the fixed cookie
 **/
function fixCookieIssue(brokenCookie: string): string {
  let lookForFront = ':';
  let lookForBack = '.';
  // We look for certain characters we know are in the string, then remove them by slicing it out
  return brokenCookie.slice(
    brokenCookie.indexOf(lookForFront) + 1,
    brokenCookie.indexOf(lookForBack)
  );
}
