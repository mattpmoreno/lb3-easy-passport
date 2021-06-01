# Why does this exist?
The Loopback team created the [loopback-component-passport](https://github.com/strongloop/loopback-component-passport) in order to make the incorporation of Passport.JS easier. However, I found the implementation to be a huge pain. The Loopback team's documentation is a good start, but does not cover some of the current issues with implementation.

# Backend Setup

1. Follow the [directions given by the Loopback team to set up Passport.JS](https://loopback.io/doc/en/lb2/Third-party-login-using-Passport.html).
   - Watch out: Provider set up must occur after app.boot code (can also be inside of the callback). They don't call this out in their example, but booting the app is necessary in order to set up the models correctly. Otherwise, you'll encounter errors when loopback-component-passport tries to configure itself.
2. **Passport.JS Setup:** You need to add a bunch of Passport.JS specific stuff to the Loopback app setup. The following will help streamline this:

*/server/server.js*

    // Import this module
    let lbEasyPassport = require('lb3-easy-passport');
    // Create an instance of PassportConfigurator with the app instance
    // (If you havent already)
    let PassportConfigurator = require(
        'loopback-component-passport'
    ).PassportConfigurator;
    let passportConfigurator = new PassportConfigurator(app);
    ...
    // We will need a session secret for Express cookie-parser
    // (http://expressjs.com/en/resources/middleware/cookie-parser.html)
    let sessionSecret = process.env.sessionSecret | 'myNewSecret';
    // Before you boot the app, we need to begin the set up process
    lbEasyPassport.beginPassportJSSetup(app, sessionSecret);
    ...
    // After booting the app and setting up passportConfigurator,
    // we need to add a line to finalize setup
    boot(app, __dirname, function(err) {
        ...
        passportConfigurator.init(false);
        lbEasyPassport.finishPassportJSSetup(app);
        ...
    };

3. **Fixing Cookies:** I ended up having serious issues with the cookies that came in from third-party auth providers. Thus, I had to build a small boot script that intercepted the normal third-party authentication process and parse the cookies appropriately. If you run into this issue, you can add the following code to your server.js file:

*/server/server.js*

    // Import this module
    let lbEasyPassport = require('lb3-easy-passport');
    ...
    boot(app, __dirname, function(err) {
        ...
        // Frontend base url
        let basePath = 'https://myfrontendurl.com/';
        // Redirect for successful authentication, should match providers.json
        let redirect = '/auth/success';
        // This sends users to basePath/accessToken/userID after
        // successful authentication
        app.use(lbEasyPassport.fixCookies(app, basePath, redirect));
        ...
    });

4. **Getting Email:** After third-party authentication, it wasn't clear how to get the user's email address from the social media login information and add it to the user model (which I used to send a new account confirmation email, or to correspond with users). The way I tackled this was by intercepting any 'patch' update to the user model that included a specific flag, get the email from the social media info, and add it to the user model object. You can incorporate this by adding the following code to your user model's JS file:

*/server/models/[my-user-model].js*

    // Import this module in server.js
    let lbEasyPassport = require('lb3-easy-passport');
    // Need to import the app from /server/server.js
    let app = require('../server.js');
    ...
    module.exports = function(MyUserModel) {
    ...
    MyUserModel.beforeRemote('prototype.patchAttributes', async function(
        ctx, modelInstance
    ) {
        // Determine whether this needs us to get the email from social login
        // (I just add a flag to the request)
        if (ctx.args.data.needsEmailFromSocialLogin) {
            // this needs the name of the 'identity' model created by
            // Loopback passport configurator, probably MyUserModelIdentity
            // in this example
            let nameOfIdentityModel = 'MyUserModelIdentity';
            // We also need the userId generated by third-party authentication,
            // typically sent as an access token in the request
            let userId = ctx.args.options.accessToken.userId;
            // Need to go get the email from social media info
            let userEmail = await lbEasyPassport.getEmailFromSocialLogin(
                app, nameOfIdentityModel, userId
            );
            // Then you can add the email to the object
            ctx.args.data.[emailField] = userEmail;
        }
        // Need the return to end async callback
        return;
    });

