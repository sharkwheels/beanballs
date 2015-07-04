import oscP5.*;
import netP5.*;
import ddf.minim.*;
import ddf.minim.ugens.*;

OscP5 oscP5;
NetAddress myRemoteLocation;


Minim       minim;
AudioOutput out;
Oscil       wave;



boolean blueThing = false;
boolean redThing = true;

String [] beanNames = {"BeanBall1","BeanBall2"};


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
  	//wave.patch( out );
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

void sendAMessage(String n) {

	// i will need more logic in here. Right now it trips off immediately. But it works. 

	println("!sendAMessage n: " + n );

	OscMessage myOscMessage = new OscMessage("/processing");

	if (n != null) {
		if (n.equals(beanNames[0]) == true) {

			myOscMessage.add(n); // add the baseLinel name
			myOscMessage.add(2); // send back a command for the bean
		}

		if (n.equals(beanNames[1]) == true) {

			myOscMessage.add(n); // and the ball name
			myOscMessage.add(1); // send back a command for the bean

		}

	}

	oscP5.send(myOscMessage, myRemoteLocation);
}



void makeNoise(float bValue, String nValue) {
	
	float bV = bValue;
	String nV = nValue; 


	// need to twiddle w/ frequency stuff in here as well. 
	
	// if neither item is empty

	if ((bV != 0.0) && (nV != null)) {

		if (nV.equals(beanNames[0]) == true) {
			println(nV + " " + bV);
			wave.setWaveform(Waves.SAW);
			wave.setFrequency( 200 );
			blueThing = true;
			redThing = false;
			
		}

		if (nV.equals(beanNames[1])== true) {
			println(nV + " " + bV);
			wave.setWaveform(Waves.SQUARE);
			wave.setFrequency( 300 );
			redThing = true;
			blueThing = false;
			
		}
	
	} 	

}

void oscEvent(OscMessage theOscMessage) {
	theOscMessage.print();

	if (theOscMessage.checkAddrPattern("/data") == true) {
		
		// check of the typetag is right
		if (theOscMessage.checkTypetag("sff")) {
			// parse the message and extract the values
			String n = theOscMessage.get(0).stringValue();
			float d = theOscMessage.get(1).floatValue();
			float b = theOscMessage.get(2).floatValue();

			makeNoise(b, n);
			sendAMessage(n);
			

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

		
