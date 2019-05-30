Henrc https://forums.x-plane.org/index.php?/forums/topic/173730-how-to-design-a-simple-generic-instrument/


About a fortnight ago I spent a week of my X-plane time on how to design generic instruments. I had made some older aircraft from the Swedish Royal Air Force, for example J29 “The Flying Barrel”. The Air Force used metric instruments in all their aircraft, until now the JAS 39 is using feet and knots. Therefore I wanted to have a speedometer in km/h and an altimeter in meters.

I did not find a complete description, but had to read on many places on the Forum and on the X-plane home page. The most important part was “Generic Instruments" written by propsman, but it was much older than ver 11, and some passages I did not understand. I missed also some kind of overview how to make it. But after a week of reading and experimenting suddenly it worked. So first I did build a speedometer in km/h and then an altimeter with two needles, a long for 100 m and a short for 1000 m. It included also a button and a small window for setting the barometric pressure.

So now I would like to make my contribution to this forum by writing a pretty detailed description how to make the speedometer. I am no expert, so I think  there are things that could be easier done.

An instrument is made up of a number of layers. In the bottom lies a basic layer, normally with the fixes scales and other markings, and it uses normally no dataref. Then comes more layers for needles, digital values, switches and buttons. The order is so, that parts which partially cover others will come higher up. That means lower down in the Hierarchy list on the right side of the 2D-design menu in PlaneMaker.

My simple speedometer has only two layers, one for the background, and one for the needle. You draw the picture of the background with a graphic program like PhotoShop. I did go to the Laminar F4 Phantom and made a screen cut of the speedometer. I took as big picture as possible so it will be easier to modify and sharper when reduced to fit on the panel. I did take away the needle and some of the digits, and added “km/h” and “IAS”. The last was deformed while making free the “0” at the top. You can see the result in figure 1. I do save this “basic picture” as “SP_HR_background.pdf”. SP for speedometer, HR for my name, background for background, and “.pdf” for PhotoShop data format.I can then see that this backgound is for the Speedometer and made by myself.

Now you have to shrink the picture to the size that fits on your instrument panel. And also make it in three copies from PhotoShop in the “*.png”-format. X-plane must have this format. One copy called “SP_HR_background.png”, one “SP_HR_background-1.png”, and one “SP_HR_background_LIT-1.png”. As I understand is the first copy the daylight view of the instrument. The copy “_LIT-1” is the night time view with internal scale light. I have made it a bit greenish as night light. I do not know what the copy “-1” is used for, but if you delete it strange distortions appear, not in PlaneMaker but in the simulator. I have made the -1 file a copy of the daylight file. These three files you have to put in a directory “...your airplane\cockpit\generic”.

Now you make a picture of the instrument needle in the same way. I made a square picture as big as the instrument final size (about 50x50 pixels), filled it with transparent color, and a white line 2 pixels wide and 22 pixels long. The line/needle goes from the middle of the square almost to the upper limit. This file I did save as “SP_HR_neeedle.pdf”. This time I do not have to resize it, that was already made. Then I save the three copies from PhotoShop as before and call them “SP_HR_needle.png”, “SP_HR_needle-1.png” and “SP_HR_needle.png_LIT-1”. The three pictures go also into the “generic” directory.

To show the needle pictures, the forum rules had me to convert them into JPG-files. Therefore the invisible color is here white, and the daylight needle I had to make black.

It is time now to start PlaneMaker. Choose your airplane and go to the 2D-panel. Compare with my PlaneMaker background picture. Up in the left corner change the Instrument List from All to Generic, it is a shorter list to work with. For the first, background layer you do:

Go to “gen_rotary.png”, mark it and drag it to the position on your instrument panel.
Go to the Properties below the Instrument List and change the name, in my case to SP_HR_gen_rotary.png. The last letter did not fit in, but it is only a nam, not a file name.
Click on the line for Image. You should get a drop down list with “SP_HR_background” and “SP_HR_needle”. Choose background.
Leave the Dataref empty, it is not used in this layer.
Choose “Back Lit” for Lighting
Mark power source, in my case Bus 1.
Some lines down there is Positions. Like propsman I set 1.
Finally I choose Rotary Type to “NoClick”

The background is finished. Perhaps you want to adjust the size and position, you may do it now.

For the needle layer you repeat amost the same steps. Compare with my PlaneMaker needle picture:

Go to “gen_needle.png”, mark it and drag it over the background.
Go to the Properties below the Instrument List and change the name, in my case to SP_HR_gen_needle.png. The last letter did not fit in, but it is only a nam, not a file name.
Click on the line for Image. You should get a drop down list with “SP_HR_background” and “SP_HR_needle”. Choose needle.
Here you must have the correct dataref. It is
sim/cockpit2/gauges/indicators/airspeed_kts_pilot
Choose “Back Lit” for Lighting
Mark power source, in my case Bus 1.
Go to the lower right side Key Frames to define the scaling :
        knots    Degrees    Curve
        0               0            1.00
        270         180    

For zero knots I want the needle to point at straight up, and that is 0 degrees. For 270 knots I want the needle to point at 5 for 500 km/h. That is straight down, 180 degrees.

That is all. Now you have to make a test flight. For checking I use the Data Output and display Speeds in the cockpit. 
 