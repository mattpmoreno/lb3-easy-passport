import {fixCookies} from './src/fixing-cookies';
import {getEmailFromSocialLogin} from './src/getting-email';
import {beginPassportJSSetup, finishPassportJSSetup} from './src/passportjs-setup';

export default {
  fixCookies: fixCookies,
  getEmailFromSocialLogin: getEmailFromSocialLogin,
  beginPassportJSSetup: beginPassportJSSetup,
  finishPassportJSSetup: finishPassportJSSetup,
};
