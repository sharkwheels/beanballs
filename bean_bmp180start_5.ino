#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP085_U.h>
#include <Adafruit_NeoPixel.h>
#define PIN 2 // neopxiles pin
   
Adafruit_BMP085_Unified bmp = Adafruit_BMP085_Unified(10085);
Adafruit_NeoPixel strip = Adafruit_NeoPixel(1, PIN, NEO_GRB + NEO_KHZ800);

uint32_t magenta = strip.Color(255, 0, 255);
uint32_t blue = strip.Color(0, 0, 255);
uint32_t red = strip.Color(255, 0, 0);
uint32_t none = strip.Color(0, 0, 0);

#define accelerationThreshold 200   
AccelerationReading previousAccel;

int beanID = 002;



void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial.setTimeout(25);
  Serial.println("Pressure Sensor Test"); Serial.println("");
  
  if (!bmp.begin()) {
      /* There was a problem fonding the BMP180....check your connections*/
      Serial.print("Ooops, no BMP180 detected ... Check your wiring or I2C ADDR!");
      while(1);
  }
  
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
  
  previousAccel = Bean.getAcceleration();
 
  sensors_event_t event;
  bmp.getEvent(&event); 
  if (event.pressure){
    Serial.println("setting pressure");
  }
  
  delay(100);
}

void loop() {
  
  const char * beanName = Bean.getBeanName();
  
  // put your main code here, to run repeatedly:
  /* Get a new sensor event */ 
  sensors_event_t event;
  bmp.getEvent(&event);
  
  AccelerationReading currentAccel = Bean.getAcceleration();
  int accelDifference = getAccelDifference(previousAccel, currentAccel); 
  previousAccel = currentAccel;
 
 if(accelDifference > accelerationThreshold){
   // get the event pressure
     if (event.pressure){
       
       // only if the ball is really moving
    
        
        float temperature;
        bmp.getTemperature(&temperature);
        
        float seaLevelPressure = 1024;
        //float seaLevelPressure = SENSORS_PRESSURE_SEALEVELHPA;
        float altitude_m = (bmp.pressureToAltitude(seaLevelPressure,event.pressure));
        // print just to be sure
        
        //Serial.println(altitude_m);
        // set some scratch data
        Bean.setScratchNumber(1, altitude_m);
        //Bean.setScratchNumber(2,beanID);
        
        
       
    } else {
      Serial.println("Sensor error");
    } // end of else
   
 
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

/*
//// neopixels control ..
  
  if (Serial.available()) {
    val = Serial.read();
    
    if (val == '1'){
      Bean.setLed(255, 0, 0);
      strip.setPixelColor(0, red); //red
      strip.show();
      
    }
    
    if (val == '2') {
      Bean.setLed(0, 255, 0);
      strip.setPixelColor(0, magenta); //magenta
      strip.show();
    }
    
    if (val == '3') {
      Bean.setLed(0, 0, 255);
      strip.setPixelColor(0, blue); // blue
      strip.show();
    } 
    
    if (val == '4') {
      Bean.setLed(0, 0, 0);
      strip.setPixelColor(0, none); // blue
      strip.show();
    }
    
  }*/

