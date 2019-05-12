b21_vario_te total energy vario

SUMMARY

The package includes a 57mm and 80mm total-energy compensated vario, both in pure XML.

The stock vario in the DG808S displays a FSX variable called "Variometer Rate"
which in the present release seems to display pure VERTICAL CLIMB rate.  This
would apply to glider variometers circa 1935, after which a pneumatic technique
was invented which compensated for the change in AIRSPEED of the glider. Kudos to
Aces for not using 'Vertical Speed', but the current code is the same anyway.

If you pull the stick back, the glider climbs and simultaneously decelerates,
so your kinetic energy decreases as your potential energy increases.  A COMPENSATED
vario applies a factor related to the change in airspeed to the apparent climb or
sink rate, so you get more of a pure reading.

With no compensation (i.e. the current stock DG808S vario) you frequently
experience what in real gliding are called 'stick thermals'.  I.e. you pull back in
what you suspect is a thermal, and the non-compensated vario duly shows a climb due to
your control input, so you're fooled into thinking a thermal is really there.  On
real gliders it's worse because the G-forces on pull up also feel a bit like flying
into rising air.

The 80mm vario has a secondary (small red needle) indication showing 'Variometer Rate'.
You can delete this out of the b21_vario_te.xml file if you care, but it's good for
showing you the difference.

INSTALLATION

1) From the zip, copy folder b21_vario_te into your FSX/Gauges folder

   That's the instrument successfully installed.  Now you have to configure an aircraft to
   use that instrument.

2) To modify the DG808S, from the zip, copy the DG808S/panel.cfg file into the
   FSX/SimObjects/airplanes/DG808S/panel folder. Backup the original if you're sensible.

Now if you fly the DG808S the TE vario should appear. FINISHED

===========================================================================================
IF YOU'RE A RIDGE DESIGNER - READ ON

To help ridge-lift analysis, two extra files are included in the zip DG808S folder,
variometer.xml
variometer_backround.bmp

These are modifications to the stock DG808 instruments, but the installation requires a
couple of steps:

1) in the FSX/SimObjects/aircraft/DG808S/Panel folder, unzip the DG808S.cab file into a folder
   of the same name, still within the Panel folder.

2) rename the DG808S.cab to something like DG808S.cab.original

3) copy the variometer.xml and variometer_background.bmp files from the zip into the new
   Panel/DG808S folder, replacing the existing copies.

Now if you fly you should see an altered background to the Cambridge vario (WIND Y) and the
vario will display vertical wind speed DIVIDED BY TWO.

ANY QUESTIONS - try forum Missions FOrum on fsxmissions.com

b21
8-Jan-2007