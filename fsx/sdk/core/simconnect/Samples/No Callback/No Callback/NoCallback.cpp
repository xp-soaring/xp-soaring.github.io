//------------------------------------------------------------------------------
//
//  SimConnect No Callback Sample
//  
//	Description:
//				Responds to the user aircraft brakes, without a callback function
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum GROUP_ID10 {
    GROUP_10,
};

static enum EVENT_ID10 {
    EVENT_BRAKES_10,
};

void testNoCallback()
{
    SIMCONNECT_RECV* pData;
    DWORD cbData;
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "No Callback", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_BRAKES_10, "brakes");
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_10, EVENT_BRAKES_10);
        
        hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_10, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
  
        while( 0 == quit )
        {
            hr = SimConnect_GetNextDispatch(hSimConnect, &pData, &cbData);

            if (SUCCEEDED(hr))
            {
                switch(pData->dwID)
                { 
                    case SIMCONNECT_RECV_ID_EVENT:
                        {
                            // enter code to handle events received in a SIMCONNECT_RECV_EVENT structure.
                            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*) pData;
                               
                            switch(evt->uEventID)
                            {
                                case EVENT_BRAKES_10:
                                    printf("\nEvent brakes: %d", evt->dwData);
                                    break;

                                default:
                                    break;
                            }
                        }
                        break;

                    case SIMCONNECT_RECV_ID_QUIT:
                        // enter code to handle exiting the application
                        quit = 1;
                        break;

                    default:
                        break;
                }
            }
        }

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
	testNoCallback();
	return 0;
}





