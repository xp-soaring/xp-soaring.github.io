//------------------------------------------------------------------------------
//
//  SimConnect Set Data Sample
// 
//	Description:
//				When ctrl-shift-A is pressed, the user aircraft is moved
//				to a new location
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum GROUP_ID {
    GROUP_6,
};

static enum INPUT_ID {
    INPUT_6,
};

static enum EVENT_ID{
    EVENT_SIM_START,
    EVENT_6,
};

static enum DATA_DEFINE_ID {
    DEFINITION_6,
};

static enum DATA_REQUEST_ID {
    REQUEST_6,
};

void CALLBACK MyDispatchProcSD(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    HRESULT hr;
    
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
				case EVENT_SIM_START:
                    {
                        // Turn the ctrl-shift-u input event on now
                        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_6, SIMCONNECT_STATE_ON);
                    }
                    break;


                case EVENT_6:
					{
                        SIMCONNECT_DATA_INITPOSITION Init;
                        Init.Altitude   = 5000.0;
                        Init.Latitude   = 47.64210;
                        Init.Longitude  = -122.13010;
                        Init.Pitch      =  0.0;
                        Init.Bank       = -1.0;
                        Init.Heading    = 180.0;
                        Init.OnGround   = 0;
                        Init.Airspeed	= 60;
                        hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_6, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(Init), &Init );

                        printf("\nEVENT_6 received and data sent");
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
            printf("\nReceived:%d",pData->dwID);
            break;
    }
}

void testDataSet()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Set Data", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        // Set up a data definition for positioning data
        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_6, "Initial Position", NULL, SIMCONNECT_DATATYPE_INITPOSITION);

        // Request a simulation start event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

        // Create a custom event
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_6, "My.CTRLSHIFTA");

        // Link the custom event to some keyboard keys, and turn the input event off
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_6, "ctrl+shift+A", EVENT_6);
        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_6, SIMCONNECT_STATE_OFF);

        // Sign up for notifications for EVENT_6
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_6, EVENT_6);
        
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcSD, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{

    testDataSet();

	return 0;
}





