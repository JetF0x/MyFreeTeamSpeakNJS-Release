// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var serverSchema = mongoose.Schema({

    local            : {
        location        : String,
        ip     : String,
        queryport           : String,
        serveradmin         : String,
        password  : String,
        maxServers  : String
    }

});


// create the model for users and expose it to our app
module.exports = mongoose.model('Servers', serverSchema);