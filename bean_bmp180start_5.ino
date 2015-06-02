#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP085_U.h>

#define accelerationThreshold 200   
AccelerationReading previousAccel;



Adafruit_BMP085_Unified bmp = Adafruit_BMP085_Unified(10085);


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

  delay(100);
}

void loop() {
  
  const char * beanName = Bean.getBeanName();

  String strCmd = getCommand();
  
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
 if(accelDifference > accelerationThreshold){
   // get the event pressure
     if (event.pressure){
       
        
        
        float seaLevelPressure = 1024;
        //float seaLevelPressure = SENSORS_PRESSURE_SEALEVELHPA;
        float altitude_m = (bmp.pressureToAltitude(seaLevelPressure,event.pressure));
       
        // set some scratch data
        Bean.setScratchNumber(1, altitude_m);

        // print out what the scratch bank is sending as a string 
       
    } else {
      Serial.println("Sensor error");
    } // end of else
  }

  if ( ((strCmd.length()) > 0) && (strCmd!= " ") ) {

    if ( strCmd == "BLUE" ) {
      Bean.setLed(0,0,225);
    } 

    if ( strCmd == "RED" ) {
      Bean.setLed(100,0,0);
    }
    
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

// scratch to string command (BDWalker)

String getCommand() {
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


}


