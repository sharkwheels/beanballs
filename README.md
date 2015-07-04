/* | BEAN BALLS
---|---------------------------------*/

repo for some noisy beanballs

This collection of files reads data from two scratch banks of a light blue bean, and uses noble, to pass that data to processing. 
Processing is currently just acting like a bit of a parrot, but it does change the background to some whacky colours!

Data: Numbers from the BMP 180 barometric pressure sensor and numbers from the on board accelerometer. 

/* | SETUP
---|---------------------------------*/

Follow the instructions on how to get the LightBlue Bean up and running: https://punchthrough.com/bean/getting-started-osx/

Download and install node: https://nodejs.org/download/

Download and install Processing: https://processing.org/download/

Download and install Adafruit's library for the BMP180: https://learn.adafruit.com/bmp085  (it says 085 but its drag and drop)


/* | RUNNING
---|---------------------------------*/

1) Upload bean_bmp180start_6.ino to the bean<br />
2) Launch Processing and build OSCTest2.pde (this will launch t)<br />
3) Run the node process out of a terminal window: node bean-osc-new3.js<br />

Stuff be chattin' !



/* | REFERENCES 
---|---------------------------------*/

Reference for writing this came from these sources:

https://labs.hybris.com/2014/10/06/connecting-to-multiple-ble-devices/
https://github.com/iColpitts/CostumesForCyborg_sound/blob/master/NodeShit/bean-to-osc.js


/* | CURRENT ISSUES
---|---------------------------------*/

Problems with write function, needs some callbacks, not sure how to do that yet!