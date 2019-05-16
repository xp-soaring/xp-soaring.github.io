  The SimConnect.xml and SimConnect.ini files located in this dir are examples of
data files that are used to configure the Flight Simulator SimConnect system. These two files are not
needed to use SimConnect under normal circumstances. By default, SimConnect client addons that
run on the same machine as Flight Simulator will work without either of these two files needing to be
present. 

  The SimConnect.xml file contains config parameters for the SimConnect communications layer.
This file is placed in the "C:\Documents and Settings\<username>\Application Data\Microsoft\FSX"
directory - the same directory where the FSX.cfg file is located. This file does not need to be
present if the SimConnect system is used in the default configuration that supports all SimConnect
clients that are running on the same machine that FSX is running on. Only if it is desired to have
SimConnect clients running on other machines than the one running FSX, is a SimConnect.xml file
needed.

  The SimConnect.ini file contains config parameters for the SimConnect diagnostic system. This file
is placed in the "My Documents\Flight Simulator X Files" directory. This file only needs to be present
if the user wants to examine the SimConnect diagnostic output data; it is not needed otherwise.

  The DLL.xml and EXE.xml files are examples of the configuration files that are used to
specify addon code that is launched or loaded by Flight Simulator when it starts. These files are
placed in the "C:\Documents and Settings\<username>\Application Data\Microsoft\FSX" directory - the
same directory where the FSX.cfg file is located. 

  The two script files, IPv6_Install.cmd and IPv6_Uninstall.cmd, can be used to install
and to remove support for the IPv6 protocol. IPv6 offers features that improve security and
simplify the use of SimConnect client applications that are used on machines other than that
machine which runs your copy of Flight Simulator X. Try IPv6 -- you'll like it!!
