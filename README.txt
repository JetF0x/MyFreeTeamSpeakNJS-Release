run 'npm install'

Open /nodemodules/ts3-nodejs-library/TeamSpeak3.js

Comment out line 558

Replace Line 1480 with this

    privilegekeyAdd(type, group, cid, description) {
        var prop = {tokentype: type, tokenid1: group, tokenid2: 0}
        if (type === 1) prop.tokenid2 = cid
        if (description) prop.description = description
        return this.execute("privilegekeyadd", prop)
    }

	
go to database.js and put your mongodb information.

run 'node server.js'

go to website and fill in setup fields.

Done


If you want to change the slots in which the servers are created with edit line 137 of passport.js.

THIS VERSION OF MYFREETEAMSPEAK WILL ONLY WORK ON FRESH INSTALLATIONS OF TEASPEAK, WILL NOT MERGE WITH EXISTING.