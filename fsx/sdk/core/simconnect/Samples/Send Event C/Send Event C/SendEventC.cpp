//------------------------------------------------------------------------------
//
//  SimConnect Send Event C Sample
//  
//	Description:
//				Responds when a custom events are sent from the Send Event A sample
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit			= 0;
HANDLE  hSimConnect		= NULL;

static enum GROUP_ID {
    GROUP_C,
};

static enum EVENT_ID {
    EVENT_MY_EVENTC,
	EVENT_MASKABLEC,
 };

void CALLBACK MyDispatchProcC(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {

                case EVENT_MY_EVENTC:
                    printf("\nSend Event C received My.event");
                    break;

                case EVENT_MASKABLEC:
                    printf("\nSend Event C received My.maskable.event");
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

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Send Event C", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
		// Set up to receive the "My.event" notification, without masking it
        
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MY_EVENTC, "My.event");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_C, EVENT_MY_EVENTC, false);

		// Set up to receive the "My.maskable.event" notification, and mask it from lower
		// priority client groups

        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MASKABLEC, "My.maskable.event");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_C, EVENT_MASKABLEC, true);    
        
		// The group priority is set low
		hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_C, SIMCONNECT_GROUP_PRIORITY_DEFAULT);
  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcC, NULL);
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





