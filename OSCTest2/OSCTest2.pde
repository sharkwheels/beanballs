/* | LIBARIES
---|----------------------------------------------------*/

import oscP5.*;
import netP5.*;
import ddf.minim.*;
import ddf.minim.ugens.*;

/* | OSC variables
---|----------------------------------------------------*/

OscP5 oscP5;
NetAddress myRemoteLocation;

/* | MINIM SETUP
---|----------------------------------------------------*/

Minim       minim;
AudioOutput out;
Oscil       wave;

/* | CALIBRATION VARIABLES
---|----------------------------------------------------*/

FloatDict beanBaromLast = new FloatDict();
FloatDict beanBaromBase = new FloatDict();
println("beanBaromLast: "+beanBaromLast);
println("beanBaromBase: "+beanBaromBase);


/* | BACKGROUND COLOUR
---|----------------------------------------------------*/

boolean blueThing = false;
boolean redThing = true;

/* | BEAN GLOBALS
---|----------------------------------------------------*/

String [] beanNames = {"BeanBall1","BeanBall2"};


/* | SETUP
---|----------------------------------------------------*/


void setup() {

	// FILE

	size(800,800);
	frameRate(25);
	background(0);

	// OSC

	oscP5 = new OscP5(this, 3000); // THIS is receving info from the bean.
	myRemoteLocation = new NetAddress("127.0.0.1", 4000); /// broadcast? This is a unicast. Hmm.
	println("Broadcasting on:" + myRemoteLocation);

	// MINIM

	minim = new Minim(this);
  	out = minim.getLineOut();
  	wave = new Oscil( 440, 0.5f, Waves.SINE );
  	wave.patch( out );
}


/* | LOOP
---|----------------------------------------------------*/

void draw() {
	background(0); 

	if (blueThing == true) {
		background(135,206,250);
	} 

	if (redThing == true) {
		background(225,0,0);
		
	}
}


/* | OSC SEND
---|----------------------------------------------------*/

void sendAMessage(String n) {

	println("!sendAMessage n: " + n );

	OscMessage myOscMessage = new OscMessage("/processing");

	if (n != null) {
		if (n.equals(beanNames[0]) == true) {

			//myOscMessage.add(n); // add the baseLinel name
			//myOscMessage.add(1); // send back a command for the bean
		}

		if (n.equals(beanNames[1]) == true) {

			//myOscMessage.add(n); // and the ball name
			//myOscMessage.add(2); // send back a command for the bean

		}

	}

	oscP5.send(myOscMessage, myRemoteLocation);
}


/* | SOUND MAPPING
---|----------------------------------------------------*/



void makeNoise(float bValue, String nValue) {
	
	


	if ((bValue != 0.0) && (nValue != null)) {

		if (nValue.equals(beanNames[0]) == true) {
			println(nValue + " " + bValue);
			wave.setWaveform(Waves.SAW);
			wave.setFrequency( 200 );
			blueThing = true;
			redThing = false;
			
		}

		if (nValue.equals(beanNames[1])== true) {
			println(nValue + " " + bValue);
			wave.setWaveform(Waves.SQUARE);
			wave.setFrequency( 300 );
			redThing = true;
			blueThing = false;
			
		}
	
	} 	

}


/* | OSC RECEIVE
---|----------------------------------------------------*/

void oscEvent(OscMessage theOscMessage) {
	theOscMessage.print();

	if (theOscMessage.checkAddrPattern("/data") == true) {
		
		// check of the typetag is right
		if (theOscMessage.checkTypetag("sff")) {
			// parse the message and extract the values
			String name = theOscMessage.get(0).stringValue();
			float data = theOscMessage.get(1).floatValue();
			float barom = theOscMessage.get(2).floatValue();

                beanBaromLast.set(name, barom);
                        
                // get a calibrated reading
                barom = barom - beanBaromBase.get(name);

			makeNoise(barom, name);
			sendAMessage(name);

                   

		}
	}
}

void calibrate() {
  beanBaromBase = beanBaromLast.copy();
}

// map the values coming in. This isn't quite right. Saving for later.

		//if (bV <= baseLine) {bV = baseLine; }
        //if (bV >= topLine) { bV = topLine; } 
		
		//float m = map (bV, baseLine, topLine, 1, 10);
        //int mappedValue = round(m);
        //println("mappedValue: "+ mappedValue);

        //float freq = map( mappedValue, 1, 10, 110, 880 );
        //float freq = map(bV, baseLine, topLine, 110, 200);
        //
        //println("freq: "+freq);

		//float topLine = 156.0;
		//float  baseLine = 160.0;

		
