//------------------------------------------------------------------------------
//
//  SimConnect Joystick Control Sample
//  
//	Description:
//				Use the "z" key to step through the events sent by the Joystick
//				including X,Y,Z axes, Slider and Hat switch
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;
int     current = 0;


static enum GROUP_ID {
    GROUP_0
};

static enum INPUT_ID {
    INPUT_Z,
    INPUT_SLIDER,
    INPUT_XAXIS,
    INPUT_YAXIS,
    INPUT_RZAXIS,
    INPUT_HAT,
};

static enum EVENT_ID {
    EVENT_Z,
    EVENT_SLIDER,
    EVENT_XAXIS,
    EVENT_YAXIS,
    EVENT_RZAXIS,
    EVENT_HAT,
 };

void CALLBACK MyDispatchProcJ(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    HRESULT hr;

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_SLIDER:
                    printf("\nSlider value:%d", evt->dwData);
                    break;
                case EVENT_XAXIS:
                    printf("\nX Axis value:%d", evt->dwData);
                    break;
                case EVENT_YAXIS:
                    printf("\nY Axis value:%d", evt->dwData);
                    break;
                case EVENT_RZAXIS:
                    printf("\nRotate Z axis value:%d", evt->dwData);
                    break;
                case EVENT_HAT:
                    printf("\nHat value:%d", evt->dwData);
                    break;

                case EVENT_Z:
                    current++;
                    if (current == 6)
                        current = 1;
                    switch( current )
                    {
                    case 1:
                        printf("\nSLIDER is active");
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_SLIDER,  SIMCONNECT_STATE_ON);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_XAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_YAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_RZAXIS,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_HAT,     SIMCONNECT_STATE_OFF);
                        break;

                    case 2:
                        printf("\nX AXIS is active");
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_SLIDER,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_XAXIS,   SIMCONNECT_STATE_ON);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_YAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_RZAXIS,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_HAT,     SIMCONNECT_STATE_OFF);
                        break;

                    case 3:
                        printf("\nY AXIS is active");
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_SLIDER,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_XAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_YAXIS,   SIMCONNECT_STATE_ON);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_RZAXIS,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_HAT,     SIMCONNECT_STATE_OFF);
                        break;

                    case 4:
                        printf("\nZ ROTATION is active");
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_SLIDER,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_XAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_YAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_RZAXIS,  SIMCONNECT_STATE_ON);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_HAT,     SIMCONNECT_STATE_OFF);
                        break;

                    case 5:
                        printf("\nHAT is active");
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_SLIDER,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_XAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_YAXIS,   SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_RZAXIS,  SIMCONNECT_STATE_OFF);
                        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_HAT,     SIMCONNECT_STATE_ON);
                        break;
                    }
                    break;

                default:
                    break;
            }
            break;
        }


        case SIMCONNECT_RECV_ID_QUIT:
        {
            quit = 1;
            break;
        }

        default:
            break;
    }
}

void testInput()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Joystick Input", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
		// Set up some private events
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_Z); 
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_SLIDER);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_XAXIS);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_YAXIS);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_RZAXIS);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_HAT);

		// Add all the private events to a notifcation group
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_0, EVENT_Z);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_0, EVENT_SLIDER);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_0, EVENT_XAXIS);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_0, EVENT_YAXIS);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_0, EVENT_RZAXIS);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_0, EVENT_HAT);

		// Set a high priority for the group
        hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_0, SIMCONNECT_GROUP_PRIORITY_HIGHEST);

		// Map input events to the private client events
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_Z,        "z",                    EVENT_Z);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_SLIDER,   "joystick:0:slider",    EVENT_SLIDER);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_XAXIS,    "joystick:0:XAxis",     EVENT_XAXIS);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_YAXIS,    "joystick:0:YAxis",     EVENT_YAXIS);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_RZAXIS,   "joystick:0:RzAxis",    EVENT_RZAXIS);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_HAT,      "joystick:0:POV",       EVENT_HAT);

		// Turn on the Z key
        hr = SimConnect_SetInputGroupState(hSimConnect,      INPUT_Z, SIMCONNECT_STATE_ON);
        hr = SimConnect_SetInputGroupPriority(hSimConnect,   INPUT_Z, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
        
		// Turn all the joystick events off
        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_SLIDER,  SIMCONNECT_STATE_OFF);
        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_XAXIS,   SIMCONNECT_STATE_OFF);
        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_YAXIS,   SIMCONNECT_STATE_OFF);
        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_RZAXIS,  SIMCONNECT_STATE_OFF);
        hr = SimConnect_SetInputGroupState(hSimConnect,INPUT_HAT,     SIMCONNECT_STATE_OFF);
 
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcJ, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testInput();
	return 0;
}



