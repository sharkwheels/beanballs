#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP085_U.h>

#define accelerationThreshold 200   
AccelerationReading previousAccel;

Adafruit_BMP085_Unified bmp = Adafruit_BMP085_Unified(10085);

int number = 0;


void setup() {

  Bean.setLed( 0, 0, 0 );
  
  Serial.begin(9600);
  Serial.setTimeout(25);
  
  // make a clear buffer
  uint8_t buffer[1] = { ' ' };
  // Clear scratch 2 for returning data
  Bean.setScratchData( 2, buffer, 1 );
  
  if (!bmp.begin()) {
      /* There was a problem fonding the BMP180....check your connections*/
      Serial.print("Ooops, no BMP180 detected ... Check your wiring or I2C ADDR!");
      while(1);
  }
  previousAccel = Bean.getAcceleration();
  Bean.sleep(20);
 
}

void loop() {


  
  // put your main code here, to run repeatedly:
  /* Get a new sensor event */ 
  sensors_event_t event;
  bmp.getEvent(&event);

  float temperature;
  bmp.getTemperature(&temperature);
  
  AccelerationReading currentAccel = Bean.getAcceleration();
  int accelDifference = getAccelDifference(previousAccel, currentAccel); 
  previousAccel = currentAccel;
 
 // only if the ball is moving
 
     if (event.pressure){
        
        float seaLevelPressure = 1018;
        //float seaLevelPressure = SENSORS_PRESSURE_SEALEVELHPA;
        float altitude_m = (bmp.pressureToAltitude(seaLevelPressure,event.pressure));
        
        Bean.setScratchNumber(1, (long) (altitude_m * 1000) );  // give us the altitude
        //Bean.setScratchNumber(2, accelDifference); // give us the accel Difference. 
       
    } else {
      Serial.println("Sensor error");
    } // end of else


  // read the incoming integer from scratch three
  number = Bean.readScratchNumber(3);

  if (number == 1) {
    Bean.setLed(125,0,0); // red
  } else if (number == 2) {
    Bean.setLed(0,225,0); // green
  } else {
    Bean.setLed(0,0,0); 
  }

   
  Bean.sleep(20);
}

// This function calculates the difference between two acceleration readings
int getAccelDifference(AccelerationReading readingOne, AccelerationReading readingTwo){
  int deltaX = abs(readingTwo.xAxis - readingOne.xAxis);
  int deltaY = abs(readingTwo.yAxis - readingOne.yAxis);
  int deltaZ = abs(readingTwo.zAxis - readingOne.zAxis);
  // Return the magnitude
  return deltaX + deltaY + deltaZ;   
}





  //String strCmd = getCommand();

/*if ( ((strCmd.length()) > 0) && (strCmd!= " ") ) {

    if ( strCmd == "BLUE" ) {
      Bean.setLed(0,0,225);
    } 

    if ( strCmd == "RED" ) {
      Bean.setLed(100,0,0);
    }
    
  }*/

// scratch to string command (BDWalker)

/*String getCommand() {
  // read from scratch bank 2
  
  ScratchData scratchCommand = Bean.readScratchData( 2 );

  // Convert command to a String object

  String strCmd = "";
  for (int i=0; i<scratchCommand.length; i++) {
    strCmd += (String) (char) scratchCommand.data[i];
  }
  strCmd.toUpperCase();
  // Clear the command so we don't process twice
  uint8_t buffer[1] = { ' ' };

  Bean.setScratchData( 2, buffer, 1 );

  return strCmd;


}*/


//number = Bean.readScratchNumber(1);
  
        //Serial.print("Number: ");
        //Serial.println(number);

        //Serial.println(altitude_m);
        //Serial.println(accelDifference);

        //int number = altitude_m * 100;
        //Serial.println(number);
        // Bean.setScratchNumber(1, number);

