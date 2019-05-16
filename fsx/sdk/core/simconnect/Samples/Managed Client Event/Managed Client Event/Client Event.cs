//
//
// Managed Client Event sample
//
// Respond to Flaps up and down (F5, F6, F7 and F8 keys)
// Respond to Pitot switch (Shift-H)
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

namespace Managed_Client_Event
{
    public partial class Form1 : Form
    {

        // User-defined win32 event
        const int WM_USER_SIMCONNECT = 0x0402;

        // SimConnect object
        SimConnect simconnect = null;

        enum EVENTS
        {
            PITOT_TOGGLE,
            FLAPS_INC,
            FLAPS_DEC,
            FLAPS_UP,
            FLAPS_DOWN,
        };

        enum NOTIFICATION_GROUPS
        {
            GROUP0,
        }

        public Form1()
        {
            InitializeComponent();

            setButtons(true, false);
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

        private void setButtons(bool bConnect, bool bDisconnect)
        {
            buttonConnect.Enabled = bConnect;
            buttonDisconnect.Enabled = bDisconnect;
        }

        private void closeConnection()
        {
            if (simconnect != null)
            {
                // Dispose serves the same purpose as SimConnect_Close()
                simconnect.Dispose();
                simconnect = null;
                displayText("Connection closed");
            }
        }

        // Set up all the SimConnect related event handlers
        private void initClientEvent()
        {
            try
            {
                // listen to connect and quit msgs
                simconnect.OnRecvOpen += new SimConnect.RecvOpenEventHandler(simconnect_OnRecvOpen);
                simconnect.OnRecvQuit += new SimConnect.RecvQuitEventHandler(simconnect_OnRecvQuit);

                // listen to exceptions
                simconnect.OnRecvException += new SimConnect.RecvExceptionEventHandler(simconnect_OnRecvException);

                // listen to events
                simconnect.OnRecvEvent += new SimConnect.RecvEventEventHandler(simconnect_OnRecvEvent);

                // subscribe to pitot heat switch toggle
                simconnect.MapClientEventToSimEvent(EVENTS.PITOT_TOGGLE, "PITOT_HEAT_TOGGLE");
                simconnect.AddClientEventToNotificationGroup(NOTIFICATION_GROUPS.GROUP0, EVENTS.PITOT_TOGGLE, false);

                // subscribe to all four flaps controls
                simconnect.MapClientEventToSimEvent(EVENTS.FLAPS_UP, "FLAPS_UP");
                simconnect.AddClientEventToNotificationGroup(NOTIFICATION_GROUPS.GROUP0, EVENTS.FLAPS_UP, false);
                simconnect.MapClientEventToSimEvent(EVENTS.FLAPS_DOWN, "FLAPS_DOWN");
                simconnect.AddClientEventToNotificationGroup(NOTIFICATION_GROUPS.GROUP0, EVENTS.FLAPS_DOWN, false);
                simconnect.MapClientEventToSimEvent(EVENTS.FLAPS_INC, "FLAPS_INCR");
                simconnect.AddClientEventToNotificationGroup(NOTIFICATION_GROUPS.GROUP0, EVENTS.FLAPS_INC, false);
                simconnect.MapClientEventToSimEvent(EVENTS.FLAPS_DEC, "FLAPS_DECR");
                simconnect.AddClientEventToNotificationGroup(NOTIFICATION_GROUPS.GROUP0, EVENTS.FLAPS_DEC, false);

                // set the group priority
                simconnect.SetNotificationGroupPriority(NOTIFICATION_GROUPS.GROUP0, SimConnect.SIMCONNECT_GROUP_PRIORITY_HIGHEST);

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

        void simconnect_OnRecvException(SimConnect sender, SIMCONNECT_RECV_EXCEPTION data)
        {
            displayText("Exception received: " + data.dwException);
        }

        void simconnect_OnRecvEvent(SimConnect sender, SIMCONNECT_RECV_EVENT recEvent)
        {
            switch (recEvent.uEventID)
            {
                case (uint)EVENTS.PITOT_TOGGLE:

                    displayText("PITOT switched");
                    break;

                case (uint)EVENTS.FLAPS_UP:

                    displayText("Flaps Up");
                    break;

                case (uint)EVENTS.FLAPS_DOWN:

                    displayText("Flaps Down");
                    break;

                case (uint)EVENTS.FLAPS_INC:

                    displayText("Flaps Inc");
                    break;

                case (uint)EVENTS.FLAPS_DEC:

                    displayText("Flaps Dec");
                    break;
            }
        }

        // The case where the user closes the client
        private void Form1_FormClosed(object sender, FormClosedEventArgs e)
        {
            closeConnection();
        }

        private void buttonConnect_Click(object sender, EventArgs e)
        {
            if (simconnect == null)
            {
                try
                {
                    // the constructor is similar to SimConnect_Open in the native API
                    simconnect = new SimConnect("Managed Client Events", this.Handle, WM_USER_SIMCONNECT, null, 0);

                    setButtons(false, true);

                    initClientEvent();

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

                setButtons(true, false);
            }
        }

        private void buttonDisconnect_Click(object sender, EventArgs e)
        {
            closeConnection();
            setButtons(true, false);
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
            output += "\n" + response++ + ": " + s;

            // display it
            richResponse.Text = output;
        }
    }
}
// End of sample