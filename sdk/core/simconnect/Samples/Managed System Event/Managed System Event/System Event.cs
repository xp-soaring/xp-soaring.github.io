//
//
// Managed System Event sample
//
// Click on the buttons to receive 4 second and Sim start and stop notifications
//

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;

// Add these two statements to all SimConnect clients
using Microsoft.FlightSimulator.SimConnect;
using System.Runtime.InteropServices;

namespace Managed_System_Event
{
    public partial class Form1 : Form
    {

        // User-defined win32 event
        const int WM_USER_SIMCONNECT = 0x0402;

        // SimConnect object
        SimConnect simconnect = null;

        // System state switches
        int FS_System_4    = 0;
        int FS_System_Sim  = 0;

        enum REQUESTS
        {
            REQUEST_4S,
            REQUEST_SIMSTATE,
        };

        enum EVENTS
        {
            SIMSTART,
            SIMSTOP,
            FOURSECS,
        };
       
        public Form1()
        {
            InitializeComponent();

            setButtons(true, false, false);
        }
        // Simconnect client will send a win32 message when there is 
        // a packet to process. ReceiveMessage must be called to
        // trigger the events. This model keeps simconnect processing on the main thread.

        protected override void DefWndProc(ref Message m)
        {
            if (m.Msg == WM_USER_SIMCONNECT)
            {
                if (simconnect != null)
                {
                    simconnect.ReceiveMessage();
                }
            }
            else
            {
                base.DefWndProc(ref m);
            }
        }

        private void setButtons(bool bConnect, bool bGet, bool bDisconnect)
        {
            buttonConnect.Enabled = bConnect;
            buttonRequest4.Enabled = bGet;
            buttonSimStart.Enabled = bGet;
            buttonDisconnect.Enabled = bDisconnect;
        }

        private void closeConnection()
        {
            if (simconnect != null)
            {
                // Unsubscribe from all the system events
                simconnect.UnsubscribeFromSystemEvent(EVENTS.FOURSECS);
                simconnect.UnsubscribeFromSystemEvent(EVENTS.SIMSTART);
                simconnect.UnsubscribeFromSystemEvent(EVENTS.SIMSTOP);

                // Dispose serves the same purpose as SimConnect_Close()
                simconnect.Dispose();
                simconnect = null;
                displayText("Connection closed");
            }
        }

        // Set up all the SimConnect related event handlers
        private void initSystemEvent()
        {
            try
            {
                // listen to connect and quit msgs
                simconnect.OnRecvOpen += new SimConnect.RecvOpenEventHandler(simconnect_OnRecvOpen);
                simconnect.OnRecvQuit += new SimConnect.RecvQuitEventHandler(simconnect_OnRecvQuit);

                // listen to exceptions
                simconnect.OnRecvException += new SimConnect.RecvExceptionEventHandler(simconnect_OnRecvException);
                
                // listen to events
                simconnect.OnRecvEvent +=new SimConnect.RecvEventEventHandler(simconnect_OnRecvEvent);
 
                // Subscribe to system events
                simconnect.SubscribeToSystemEvent(EVENTS.FOURSECS, "4sec");
                simconnect.SubscribeToSystemEvent(EVENTS.SIMSTART, "SimStart");
                simconnect.SubscribeToSystemEvent(EVENTS.SIMSTOP, "SimStop");

                // Initially turn the events off
                simconnect.SetSystemEventState(EVENTS.FOURSECS, SIMCONNECT_STATE.OFF);
                simconnect.SetSystemEventState(EVENTS.SIMSTART, SIMCONNECT_STATE.OFF);
                simconnect.SetSystemEventState(EVENTS.SIMSTOP, SIMCONNECT_STATE.OFF);

            }
            catch (COMException ex)
            {
                displayText(ex.Message);
            }
        }

        void simconnect_OnRecvOpen(SimConnect sender, SIMCONNECT_RECV_OPEN data)
        {
            displayText("Connected to FSX");
        }

        // The case where the user closes FSX
        void simconnect_OnRecvQuit(SimConnect sender, SIMCONNECT_RECV data)
        {
            displayText("FSX has exited");
            closeConnection();
        }

        // The case where the user closes the client
        private void Form1_FormClosed(object sender, FormClosedEventArgs e)
        {
            buttonDisconnect_Click(sender, null);
        }

        void simconnect_OnRecvException(SimConnect sender, SIMCONNECT_RECV_EXCEPTION data)
        {
            displayText("Exception received: " + data.dwException);
        }

        void simconnect_OnRecvEvent(SimConnect sender, SIMCONNECT_RECV_EVENT recEvent)
        {
            switch (recEvent.uEventID)
            {
                case (uint) EVENTS.SIMSTART:

                    displayText("Sim running");
                    break;

                case (uint) EVENTS.SIMSTOP:

                    displayText("Sim stopped");
                    break;

                case (uint) EVENTS.FOURSECS:

                    displayText("4s tick");
                    break;
            }
        }

         private void buttonConnect_Click(object sender, EventArgs e)
        {
            if (simconnect == null)
            {
                try
                {
                    // the constructor is similar to SimConnect_Open in the native API
                    simconnect = new SimConnect("Managed System Event", this.Handle, WM_USER_SIMCONNECT, null, 0);

                    setButtons(false, true, true);

                    initSystemEvent();

                }
                catch (COMException ex)
                {
                    displayText("Unable to connect to FSX " + ex.Message);
                }
            }
            else
            {
                displayText("Error - try again");
                closeConnection();

                setButtons(true, false, false);
            }
        }

        private void buttonDisconnect_Click(object sender, EventArgs e)
        {           
            // If they are on, turn off the system event subscriptions
            if (FS_System_4 == 1)
                buttonRequest4_Click(sender, null);
            if (FS_System_Sim == 1)
                buttonSimStart_Click(sender, null);

            closeConnection();
            setButtons(true, false, false);
        }

        private void buttonRequest4_Click(object sender, EventArgs e)
        {
            // Toggle switch
            FS_System_4 = 1 - FS_System_4;

            if (FS_System_4 == 1)
            {
                simconnect.SetSystemEventState(EVENTS.FOURSECS, SIMCONNECT_STATE.ON);

                buttonRequest4.Text = "Stop 4 sec event";
            } else
            {
                simconnect.SetSystemEventState(EVENTS.FOURSECS, SIMCONNECT_STATE.OFF);

                buttonRequest4.Text = "Request 4 sec event";
            }    
        }

        private void buttonSimStart_Click(object sender, EventArgs e)
        {
            // Toggle switch
            FS_System_Sim = 1 - FS_System_Sim;

            if (FS_System_Sim == 1)
            {
                simconnect.SetSystemEventState(EVENTS.SIMSTART, SIMCONNECT_STATE.ON);
                simconnect.SetSystemEventState(EVENTS.SIMSTOP, SIMCONNECT_STATE.ON);

                buttonSimStart.Text = "Stop sim events";
            }
            else
            {
                simconnect.SetSystemEventState(EVENTS.SIMSTART, SIMCONNECT_STATE.OFF);
                simconnect.SetSystemEventState(EVENTS.SIMSTOP, SIMCONNECT_STATE.OFF);

                buttonSimStart.Text = "Request sim events";
            }
        }

        // Response number
        int response = 1;

        // Output text - display a maximum of 10 lines
        string output = "\n\n\n\n\n\n\n\n\n\n";

        void displayText(string s)
        {
            // remove first string from output
            output = output.Substring(output.IndexOf("\n") + 1);

            // add the new string
            output += "\n" + response++ + ":" + s;

            // display it
            richResponse.Text = output;
        }
    }
}
// End of sample