// giving this a try.
// Code written by Boris Kourt, used in Costumes for Cyborgs. 
// May 2015
// additions: passing the bean name, enbale only if BT is active, added a listening socket. 
// Alex = changes to a few functions. 

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
// I still feel like this is wrong. 


var sock = dgram.createSocket("udp4", onCreateSocket);

function onCreateSocket(msg, rinfo){

	var isAll;
	isAll = parseMsg(msg);
	writeData(isAll);

	function writeData() {

		b = beanArray; //yeah i know. 
		
		//ok this is AT LEAST getting both bean objects into this thing. So I have something to work with

		console.log("!writeData", b.length); 
		console.log("writeData", isAll);

		var colour = isAll[0];
		var whichBean = isAll[1];
		console.log("writeData: ", colour, whichBean);

		// crap...I need to figure out how to set up a write back to a scratch bank.

	}
	
}

function parseMsg(msg) {
	//console.log("!parseMsg",msg);

	// get at all that info being sent out from Processing.

        //console.log(osc.fromBuffer(msg));

        var getMsg = osc.fromBuffer(msg);
        var isMsg = getMsg.args[0].value;
        var isName = getMsg.args[1].value;
        var isAdd = getMsg.address;
        var isType = getMsg.oscType;

        // make an array out of it

        var isAll = [];
        isAll.push(isName);
        isAll.push(isMsg);
        isAll.push(isAdd);
        isAll.push(isType);

        // return the array 
        //console.log(isAll);
        return isAll; 
	
}

sock.bind(inport); 



// Send data over OSC to Processing

var sendDataToOSC = null;

{   var oscBuffer;

	sendDataToOSC = function(characteristic, data, name) {
		//console.log('sendDataToOSC', data)
		

		oscBuffer = osc.toBuffer({
			address: "/data",
			args: [name, characteristic, data]
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

var subscribeToChars = function(name, characteristics) {

	console.log('subscribeToChars', name);
	
	// This was an Alex edit, passing the object ito the forEach. 

	characteristics.forEach(function (nobleObject, index) {

		//console.log('whereIsThisBreaking', nobleObject, 'idx', index);

		var scratchNumber = index + 1;

		nobleObject.on("read", function(data, sad) {
			
			console.log('inside Read marker', data, sad, 'name', name);

			var value = data[1]<<8 || (data[0]); // not sure what is going on here...
			sendDataToOSC(scratchNumber, value, name); // To OSC	
		});


		nobleObject.notify(true, function(err) {
			if (err) throw err;
		});

		console.log("Sending data for scratch #" + scratchNumber);

	});
};

var setupChars = function(peripheral) {
	var name = peripheral.advertisement.localName;

	console.log('insideSetupChars!', name);

	peripheral.discoverSomeServicesAndCharacteristics([],scratch,function(err,services,characteristics) {
		if (err) throw err;
		console.log('SetupChars!', name);
		subscribeToChars(name, characteristics);
		
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

var beanArray = [];


noble.on('discover', function(peripheral) {


	//console.log(peripheral);

	  if (_.contains(peripheral.advertisement.serviceUuids, serviceUUID)) {
	  	console.log("Found a Bean");

	  	//noble.stopScanning();
	    //console.log("Stopped scanning.");
	    // Once found, connect:
	    beanArray.push(peripheral);
	  	setupPeripheral(peripheral);

	  } else {
	  	console.log("Found a random BLE device, that is not a Bean, ignored.");
	  }


	//console.log("beanArray:", beanArray.length, beanArray[0], beanArray[1]);
	if(beanArray.length > 2 ){
		beanConnect(beanArray);
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


/// Just saving this ////

/*var writeToChars = function (nobleObject, name, characteristics) { // this is passing values from the BLE setup function

	console.log("writeToChars", nobleObject, name, characteristics);

	// i need to get isAll to here. 
	// eventually this will write some values from isAll into a scratch bank. 

}*/
/*var sock = dgram.createSocket("udp4", function(msg, rinfo, isAll) {
	
    try {
        
        // get at all that info being barffed out at you from Processing.
        
        //console.log(osc.fromBuffer(msg));

        var getMsg = osc.fromBuffer(msg);
        var isMsg = getMsg.args[0].value;
        var isName = getMsg.args[1].value;
        var isAdd = getMsg.address;
        var isType = getMsg.oscType;

        // make an array out of it

        var isAll = [];
        isAll.push(isName);
        isAll.push(isMsg);
        isAll.push(isAdd);
        isAll.push(isType);

        // return the array 

        return isAll; 
        //writeToChars(isAll);
        //passMsg(isAll);
      

    } catch (error) {
        //console.log("invalid OSC packet");
        console.log(error);
    }
});*/


/*function passMsg (isAll) {
	var b = isAll;
	return b;

	// for now just see if you can write it to the scratch bank.

	// if is address == X type == message
		//  if isName == name
			// write msg to scratch bank two

			// if isname == other name 
				// write msg to scratch bank two  
}*/



