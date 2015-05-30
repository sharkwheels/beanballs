// giving this a try via just straight up nobel.
// Code written by Boris Klout, used in Costumes for Cyborgs. 
// May 2015
// additions: passing the bean name, enbale only if BT is active, added a listening socket. 

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

// ******

// dependenceies

var noble = require('noble');
var osc   = require('osc-min');
var dgram = require('dgram');
var util  = require('util');
var _     = require('lodash');

// this will begin scanning only if blue tooth is enabled on the computer.

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

// I feel like I'm doing this wrong, but it seems to be ok for now.
var sock;

sock = dgram.createSocket("udp4", function(msg, rinfo) {
    try {
        console.log("received: ");
        var b = osc.fromBuffer(msg);
        console.log(b);

    } catch (error) {
        return console.log("invalid OSC packet");
    }
});

sock.bind(inport);


// Send Data Function
var sendDataToOSC = null;
var beanName; // yes its a global but fuck it. I have to run this process like twice. 


{   var oscBuffer;

	sendDataToOSC = function(characteristic, data) {

		

		oscBuffer = osc.toBuffer({
			address: "/data",
			args: [beanName, characteristic, data]
		});

		try {
			udp.send(oscBuffer, 0, oscBuffer.length, outport, "127.0.0.1");
			console.log(data);
			
		} catch (e) {
			console.log("Error Thrown:");
			console.log(e);
		}

		oscBuffer = null;

	};




};


var serviceUUID = 'a495ff10c5b14b44b5121370f02d74de'; // look for bean specific characteristics
var connectedBean = null;


var subscribeToChars = function(characteristics) {


	characteristics.forEach(function (characteristic, index) {

		var scratchNumber = index + 1;

		characteristic.on("read", function(data, sad) {
			var value = data[1]<<8 || (data[0]); // not sure what is going on here...
			sendDataToOSC(scratchNumber, value); // To OSC	
		});

		characteristic.notify(true, function(err) {
			if (err) throw err;
		});

		console.log("Sending data for scratch #" + scratchNumber);

	});
};

var setupChars = function(peripheral) {

	peripheral.discoverSomeServicesAndCharacteristics([],scratch,function(err,services,characteristics) {
		if (err) throw err;
		subscribeToChars(characteristics);
		
	});

};

var setupPeripheral = function(peripheral) {

	console.log('Connecting to ' + peripheral.advertisement.localName + '...');

    peripheral.connect(function(err) {
        if (err) throw err;

        console.log('Connected!');

        connectedBean = peripheral; // Sets the global to the Bean. Yuck.


        setupChars(connectedBean); // passing to other function.



        connectedBean.on('disconnect', function(){
	    	console.log("The bean disconnected, trying to find it...");
        	noble.startScanning();
	    });

    });

    beanName = peripheral.advertisement.localName;

    return beanName;

}; 

// noble's discovery thing. What its saying is if this BLE object has these particular scratch characteristcs then connect to it.

noble.on('discover', function(peripheral) {


	  if (_.contains(peripheral.advertisement.serviceUuids, serviceUUID)) {
	  	console.log("Found a Bean");
	  	noble.stopScanning();
	    console.log("Stopped scanning.");

	    // Once found, connect:
	  	setupPeripheral(peripheral);

	  } else {
	  	console.log("Found a random BLE device, that is not a Bean, ignored.");
	  }

});

noble.startScanning();

process.stdin.resume(); //so the program will not close instantly


/* | Exit Handler
   | Disconnects from the bean, in order to reset BLE comms. */

var triedToExit = false;

function exitHandler(options, err) {
  if (connectedBean && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting from Bean...');
    connectedBean.disconnect(function(err) {
      console.log('Disconnected.');
      process.exit();
    });
  } else {
    process.exit();
  }
}

process.on('SIGINT', exitHandler.bind(null, {exit:true}));
