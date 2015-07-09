"use strict"

/* | Dependencies
---|---------------------------------*/

var noble = require('noble');  // drives the BLE process
var _     = require('lodash'); // ??
var osc   = require('osc-min'); // converts OSC messages to JSON sends JS stuff to OSC
var dgram = require('dgram'); // needed for OSC server support
var util  = require('util'); // needed for socker support

/* | Global Variables
---|---------------------------------*/

var exitHandlerBound = false;
var beanMap = {};

/* | Bean Specific Service UUID
---|---------------------------------*/

var serviceUUID = 'a495ff10c5b14b44b5121370f02d74de';


/* | OSC Variables
---|---------------------------------*/

var udp = dgram.createSocket("udp4"); // server
var outport = 3000; // where this client is broadcasting too
console.log("OSC will be sent to: http://127.0.0.1:" + outport);
var inport = 4000;
console.log("OSC listener running at http://localhost:" + inport);

/************ | FUNCTIONS
-----------------------------|--------------------------------*/

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


/* | DISCOVER BEANS
---|---------------------------------*/

var discoverBeans = function(q) {

	// discover all the beans

	if (_.contains(q.advertisement.serviceUuids, serviceUUID)) {		
		console.log("found bean:" + q.advertisement.localName + " - UUID: " + q.uuid);
		
		// this makes an object w/ a key of the UUID and the local name

    	beanMap[q.advertisement.localName] = q.advertisement;
    	console.log("!discover", beanMap);  	
    	q.connect(connect.bind({q:q}));  // making the bean into an objcet and binding it to connec


	}else {
		console.log("not a bean");
	}
	
};


/* | CONNECT TO BEANS AND SET UP SCRATCH SERVICES
---|----------------------------------------------------*/


var connect = function(err) {
	if (err) throw err;
	console.log("Connection to " + this.q.uuid);

	var thisBean = this.q;
	var beanName = thisBean.advertisement.localName;

	console.log("!connect", beanName);

	thisBean.on('disconnect', function(){
		console.log(thisBean.advertisement.localName + " disconnected, trying to find it...");
		noble.startScanning();
	});
	setupServices(beanName, thisBean);

};

var setupServices = function(beanName, thisBean) {
	
	console.log("!setupServices", beanName, thisBean);

	thisBean.discoverServices(null, function(err, services) {

		services.forEach(function(service){
			if (service.uuid === 'a495ff20c5b14b44b5121370f02d74de') {
				console.log("found scratch services");
				var characteristicUUIDs = ['a495ff21c5b14b44b5121370f02d74de', 'a495ff22c5b14b44b5121370f02d74de', 'a495ff23c5b14b44b5121370f02d74de'];
				service.discoverCharacteristics(characteristicUUIDs, function(err, characteristics) { 
					if (err) throw err;
					console.log("!service.discovered ", beanName + " scratch characteristics");

					// send that shit to read and write
					readFromBean(beanName, characteristics[0], characteristics[1]); // name, scratch one, and scratch two
                    beanMap[beanName].characteristics = characteristics;
				});
			}

		});
		/******** Handy List

		console.log('discovered the following services:');
      	for (var i in services) {
        	console.log('  ' + i + ' uuid: ' + services[i].uuid);
      	}*/

	});
};

/* | READ FROM BEAN
---|---------------------------------*/

var readFromBean = function(beanName, scratchOne, scratchTwo) {

	//console.log("!readFromBean", beanName, scratchOne, scratchTwo );
	console.log("!readFromBean", beanName);

		scratchOne.on('read', function(data, isNotification) {
			var scratchNumber = 1;
			var value = data.readUInt32LE (0) / 1000;
			console.log(beanName + " altitude: " + value);
			sendToOsc(beanName, scratchNumber, value);
		});

		scratchOne.notify(true, function(err) {
			if (err) throw err;
		});
		scratchTwo.on('read', function(data, isNotification) {
			var scratchNumber = 2;
			var value = data.readUInt32LE(0);
			console.log(beanName + " delta acceleration: " + value);
			sendToOsc(beanName, scratchNumber, value );
		});

		scratchTwo.notify(true, function(err) {
			if (err) throw err;
		});

};


/* | OSC SEND
---|----------------------------------------------------*/

var sendToOsc = function(beanName, scratchNumber, value) {

	console.log("!sendToOsc", scratchNumber, value, beanName);

	var oscBuffer = osc.toBuffer({
		address: "/data",
		args: [beanName, scratchNumber, value]
	});

	udp.send(oscBuffer, 0, oscBuffer.length, outport, "127.0.0.1", function(err){
		if(err){console.error(err)}
		console.log("!udp.send", value);
	});

	oscBuffer = null;

};


/* | OSC RECEIVE
---|----------------------------------------------------*/

var oscSocket = dgram.createSocket("udp4", function(msg, rinfo) {
  var error;
  try {
    var getMsg = osc.fromBuffer(msg);
      
        var messageParameters = {
    		msg      : getMsg.args[1].value,
    		name     : getMsg.args[0].value
   		};
      
      writeToBean ( messageParameters.name, messageParameters.msg );
//    return console.log(getMsg);
  } catch (_error) {
    error = _error;
    return console.log("invalid OSC packet");
  }
});

oscSocket.bind(inport);

/* | WRITE TO BEAN
---|----------------------------------------------------*/

// take input OSC, write to bean scratch bank

var writeToBean = function ( beanName, toSend ) {


    console.log("!sending to ", beanName);

    beanMap[beanName].characteristics[2].write(new Buffer([toSend]), true, function(error) {
        if (error) { console.log(error); }
            console.log("wrote " + toSend + " to scratch bank 3 of " + beanName);
    });

    beanMap[beanName].characteristics[2].notify(true, function(err) {
        if (err) throw err;
    });

}

/* | NOBLE PROCESS
---|---------------------------------*/

// only find beans with a particular service UUID
noble.startScanning([serviceUUID], false);
noble.on('discover', discoverBeans);
process.stdin.resume(); //so the program will not close instantly


/* | EXIT HANDLER
---|---------------------------------*/


var exitHandler = function exitHandler(options, err) {

	if (options.cleanup) console.log(' am closing now! ');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
};

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));