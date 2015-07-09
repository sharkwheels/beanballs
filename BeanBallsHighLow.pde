/* | LIBARIES
---|----------------------------------------------------*/

import oscP5.*;
import netP5.*;

import ddf.minim.* ;
import ddf.minim.ugens.*;
import ddf.minim.signals.* ;
import ddf.minim.effects.* ;

import java.util.Map;

/* | OSC variables
---|----------------------------------------------------*/

OscP5 oscP5;
NetAddress myRemoteLocation;

/* | MINIM SETUP
---|----------------------------------------------------*/

// minims
Minim minim;
AudioOutput out;

// WAVES
SquareWave sqw;
TriangleWave triW;

// filters

LowPassSP lpass;

// notes
float [] notes;
int counter;

/* | CALIBRATION VARIABLES
---|----------------------------------------------------*/

FloatDict beanBaromLast = new FloatDict();
FloatDict beanBaromBase = new FloatDict();


/* | BACKGROUND COLOUR
---|----------------------------------------------------*/

boolean blueThing = false;
boolean redThing = true;

/* | BEAN GLOBALS
---|----------------------------------------------------*/

String [] beanNames = {"BeanBall1","BeanBall2"};

float ballAlt;
float ballAccel;
String ballName;

//FloatDict beanAccel = new FloatDict();
//FloatDict beanAlt = new FloatDict();

//http://forum.processing.org/one/topic/hashmap-integer-int-test-new-hashmap-integer-int-how-can-i-define-the-int-array.html

HashMap<String, float[]> hm = new HashMap<String, float[]>();

/* | SETUP
---|----------------------------------------------------*/


void setup() {

	// FILE

	size(800,800);
	frameRate(25);
	background(0);

	// OSC

	oscP5 = new OscP5(this, 3000); 
	myRemoteLocation = new NetAddress("127.0.0.1", 4000); 
	println("Broadcasting on:" + myRemoteLocation);

	//MINIM

	minim = new Minim(this) ;
 	out = minim.getLineOut(Minim.MONO);

 	// create a SquareWave with a frequency of 440 Hz,
	// an amplitude of 1 and the same sample rate as out

	sqw = new SquareWave(440, 1, out.sampleRate());
	triW = new TriangleWave(200, 1, out.sampleRate());

	// create a LowPassSP filter with a cutoff frequency of 200 Hz
	// that expects audio with the same sample rate as out

	lpass = new LowPassSP(200, out.sampleRate());

	out.addSignal(sqw);
	out.addSignal(triW);
	out.addEffect(lpass);

	sqw.setFreq(0);
  	triW.setFreq(0);


	notes = new float[8] ; // create the array to hold the note frequencies
 	notes[0] = 261.63 ;
 	notes[1] = 293.67 ;
 	notes[2] = 329.63 ;
 	notes[3] = 349.23 ;
 	notes[4] = 391.99 ;
 	notes[5] = 440 ;
 	notes[6] = 493.88 ;
 	notes[7] = 523.25 ;
 	counter = 0;

 	
 	frameRate(25) ; // slow it down so each pitch is held for 1 second

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



/* | BALL BEHAVIOUR
---|----------------------------------------------------*/

void ballSetup(String ballName, float ballScratch, float ballData) {	

	if (ballName != null) {

		if (ballScratch == 1.0) {
		ballAlt = ballData;
		//println("ballScratch: " + ballScratch);
		}

	if (ballScratch == 2.0) {
		ballAccel = ballData;
		//println("ballScratch: " + ballScratch);
		}
		println("ballName" + ballName);
		println("ballAlt: "+ ballAlt);
		println("ballAccel: "+ ballAccel);


		//gives us two dictionaries w/ "BeanBall1": Accel and "BeanBall1": Altitude
		//beanAccel.set(ballName, ballAccel);
		//beanAlt.set(ballName, ballAlt);

		// Hashmap of two beans

		hm.put(ballName, new float[]{ballAlt, ballAccel});
		//println(hm.get(ballName)[1]);

		
	}


}

void highBall() {

	//println(hm.get("BeanBall2")[0]);
	// HighBall behaviour
	/*
		The High Ball Must be Kept Aloft at all times.
		If the High Ball goes under the cut off altitude (ie: if it is on the ground)
			- you loose all your points
			- your balls switch behviour (low becomes high, high becomes low);
	*/


}

void lowBall(/*string bN, float bAlt, int bAccel*/) {

	// LowBall Behaviour
	/*
		The LowBall must be kept in motion at all times
		The lowBall doesn't have the ability to switch

		If the lowball remains motionless for X number of seconds
			GAME OVER	
	*/

}




/* | OSC SEND
---|----------------------------------------------------*/

void sendAMessage(String n) {

	println("!sendAMessage n: " + n );

	OscMessage myOscMessage = new OscMessage("/processing");

	if (n != null) {
		if (n.equals(beanNames[0]) == true) {

			myOscMessage.add(n); // add the baseLinel name
			myOscMessage.add(1); // send back a command for the bean
		}

		if (n.equals(beanNames[1]) == true) {

			myOscMessage.add(n); // and the ball name
			myOscMessage.add(2); // send back a command for the bean

		}

	}

	oscP5.send(myOscMessage, myRemoteLocation);
}




/* | OSC RECEIVE
---|----------------------------------------------------*/

void oscEvent(OscMessage theOscMessage) {
	//theOscMessage.print();

	if (theOscMessage.checkAddrPattern("/data") == true) {
		
		// check of the typetag is right
		if (theOscMessage.checkTypetag("sff")) {
			// parse the message and extract the values
			String name = theOscMessage.get(0).stringValue();
			float scratchbank = theOscMessage.get(1).floatValue();
			float data = theOscMessage.get(2).floatValue();

                //beanBaromLast.set(name, data);
                //println("beanBaromLast: "+beanBaromLast);
                        
                // get a calibrated reading
                //barom = barom - beanBaromBase.get(name);

                ballSetup(name, scratchbank, data);
             
			//makeNoise(barom, name);
			//sendAMessage(name);

                   

		}
	}
}

/*void calibrate() {
  beanBaromBase = beanBaromLast.copy();
}*/

void keyPressed() {
	beanBaromBase = beanBaromLast.copy();
}


/*

// set a boolean for highball and lowball
	// initially assign one ball to high and one to low
	// set the soundwave of high ball and lowball
	// set the colour of highball and lowball

	// set the baseline altitude (on the ground, for both)
	// set the cutoff altitude (baseline + 4, for both)

*/



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

		
/*

void makeNoise(float bValue, String nValue) {
	
	// check to make sure the name and bank values are not empty
	// assign or map a sound for each bean. 
		// the both have to be going at the same time. 
		// hmm. 

		if ((bValue != 0.0) && (nValue != null)) {
			if (nValue.equals(beanNames[0])) {
				// beanball1
				println(nValue + " " + bValue);
				sqw.setFreq(notes[0]);

			}

		if ((bValue != 0.0) && (nValue != null)) {
			if (nValue.equals(beanNames[1])) {
				// beanball2
				println(nValue + " " + bValue);
				triW.setFreq(notes[0]);

			}
		}
	}
	
}*/


//println("beanBaromLast: "+beanBaromLast);
	//println("beanBaromBase: "+beanBaromBase);

	// get redings from each bean
	// one ball = high
	// one ball = low

	// 5 people
	// goal: keep the high ball high and the low ball low, keep both balls in constant motion
	// if the high ball hits the ground, the balls will switch their behaviour and you will loose your points
	// if the low ball stops moving, then you will loose your points.

	//println(hm.get(beanNames[0]));
	//println(hm.get(beanNames[0])[0]);

	//println(hm.get("beanBall2")[0]);