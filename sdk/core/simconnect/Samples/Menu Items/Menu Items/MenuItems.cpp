//------------------------------------------------------------------------------
//
//  SimConnect Menu Items Sample
//  
//	Description:
//				Add one menu item, after it has been selected four times
//				replace it with another menu item
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum GROUP_ID {
	GROUP_MENU
};

static enum EVENT_ID {
	EVENT_MENU_ONE,
	EVENT_MENU_TWO,
 };

static int menuUseCount = 0;

void CALLBACK MyDispatchProcMI(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
	HRESULT hr;

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_MENU_ONE:
					printf("\nMenu item one selected %d", evt->dwData);

					++menuUseCount;

					// Selected four times, so replace item one with item two
					if (menuUseCount == 4)
					{		
						hr = SimConnect_MenuDeleteItem(hSimConnect, EVENT_MENU_ONE);
						hr = SimConnect_RemoveClientEvent(hSimConnect, GROUP_MENU, EVENT_MENU_ONE);

						hr = SimConnect_MenuAddItem(hSimConnect, "Menu Item Two", EVENT_MENU_TWO, 54321);
						hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_MENU, EVENT_MENU_TWO);
					}
                    break;

				case EVENT_MENU_TWO:
					
					++menuUseCount;

					printf("\nMenu item two selected %d", evt->dwData);
					
					if (menuUseCount == 6)
						quit = 1;
					break;

                default:
					printf("\nReceived unknown event: %d",evt->uEventID); 
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
			printf("Received ID: %d", pData->dwID);
            break;
    }
}

void testMenuItems()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Menu Items", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
		// Create some private events
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MENU_ONE);
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_MENU_TWO);

		// Add one menu item
		hr = SimConnect_MenuAddItem(hSimConnect, "Menu Item One", EVENT_MENU_ONE, 12345);

		
		// Sign up for the notifications
		hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_MENU, EVENT_MENU_ONE);

		hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_MENU, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
 	
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcMI, NULL);
            Sleep(1);
        } 

		// Clean up before exiting
		if (menuUseCount < 4)
			hr = SimConnect_MenuDeleteItem(hSimConnect, EVENT_MENU_ONE); else
			hr = SimConnect_MenuDeleteItem(hSimConnect, EVENT_MENU_TWO);

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testMenuItems();

	return 0;
}
// End of sample
