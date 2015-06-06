
// Originally written by Boris Kourt, used in Costumes for Cyborgs. 
// May 2015
// additions: passing the bean name, enbale only if BT is active, added a listening socket. 
// Alex = changes to setup and subscribe, and restructured the functions.

"use strict";

Buffer.prototype.toByteArray = function() { return Array.prototype.slice.call(this, 0); }; // not sure what is going on here...

/* | LightBlue Bean to OSC via NOBLE.
---|---------------------------------*/

var scratchOne = "a495ff21c5b14b44b5121370f02d74de",
    scratchTwo = "a495ff22c5b14b44b5121370f02d74de",
    scratchThr = "a495ff23c5b14b44b5121370f02d74de";

// ******
// Adjust based on however many scratch characteristics you need to read. 
// Up to the three listed above. (Comma separated within brackets below.)

var scratch = [scratchOne];

var serviceUUID = 'a495ff10c5b14b44b5121370f02d74de'; // look for bean specific characteristics

// ******

// dependenceies

var noble = require('noble');
var osc   = require('osc-min');
var dgram = require('dgram');
var util  = require('util');

var _     = require('lodash');

// Globals ============================================
var beanArray = [];

//var writeMe; // write to this characteristic, stored at the value of scratchTwo

var maxLength = 4;


// this will begin scanning only if bluetooth is enabled on the computer.

noble.on('stateChange', function(state){
	if (state === 'poweredOn'){
		noble.startScanning();
		console.log("am started");
	} else {
		noble.stopScanning();
		console.log("am stoped");
	}
});

// OSC Things 

var udp = dgram.createSocket("udp4");
var outport = 3000; // where this client is broadcasting too
console.log("OSC will be sent to: http://127.0.0.1:" + outport);
var inport = 4000;
console.log("OSC listener running at http://localhost:" + inport);

// OSC Talk back from Processing

//  CREATE AND BIND SOCKET TO LISTEN FOR MESSAGEES FROM PROCESSING ============
var sock = dgram.createSocket("udp4", function(msg, rinfo){
			newSocket(msg, rinfo);
		});

sock.bind(inport); // this binds the socket to the port!


// FUNCTIONS LIST =========================================

var newSocket = function(msg, rinfo){
	console.log('onCreateSocket', msg, rinfo);	
    var getMsg = osc.fromBuffer(msg);

    // make an object out of it
    var passThrough = {
    	msg      : getMsg.args[1].value,
    	name     : getMsg.args[0].value,
    	address  : getMsg.address,
    	type     : getMsg.oscType
    };

    console.log("newSocket", passThrough.name);

    _.map(beanArray, function(n){
    	if(n.advertisement.localName === passThrough.name){
    		// scratch === characteristic to write to.

    		// Trying with just the scratch bank number, get an Object does not have a "write" property

	        console.log('Writing to ', n.advertisement.localName, scratchTwo);
	        
	        // // IN HERE: write the buffer information you want to send to the bean
	        writeMe.write(new Buffer(passThrough.msg, false, function(err){
	        	if(err){ console.error(err); }
	        }));
			

    		/// try and find a buffer
		    
    	} else {
    		return;
    	}
    })
};


// Send data over OSC to Processing -- will need to be called now.
 
 var sendDataToOSC = function(characteristic, data, name) {

 	console.log('sendDataToOSC', characteristic, data, name);

 	var oscBuffer = osc.toBuffer({
 			address: "/data",
 			args: [name, characteristic, data]
		});

	udp.send(oscBuffer, 0, oscBuffer.length, outport, "127.0.0.1", function(err){
		if(err){console.error(err)}
		console.log(data);
	});

	oscBuffer = null;
};

var readDataFromBean = function(name, characteristics) {
	
	console.log('readDataFromBean', name);
	
	// This was an Alex edit, passing the object ito the forEach. 
	_.map(characteristics, function(n, index){

		
		// this is not correct. hmm....

		/*if(scratchTwo === n.uuid){ writeMe = n; }
		console.log("readData", n);*/

		var scratchNumber = index + 1;

		n.on("read", function(data, sad) {
			//console.log('inside Read marker', data, sad, 'name', name);
			var value = data[1]<<8 || (data[0]); // not sure what is going on here...

			sendDataToOSC(scratchNumber, value, name); // To OSC
		});

		n.notify(true, function(err) {
			if (err) throw err;
		});

		console.log("Sending data for scratch #" + scratchNumber);
	});
};

var setupChars = function(peripheral) {

	var name = peripheral.advertisement.localName;

	//console.log('insideSetupChars!', name);

	peripheral.discoverSomeServicesAndCharacteristics([],scratch,function(err,services,characteristics) {
		if (err) throw err;
		readDataFromBean(name, characteristics); // pass to subscribe / read
	});

};

var setupPeripheral = function(a) {

	console.log("!setupPeripheral", a); // yes that is passing both
	console.log('Connecting to ' + a.advertisement.localName + '...');

    a.connect(function(err) {
        if (err) throw err;

        console.log('Connected!', a.advertisement.localName );
        setupChars(a);
        

        a.on('disconnect', function(){
	    	console.log(a.advertisement.localName + " bean disconnected, trying to find it...");
        	noble.startScanning();
	    });

    });

}; 

noble.on('discover', function(peripheral) {


	//console.log(peripheral);

	  if (_.contains(peripheral.advertisement.serviceUuids, serviceUUID)) {
	  	console.log("Found a Bean");
	  	// stop looking for beans when you've connected to 4 of them. 

	  	if (beanArray.length >= maxLength) {
	  		noble.stopScanning();
	    	console.log(maxLength + " beans are connected. Stopped scanning.");
	  	}
	    // Once found, puch the array through to "peripheral"
	    beanArray.push(peripheral);
	    // throw them all to the setup function
	  	setupPeripheral(peripheral);

	  } else {
	  	console.log("Found a random BLE device, that is not a Bean, ignored.");
	  }


});

noble.startScanning();

process.stdin.resume(); //so the program will not close instantly


/* | Exit Handler
   | Disconnects from the bean, in order to reset BLE comms. */


function exitHandler(options, err) {
    if (options.cleanup) console.log(' see ya sucker! ');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));


