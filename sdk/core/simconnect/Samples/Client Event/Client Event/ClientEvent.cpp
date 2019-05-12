//------------------------------------------------------------------------------
//
//  SimConnect Samples
//  
//	Description:
//				Respond to the user aircraft brakes
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum GROUP_ID {
    GROUP0,
};

static enum EVENT_ID {
    EVENT_BRAKES,
 };

void CALLBACK MyDispatchProc1(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
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

void testClientEvents()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Client Event", NULL, 0, NULL, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_BRAKES, "brakes");

        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP0, EVENT_BRAKES);

        hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP0, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProc1, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}


int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testClientEvents();

	return 0;
}





