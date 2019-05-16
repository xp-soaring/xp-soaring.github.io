//------------------------------------------------------------------------------
//
//  SimConnect Send Event A Sample
//
//	Description:
//				Whenever the brakes are hit, sends two custom client events to
//				all other clients, one of the events is maskable.
//				Send Event B and C should receive these events.
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum GROUP_ID {
    GROUP_A,
};

static enum EVENT_ID {
    EVENT_BRAKES,
    EVENT_MY_EVENT,
	EVENT_MASKABLE,
 };

void CALLBACK MyDispatchProcA(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_BRAKES:
                    printf("\nEvent brakes: %d", evt->dwData);

					// Send the two events to all other client groups - this is achieved by setting the priority of the
					// message to SIMCONNECT_GROUP_PRIORITY_HIGHEST. This is the priority of the first client group that
					// will be sent the message.

                    SimConnect_TransmitClientEvent(hSimConnect, 0, EVENT_MY_EVENT, 0, SIMCONNECT_GROUP_PRIORITY_HIGHEST, SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);
                    SimConnect_TransmitClientEvent(hSimConnect, 0, EVENT_MASKABLE, 0, SIMCONNECT_GROUP_PRIORITY_HIGHEST, SIMCONNECT_EVENT_FLAG_GROUPID_IS_PRIORITY);
					
					break;

                case EVENT_MY_EVENT:
                    printf("\nSend Event A received My.event");
                    break;

                case EVENT_MASKABLE:
                    printf("\nSend Event A received My.maskable.event");
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

void testSendEvent()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Send Event A", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_BRAKES, "brakes");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_A, EVENT_BRAKES);

		// Define two custom events, both of which this client will not mask

        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MY_EVENT, "My.event");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_A, EVENT_MY_EVENT, false);

        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MASKABLE, "My.maskable.event");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_A, EVENT_MASKABLE, false);

        hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_A, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcA, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
	testSendEvent();
	return 0;
}
