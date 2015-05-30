import oscP5.*;
import netP5.*;
import ddf.minim.*;
import ddf.minim.ugens.*;

OscP5 oscP5;
NetAddress myRemoteLocation;


Minim       minim;
AudioOutput out;
Oscil       wave;

float bankValue; 
String nameValue;

boolean blueThing = false;
boolean redThing = true;


void setup() {
	size(800,800);
	frameRate(25);
	background(0);

	oscP5 = new OscP5(this, 3000); // THIS is receving info from the bean.

	myRemoteLocation = new NetAddress("127.0.0.1", 4000); /// broadcast? This is a unicast. Hmm.
	println("Broadcasting on:" + myRemoteLocation);


	minim = new Minim(this);
  	out = minim.getLineOut();
  
  	wave = new Oscil( 440, 0.5f, Waves.SINE );
  	wave.patch( out );
}

void draw() {
	background(0); 

	if (blueThing == true) {
		background(135,206,250);
	} 

	if (redThing == true) {
		background(225,0,0);
		
	}
}

// just testing this to see if it talks back to JS

void mousePressed() {
  /* create a new OscMessage with an address pattern, in this case /test. */
  OscMessage myOscMessage = new OscMessage("/hello");
  /* add a value (an integer) to the OscMessage */
  myOscMessage.add(100);
  /* send the OscMessage to a remote location specified in myNetAddress */
  oscP5.send(myOscMessage, myRemoteLocation);
}


void makeNoise(float bValue, String nValue) {
	
	float bV = bValue;
	String nV = nValue; 

	String [] str1 = {"BeanBall1","BeanBall2"};

	// need to twiddle w/ frequency stuff in here as well. 


	// if neither item is empty

	if ((bV != 0.0) && (nV != null)) {

		if (nV.equals(str1[0]) == true) {
			println(nV + " " + bV);
			wave.setWaveform(Waves.SAW);
			wave.setFrequency( 200 );
			blueThing = true;
			redThing = false;
			
		}

		if (nV.equals(str1[1])== true) {
			println(nV + " " + bV);
			wave.setWaveform(Waves.SQUARE);
			wave.setFrequency( 300 );
			redThing = true;
			blueThing = false;
			
		}
	
	} 	

}

void oscEvent(OscMessage theOscMessage) {
	

	if (theOscMessage.checkAddrPattern("/data") == true) {
		
		// check of the typetag is right
		if (theOscMessage.checkTypetag("sff")) {
			// parse the message and extract the values
			String n = theOscMessage.get(0).stringValue();
			float d = theOscMessage.get(1).floatValue();
			float b = theOscMessage.get(2).floatValue();
			bankValue = b;
			nameValue = n;

			makeNoise(bankValue, nameValue);


		}
	}
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

		
