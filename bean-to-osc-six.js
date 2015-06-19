
// Originally written by Boris Kourtoukov, used in Costumes for Cyborgs. 
// May 2015
// additions: passing the bean name, enbale only if BT is active, added a listening socket. 
// Alex = changes to setup and subscribe 

"use strict";

Buffer.prototype.toByteArray = function() { return Array.prototype.slice.call(this, 0); }; // not sure what is going on here...

/* | Scratch Banks
---|---------------------------------*/

var scratchOne = "a495ff21c5b14b44b5121370f02d74de",
    scratchTwo = "a495ff22c5b14b44b5121370f02d74de",
    scratchThr = "a495ff23c5b14b44b5121370f02d74de";

// ******
// Adjust based on however many scratch characteristics you need to read. 
// Up to the three listed above. (Comma separated within brackets below.)

var scratch = [scratchOne];

var serviceUUID = "a495ff10c5b14b44b5121370f02d74de"; // look for bean specific characteristics

/* | Dependencies
---|---------------------------------*/

var noble = require('noble');
var osc   = require('osc-min');
var dgram = require('dgram');
var util  = require('util');
var async = require('async');
var _     = require('lodash');

/* | Globals
---|---------------------------------*/

var beanArray = [];

//var writeMe; // write to this characteristic, stored at the value of scratchTwo

var maxLength = 4;

/* | BLE State Change Detection
---|---------------------------------*/

noble.on('stateChange', function(state){
	if (state === 'poweredOn'){
		noble.startScanning();
		console.log("am started");
	} else {
		noble.stopScanning();
		console.log("am stoped");
	}
});

/* | OSC Variables
---|---------------------------------*/

var udp = dgram.createSocket("udp4");
var outport = 3000; // where this client is broadcasting too
console.log("OSC will be sent to: http://127.0.0.1:" + outport);
var inport = 4000;
console.log("OSC listener running at http://localhost:" + inport);

/* | Create and Listen to Messages from Processing
---|---------------------------------*/

var sock = dgram.createSocket("udp4", function(msg, rinfo){
			newSocket(msg, rinfo);
		});

sock.bind(inport); // this binds the socket to the port!


/* | FUNCTIONS
---|---------------------------------*/

/// Create a new socket ///////////////

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
    writeToBean(passThrough);

    
    
// end of new socket
};

/// write sockcet message from processing to bean ///////////////

var writeToBean = function(passThrough){

	var passThrough = passThrough;

    _.map(beanArray, function(n){

    	console.log("map:", n);

    	if(n.advertisement.localName === passThrough.name){

    		console.log("in Write to bean, im map: ", passThrough);
	
    		var name = n.advertisement.localName;
    		var toSend = passThrough.msg;

    			n.discoverSomeServicesAndCharacteristics(['a495ff20c5b14b44b5121370f02d74de'], [scratchThr], function(error, services, characteristics){

    			var service = services[0];
      			var characteristic = characteristics[0];

	      			if (toSend != null) {

		      			characteristic.write(new Buffer([toSend]), true, function(error) {
		        			if (error) { console.log(error); }
		        			console.log("wrote " + toSend + " to scratch bank 3");
		        				
		        			// not sure how to make the program resume, it stops here. No error, just stops processing. I don't want to disconnect it. 

		      			});
		      		}
    			});

    			/*n.disconnect(function(error) {
       			console.log('disconnected from peripheral: ' + n.uuid);
    			});*/
    		
    		
    	}		
	});
}

/// Pass data from bean to OSC to send to processing ///////////////
 
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

/// Read data from bean ///////////////

var readDataFromBean = function(name, characteristics) {
	
	console.log('readDataFromBean', name);
	
	_.map(characteristics, function(n, index){

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

		//console.log('insideSetupChars!', characteristics);
		
	});



};

/// Connect to beans, and if one disconnects, begin scanning again to find it ///////////////

var setupPeripheral = function(a) {

	//console.log("!setupPeripheral", a); // yes that is passing both
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

/*var disconnectBean = function(n) {
	n.disconnect();
	console.log( n.advertisement.localName + ' disconnected');
	n = null;
	noble.startScanning([], true);
	state = 'scanning';
}*/

/// Discover beans ///////////////

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