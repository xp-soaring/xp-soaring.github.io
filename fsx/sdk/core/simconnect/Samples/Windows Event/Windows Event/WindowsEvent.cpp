//------------------------------------------------------------------------------
//
//  SimConnect Windows Event Sample
//  
//	Description:
//				Requests a four second timing event, and implements a Windows
//				Event handler to minimize processing time
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>

#include "SimConnect.h"


static enum EVENT_ID {
    EVENT_4S,
};

int quit = 0;
HANDLE hSimConnect = NULL;

static int tick = 0;

void CALLBACK MyDispatchProcWE(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;
            switch(evt->uEventID)
            { 
			case EVENT_4S:
				printf("\n4 second timer: %d", ++tick);
				break;

            default:
                printf("\nSIMCONNECT_RECV_EVENT: 0x%08X 0x%08X 0x%X", evt->uEventID, evt->dwData, cbData);
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
            printf("\nUNKNOWN DATA RECEIVED: pData=%p cbData=%d\n", pData, cbData);
            break;
    }
}

bool testWindowsEvent()
{
    HANDLE hEventHandle = ::CreateEvent(NULL, FALSE, FALSE, NULL);
    if(hEventHandle == NULL)
    {
        printf("Error: Event creation failed!");
        return false;
    }

    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Windows Event", NULL, 0, hEventHandle, 0)))
	{
		printf("\nConnected to Flight Simulator!");

		// Subscribe to the four second timer

		hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_4S, "4sec");

		// Check for messages only when a Windows event has been received

		while( 0 == quit && ::WaitForSingleObject(hEventHandle, INFINITE) == WAIT_OBJECT_0)
		{
			SimConnect_CallDispatch(hSimConnect, MyDispatchProcWE, NULL);
		} 

		CloseHandle(hEventHandle);
		hr = SimConnect_Close(hSimConnect);
		return true;
	}
	return false;
}

int __cdecl _tmain(int argc, char* argv[])
{
	bool ok = testWindowsEvent();
    return 0; 
}
