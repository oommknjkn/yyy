/***
 * @fileOverview The back-end module which is running express.js
 */
const express = require('express');
const passport = require("passport");
const session = require('express-session');

const DiscordStrategy = require("passport-discord.js").Strategy;
const app = express();

// Util modules
const chalk = require('chalk');
const log = console.log;

// Run
exports.run = (client, config) => {

  /*
* App setup
*/

  // App view
  app.set('view engine', 'ejs');
  app.set('views', './src/views');

  // Asset directories
  app.use('/static', express.static('./src/dist'));
  app.use('/static', express.static('./src/plugins'));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false
    }
  }));

  // passport login strategy
  passport.use(new DiscordStrategy({
        clientID: client.user.id,
        clientSecret: config.clientSecret,
        callbackURL: config.redirectURI,
        scope: ["identify"]
      },
      function(accessToken, refreshToken, profile, done) {
        //Handle Database Query Addition Here.
        //console.log(profile);
        return done(null, profile);
      }
  ));

  passport.serializeUser(function(u, d) {
    d(null, u);
  });
  passport.deserializeUser(function(u, d) {
    d(null, u);
  });

  // (only-read) Basic information about the bot
  const botInfo = {
    username: client.user.username,
    status: client.user.presence.status,
    users: client.users.size,
    guilds: client.guilds.size
  };

  function accountImage (user) {
    return `<img src="${"https://cdn.discordapp.com/avatars/" + user.id + "/" + user.avatar + ".png"}" class="img-circle elevation-2" alt="User Image"></img>`
  }

  /*
  * Routing
  */
  // Index page
  app.get('/', (req, res) => {
    if (!req.session.user) {
      res.redirect('/auth/discord');
    } else {
      res.render('index', {page: "dashboard", botInfo: botInfo, userInfo: req.session.user, image: accountImage(req.session.user)});
      //res.send(`Hello ${req.session.user.username}`);
    }
  });

  // Authorizing pages
  app.get("/auth/discord", passport.authenticate("discord.js"));
  // Callback for the Discord login
  app.get("/auth/discord/callback", passport.authenticate("discord.js", { failureRedirect: "/auth/discord/error" }), function(req, res) {
    // Accessing the user object easier
    req.session.user = req.session.passport.user;
    // Successful authentication, redirect home.
    res.redirect("/");
  });

  // Listener
  app.listen(config.port, () => {
    log('INFO >> ' + chalk.green('Dashboard is running on port ' + config.port));
  });
}
