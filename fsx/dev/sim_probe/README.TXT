
sim_probe is still in BETA.

The current version is 1.40. 

Sim_probe 'probes' the FSX terrain and reads the user altitude and prevailing wind,
and calculates an appropriate ridge lift or sink value.  Installed with
CumulusX! (available from http://www.luerkens.homepage.t-online.de/peter/),
sim_probe can inject that lift into the FSX world.

Follow installation instructions (A) if you want a 'production'
installation with CumulusX! generating lift inside FSX, OR instructions (B) if you
are investigating sim_probe for analysis or debug purposes.

(A) Installation with CumulusX!

  These instructions are for a 'production' install, even though you are using
  beta software, so you will see how sim_probe and CumulusX! operate in their
  expected normal usage.

  (1) download CumulusX! from http://www.luerkens.homepage.t-online.de/peter/

  (2) follow the installation instructions for CumulusX!

  (3) drag the folder "Modules\sim_probe\sim_probe.exe" into your base
      folder in your FSX installation, i.e. you should end up with
      "C:\Program Files\Microsoft Games\Microsoft Flight Simulator X\Modules\sim_probe\sim_probe.exe"

  (4) Edit the following file:

      "<Drive>:\Documents and Settings\<username>\Application Data\Microsoft\FSX\exe.xml"

      Note the "Application Data" folder can be 'hidden' by default in Windows and
      in Windows Explorer you might have to go into Tools->Folder Options for the
      "<Drive>:\Documents and Settings\<username>" folder and select "show hidden files and folders"
      Now follow EITHER instructions (4a) or (4b), depending on whether the exe.xml file exists

      (4a) IF THE EXE.XML FILE DOES NOT EXIST, firstly you might want to check your CumulusX!
      installation went as planned because that uses exe.xml to auto-launch itself. However, if
      you know what you're doing and don't have one, create a new one by right-clicking in the
      folder, select New-> "Text Document", 
      name it exe.txt, click on it to launch Notepad, and
      cut-and-paste the following into the file:

<?xml version="1.0" encoding="Windows-1252"?>

<SimBase.Document Type="Launch" version="1,0">
  <Descr>Launch</Descr>
  <Filename>exe.xml</Filename>
  <Disabled>False</Disabled>
  <Launch.ManualLoad>False</Launch.ManualLoad>
  <Launch.Addon>
    <Name>sim_probe</Name>
    <Disabled>False</Disabled>
    <ManualLoad>False</ManualLoad>
    <Path>Modules\sim_probe\sim_probe.exe</Path>
  </Launch.Addon>
</SimBase.Document>

      (4a continued) rename the file from "exe.txt" to "exe.xml"

      (OR 4b) IF THE EXE.XML FILE ALREADY EXISTS, open it with Notepad and
       insert these lines after any similar entry (so the <Launch.Addon> tag
       immediately follows some </Launch.Addon> tag for a prior addon:

  <Launch.Addon>
    <Name>sim_probe</Name>
    <Disabled>False</Disabled>
    <ManualLoad>False</ManualLoad>
    <Path>Modules\sim_probe\sim_probe.exe</Path>
  </Launch.Addon>

  (5) Start FSX - you should see an Add-ons->CUmulusX window, and also should see in the Cumulusx!
   window that it has connected to sim_probe.

(B) Simple installation instructions for sim_probe on its own (without CumulusX!):

  These instructions help you use sim_probe in a *test* situation so you can
  see how it is operating.  Sim_probe will *calculate* the lift but will *not*
  feed it into FSX (for that you need CumulusX!).

  (1) save the file "Modules\sim_probe\sim_probe.exe" somewhere you can find it.
      A sensible place might be a "Modules" folder in your FSX install, e.g. 
      "C:\Program Files\Microsoft Games\Microsoft Flight Simulator X\Modules"

  (2) open a command prompt window via 
         'start'->'all programs'->'accessories'->'Command Prompt'

  (3) you might find it convenient to change the width of the command prompt
      window by clicking on its top-left corner and selecting
         'properties'->'layout' and choosing a 'screen buffer size' of
         150 characters. This means the debug output of sim_probe will
         fit the page without breaking across lines.

  (4) start FSX, but if it auto-loads a flight 'Esc' back to the FSX start screen.

  (5) In the command prompt window, change directory to the one containing
      sim_probe, e.g.
        cd "C:\Program Files\Microsoft Games\Microsoft Flight Simulator X\Modules

  (6) At the command prompt, type "sim_probe debug"

  (7) If you now fly FSX in windowed mode, you should be able to watch the lift
      values (in meters per second) being displayed in the command prompt window.
      You will find it easier to test if you *uncheck* the option "pause on task switch"
      in the FSX settings.  Sim_probe will calculate lift values both when you are
      flying and when you slew around the landscape.

  (8) You can quit sim_probe at any time (hit "Control-C" in the Command Prompt
      window, or sim_probe will automatically exit when you quit FSX.

SOME MORE DEBUGGING INSTRUCTIONS

   sim_probe.exe can be started in any command window *after* FSX has started but *before* a
   flight has been loaded.

   The sim_probe.exe executable can be given additional parameters on the command line to
   increase the amount of run-time diagnostics it produces.  The options are:

   (1)    sim_probe debug
   (2)    sim_probe debug calls
   (3)    sim_probe debug calls events

   option (1) continously displays the lift being calculated and the internal slope factors used
   option (2) is as (1) but also displays the procedure calls as they happen
   option (3) is as (2) but also displays the messages coming back from FSX into sim_probe

For discussion or feedback see the CumulusX! sub-forum on www.virtualsoaring.org.

Ian Forster-Lewis, Jan 2008





