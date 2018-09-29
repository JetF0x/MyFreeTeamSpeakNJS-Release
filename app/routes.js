// app/routes.js

// load up the teamspeak information
const TeamSpeak3 = require("teaspeak-nodejs-library")
var User            = require('../app/models/user');
var Servers            = require('../app/models/servers');



module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        Servers.find({}, 'local.location', function(err, server){
            if(err){
                console.log(err);
            } else{

                //console.log('Retrieved servers ', server.length, server[0].local.location)
                res.render('index.ejs',{
                    sinfo : server,
                    message: req.flash('setupMessage')
                })
            }
        })
    });

    app.post('/', function(req, res){
        Servers.find({}, 'local.location', function(err, server){
            if(err){
                console.log(err);
            } else{
                //console.log('Retrieved servers ', server.length, server[0].local.location)
                if (server.length > 0){
                    console.log("Some fucker tried adding another server, most likely an invalid server.");
                    res.redirect("/");
                }
                else if (server.length == 0){
                    var startstopvar = req.param('startstop');
                    //add admin server below
                    var location = req.param('location');
                    var ip = req.param('ip');
                    var queryport = req.param('queryport');
                    var serveradmin = req.param('serveradmin');
                    var serverpassword = req.param('password');
                    var maxservers = req.param('maxServers');
             if (location != null){
                addserver(location, ip, queryport, serveradmin, serverpassword, maxservers);
                req.flash("setupMessage", { "success" : "Server Added" });
                res.redirect("/");
            }
            else{
                console.log("Attempted to setup invalid information for first server");
                req.flash("setupMessage", { "failure" : "An Invalid Server Was Entered" });
                res.redirect("/");
            }
                }
                else {
                    console.log("Check index.ejs post");
                }
            }
        })
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    // app.post('/login', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        Servers.find({}, '', function(err, server){
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { 
            message: req.flash('signupMessage'),
            server  :   server

         });
        })
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    // app.post('/signup', do all our passport stuff here);
    

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {

        //

        Servers.find({}, '', function(err, server){
            if(err){
                console.log(err);
            } else{
        
                console.log('Retrieved ', server.length, ' server/s from database')
                //Create a new Connection
            ts3 = new TeamSpeak3({
            host: server[0].local.ip,
            queryport: server[0].local.queryport,
            username: server[0].local.serveradmin,
            password: server[0].local.password,
        })

            ts3.on("ready", () => {
                ts3.useByPort(req.user.local.port).then(function(result){
                    ts3.serverInfo().then(function(result){
                        //console.log(result);
                        ts3.clientList().then(function(clientList){
                            //console.log(clientList['_propcache']);
                        
                        ts3.privilegekeyList().then(function(keys){
                            ts3.quit().then(function(da){
                                //console.log(da) disconnection true
                                //console.log(Array.isArray(keys))
                                var arraydetect = Array.isArray(keys);
                                //console.log(clientList);
                                res.render('profile.ejs',{
                                    user : req.user,
                                    infoServer  : result,
                                    tokenInfo   : keys,
                                    onlineClients   : clientList,
                                    arraydetect : arraydetect
                                })
                        }).catch(e => console.log("CATCHED", e.message))

                        }).catch(function(error){
                            if (error.message == "sql empty result set, empty!"){
                                ts3.quit().then(function(da){
                                    //console.log(da) disconnection true
                                    res.render('profile.ejs',{
                                        user : req.user,
                                        infoServer  : result,
                                        tokenInfo   : "No Keys Available"
                                    })
                            }).catch(e => console.log("CATCHED", e.message))
                            }
                            else{
                            console.log("Report this error to jetfox", error)
                            }
                        })
                    }).catch(e => console.log("CATCHED", e.message))
                }).catch(e => console.log("CATCHED", e.message))
                }).catch(e => console.log("CATCHED", e.message))

            })
        }
        
        })
        });


    // =====================================
    // SERVER SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/server', isLoggedIn, function(req, res) {
        res.render('server.ejs', { 
            message: req.flash('serverMessage'),
            user : req.user // get the user out of session and pass to template
         }); 
        

          // process the login form
          app.post('/server', function(req, res){
            var startstopvar = req.param('startstop');
                if (startstopvar == "stop"){
                    startstop(startstopvar, req.user.local.port);
                    req.flash("serverMessage", { "success" : "Server Stopped" });
                    res.redirect("/server");
                }
                else if (startstopvar == "start"){
                    startstop(startstopvar, req.user.local.port);
                    req.flash("serverMessage", { "success" : "Server Started" });
                    res.redirect("/server");
                }
                else if (startstopvar == "token"){
                    startstop(startstopvar, req.user.local.port);
                    req.flash("serverMessage", { "success" : "Token Generated" });
                    res.redirect("/server");
                }
                else{
                    console.log("Attempted to call startstop with invalid command");
                    req.flash("serverMessage", { "failure" : "An Invalid Command Was Entered" });
                    res.redirect("/server");
                }
        });
        });

     // =====================================
    // SERVER ADMIN SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/admin', isLoggedIn, function(req, res) {
        res.render('admin.ejs', { 
            message: req.flash('serverMessage'),
            user : req.user // get the user out of session and pass to template
         }); 
        
      // process the login form
  /*  app.post('/server', passport.authenticate('local-server', {
        successRedirect : '/server', // redirect to the secure profile section
        failureRedirect : '/profile', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
        }));
    }); */

          // process the admin form
          app.post('/admin', function(req, res){
            var startstopvar = req.param('startstop');
                        //add admin server below
                        var location = req.param('location');
                        var ip = req.param('ip');
                        var queryport = req.param('queryport');
                        var serveradmin = req.param('serveradmin');
                        var serverpassword = req.param('password');
                        var maxservers = req.param('maxServers');
                if (startstopvar == "stop"){
                    startstop(startstopvar, req.user.local.port);
                    req.flash("serverMessage", { "success" : "Server Stopped" });
                    res.redirect("/admin");
                }
                else if (startstopvar == "start"){
                    startstop(startstopvar, req.user.local.port);
                    req.flash("serverMessage", { "success" : "Server Started" });
                    res.redirect("/admin");
                }
                else if (location != null){
                    addserver(location, ip, queryport, serveradmin, serverpassword, maxservers);
                    req.flash("serverMessage", { "success" : "Server Added" });
                    res.redirect("/admin");
                }
                else{
                    console.log("Attempted to call startstop with invalid command");
                    req.flash("serverMessage", { "failure" : "An Invalid Command Was Entered" });
                    res.redirect("/admin");
                }
        });
        });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function startstop(startorstop, port){
    //Create a new Connection
    Servers.find({}, '', function(err, server){
        if(err){
            console.log(err);
        } else{
            try{
            console.log('Retrieved ', server.length, ' server/s from database')
            //Create a new Connection
        var ts3 = new TeamSpeak3({
        host: server[0].local.ip,
        queryport: server[0].local.queryport,
        username: server[0].local.serveradmin,
        password: server[0].local.password,
    })

    if (startorstop == "stop"){
        console.log("attempting to stop " + port);
        //ts stop
        ts3.on("ready", () => {
            ts3.serverIdGetByPort(port).then(function(result){
                ts3.serverStop(result.server_id).then(function(result){
                    //console.log(JSON.stringify(result))
                    console.log("Stopped Server:" + port)
                }).catch(e => console.log("CATCHED", e.message))
                //console.log("server id: " + result.server_id)
            }).catch(e => console.log("CATCHED", e.message))
        })
        //end stop code
        return;
    }
     else if (startorstop == "start"){
        console.log("attempting to start " + port);
        //ts start
        ts3.on("ready", () => {
            ts3.serverIdGetByPort(port).then(function(result){
                ts3.serverStart(result.server_id).then(function(result){
                    //console.log(JSON.stringify(result))
                    console.log("Started Server:" + port)
                }).catch(e => console.log("CATCHED", e.message))
                //console.log("server id: " + result.server_id)
            }).catch(e => console.log("CATCHED", e.message))
        })
        //end start code
        return;
    }
    else if (startorstop == "token"){
        console.log("attempting to generate token on " + port);

        ts3.on("ready", () => {
            try{
                ts3.useByPort(port).then(function(result){
                    ts3.getServerGroupByName("Server Admin").then(function(res){
                        ts3.privilegekeyAdd(0, res.getCache().sgid).then(function(t){
                        ts3.quit().then(function(finished){
                            console.log("Token Generated For Port:", port)
                        }).catch(e => console.log("MAJOR DISCONNECTION ERROR", e))
                        }).catch(e => console.log("CATCHED", e))
                    }).catch(e => console.log("CATCHED", e))
                }).catch(e => console.log("CATCHED", e))
            }catch (e){
                console.log("Catched", e)
            }
        })
        

        
        //ts start
        /*ts3.on("ready", () => {
            ts3.useByPort(port).then(function(result){
                ts3.getServerGroupByName("Server Admin").then(function(result){
                    ts3.privilegekeyAdd(result._propcache.type, result._propcache.sgid).then(function(result){
                        console.log("Token Added:")
                        ts3.quit().then(function(da){
                            console.log("Token Generator Disconnected")
                        }).catch(e => console.log("CATCHED", e))
                    }).catch(e => console.log("CATCHED", e))
                }).catch(e => console.log("CATCHED, e.message"))
            }).catch(e => console.log("CATCHED", e.message))
        }) */
        //end start code
        return;
    }
    else {
        console.log("attempted to call startstop with invalid command");
        return;
    }
    
        }
        catch(e){
            console.log("Phase Server Detected Error #1");
        } 
    }
    })

    
}

function addserver(location, ip, port, serveradmin, password, maxservers){


        var newServer            = new Servers();

        // set the user's local credentials
        newServer.local.location    = location;
        newServer.local.ip = ip;
        newServer.local.queryport = port;
        newServer.local.serveradmin = serveradmin;
        newServer.local.password = password;
        newServer.local.maxServers = maxservers;
        

    newServer.save(function(error){
        console.log("Your server has been added!");
        if (error){
            console.error(error);
        }
    })
}