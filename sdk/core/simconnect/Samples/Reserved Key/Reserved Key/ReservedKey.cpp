//------------------------------------------------------------------------------
//
//  SimConnect Reserved Key Sample
//  
//	Description:
//				Try to reserve keys q, a or z.
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;


static enum EVENT_ID {
	EVENT_RESERVE_REQUEST,
 };

void CALLBACK MyDispatchProcRK(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_RESERVED_KEY:
        {
            SIMCONNECT_RECV_RESERVED_KEY *rkey = (SIMCONNECT_RECV_RESERVED_KEY*)pData;

            printf("\nReserved Key: %s  %s", rkey->szChoiceReserved, rkey->szReservedKey);

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



void testReservedKey()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Reserved Key", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
		// Create a private event
		hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_RESERVE_REQUEST);

		// Use the private event to request a reserved key
        hr = SimConnect_RequestReservedKey(hSimConnect, EVENT_RESERVE_REQUEST, "q", "a", "z");
		
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcRK, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{

    testReservedKey();

	return 0;
}
