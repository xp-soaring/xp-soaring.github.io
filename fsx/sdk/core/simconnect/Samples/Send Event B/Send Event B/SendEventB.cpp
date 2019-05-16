//------------------------------------------------------------------------------
//
//  SimConnect Send Event B Sample
//  
//	Description:
//				Responds when custom events are sent from the Send Event A sample
//				Masks one of the events from Send Event C
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit			= 0;
HANDLE  hSimConnect		= NULL;

static enum GROUP_ID{
    GROUP_B,
};

static enum EVENT_ID {
    EVENT_MY_EVENTB,
	EVENT_MASKABLEB,
 };

void CALLBACK MyDispatchProcB(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {

                case EVENT_MY_EVENTB:
                    printf("\nSend Event B received My.event");
                    break;

                case EVENT_MASKABLEB:
                    printf("\nSend Event B received My.maskable.event");
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

void testEventReceive()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Send Event B", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
		// Set up to receive the "My.event" notification, without masking it
        
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MY_EVENTB, "My.event");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_B, EVENT_MY_EVENTB, false);

		// Set up to receive the "My.maskable.event" notification, and mask it from lower
		// priority client groups

        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MASKABLEB, "My.maskable.event");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_B, EVENT_MASKABLEB, true);    
        
		// Set the priority of the group to enable the masking of events
		hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_B, SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);
  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcB, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
	testEventReceive();
	return 0;
}





