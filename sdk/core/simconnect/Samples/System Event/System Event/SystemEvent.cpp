//------------------------------------------------------------------------------
//
//  SimConnect System Event Sample
//  
//	Description:
//				Request a FlightLoaded system event
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;


static enum EVENT_ID2 {
    EVENT_FLIGHT_LOAD,
};

void CALLBACK MyDispatchProc2(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT_FILENAME:
        {
            SIMCONNECT_RECV_EVENT_FILENAME *evt = (SIMCONNECT_RECV_EVENT_FILENAME*)pData;
            switch(evt->uEventID)
            {
                case EVENT_FLIGHT_LOAD:

					printf("\nNew Flight Loaded: %s", evt->szFileName); 

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

void testSystemEvent()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "System Event", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   

        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_FLIGHT_LOAD, "FlightLoaded");
  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProc2, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
	testSystemEvent();

	return 0;
}





