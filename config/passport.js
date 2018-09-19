// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../app/models/user');
//load up the server model
var Servers            = require('../app/models/servers');
// load up the teamspeak information
const TeamSpeak3 = require("ts3-nodejs-library")


Servers.find({}, '', function(err, server){
    if(err){
        console.log(err);
    } else{
        try{
        console.log('Retrieved ', server.length, ' server/s from database')
        //Create a new Connection
    global.ts3 = new TeamSpeak3({
    host: server[0].local.ip,
    queryport: server[0].local.queryport,
    username: server[0].local.serveradmin,
    password: server[0].local.password
})

    global.sip = server[0].local.ip;
    global.squery = server[0].local.queryport;
    global.suser = server[0].local.serveradmin;
    global.spassword = server[0].local.password;
    global.smaxServer = server[0].local.maxServers; 
}
catch(e){
    console.log("Server Startup Error -> MISSING DATABASE -- Ignore if first time running")
}

}})



// expose this function to our app using module.exports
module.exports = function(passport) {
 // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {
                //try for first DB initialization if it catches then it knows nothing exists and will create it
                try{
                    User.find({}).sort({'local.port': -1}).exec(function(err, docs) {
                        try{
                            console.log("DEBUG: PORT DETECTED " + docs[0].local.port); 
                            //Assign Port Var
                            var portserver = (docs[0].local.port + 1);
                            console.log("Assigning port "+portserver);
                            // if there is no user with that email
                            Servers.find({}, '', function(err, server){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    try{
                                        //Do Connection Shit
                                          ts3 = new TeamSpeak3({
                                          host: server[0].local.ip,
                                          queryport: server[0].local.queryport,
                                          username: server[0].local.serveradmin,
                                          password: server[0].local.password
                                        })
                                        sip = server[0].local.ip;
                                        squery = server[0].local.queryport;
                                        suser = server[0].local.serveradmin;
                                        spassword = server[0].local.password;
                                        smaxServer = server[0].local.maxServers; 
                                        //Do Server Creation Below
                                                                    //Lets Try Server Creation.... (Detection Fails, Manual Override using DB.)
                            ts3.on("ready", () => {
                                console.log("Server Reports Ready Query");
                            ts3.serverCreate({virtualserver_maxclients:  32}).then(res =>{

                                ts3.quit().then(function(da){

                                
                              //console.log("You do reach here"); <-- line 558 removal test
                              var newUser            = new User();
                                        newUser.local.email    = email;
                                        newUser.local.password = newUser.generateHash(password);
                                        newUser.local.ip = sip;
                                        newUser.local.port = portserver;
                                        console.log("Completed "+portserver);
                                        newUser.save(function(err) {
                                            if (err)
                                                throw err;
                                            return done(null, newUser);
                                        });
                                        //Flush and save
                                //success
                                //res.token holds the serveradmin token REMOVE LINE 558 in nodejs library teamspeak3.js this will not work for res.token
                                //res.server holds the created virtual server instance
                                })
                        // ^^ EXIT SERVERQUERY
                            }).catch(e => console.log("CATCHED", e));
                            //  ^^ END Global.ts3 servercreate.
                        })
                        //^^ end Global.ts3.on.ready
                                    }catch(e){
                                        console.log("Server Error -> Missing Database")
                                    }
                                }
                            })


                        }
                        catch(e){
                            console.log("Caught no port? assigning 9987.. "+ e);
                            // if there is no user with that email
                            // create the user
                            var newUser            = new User();
            
                            // set the user's local credentials
                            newUser.local.email    = email;
                            newUser.local.password = newUser.generateHash(password);
                            newUser.local.ip = global.sip;
                            newUser.local.port = "9987";
                            newUser.local.isAdmin = "1";
                            
                            // save the user
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }

                        });
            
                }
                catch (e){

                }


            }

        });    

        });

    }));

};