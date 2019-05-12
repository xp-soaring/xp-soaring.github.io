//------------------------------------------------------------------------------
//
//  SimConnect	Throttle Control sample
// 
//	Description:
//				Press A to increase the throttle
//				Press Z to decrease the throttle
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum GROUP_ID{
    GROUP_KEYS,
};
static enum INPUT_ID {
    INPUT_KEYS,
};

static enum EVENT_ID {
    EVENT_SIM_START,
    EVENT_A,
	EVENT_Z
};

static enum DATA_DEFINE_ID {
    DEFINITION_THROTTLE,
};

static enum DATA_REQUEST_ID {
    REQUEST_THROTTLE,
};

struct structThrottleControl 
{
	double throttlePercent;
};

structThrottleControl		tc;

void CALLBACK MyDispatchProcTC(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    HRESULT hr;
    
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE*)pData;
            
            switch(pObjData->dwRequestID)
            {
                case REQUEST_THROTTLE:
                {
					// Read and set the initial throttle control value
					structThrottleControl *pS = (structThrottleControl*)&pObjData->dwData;

					tc.throttlePercent	= pS->throttlePercent;
					
					printf("\nREQUEST_USERID received, throttle = %2.1f", pS->throttlePercent);

					// Now turn the input events on
					hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_KEYS, SIMCONNECT_STATE_ON);
                }

                default:
                   break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {

		        case EVENT_SIM_START:
                    {
			            // Send this request to get the user aircraft id
		                hr = SimConnect_RequestDataOnSimObject(hSimConnect, REQUEST_THROTTLE, DEFINITION_THROTTLE, SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_ONCE);
                    }
			        break;
						
			    case EVENT_A:
                    {
					    // Increase the throttle
					    if (tc.throttlePercent <= 95.0f)
						    tc.throttlePercent	+= 5.0f;

					    hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_THROTTLE, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tc), &tc);
                    }
                    break;

                case EVENT_Z:
                    {
					    // Decrease the throttle
					    if (tc.throttlePercent >= 5.0f)
						    tc.throttlePercent	-= 5.0f;

					    hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_THROTTLE, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(tc), &tc);
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

void testThrottleControl()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Throttle Control", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
           
        // Set up a data definition for the throttle control
        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_THROTTLE,
			"GENERAL ENG THROTTLE LEVER POSITION:1", "percent");

        // Request a simulation started event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

        // Create two private key events to control the throttle
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_A);
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_Z);

        // Link the events to some keyboard keys
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_KEYS, "A", EVENT_A);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_KEYS, "Z", EVENT_Z);

		// Ensure the input events are off until the sim is up and running
        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_KEYS, SIMCONNECT_STATE_OFF);

        // Sign up for notifications
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_KEYS, EVENT_A);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_KEYS, EVENT_Z);
    
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcTC, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testThrottleControl();

	return 0;
}
