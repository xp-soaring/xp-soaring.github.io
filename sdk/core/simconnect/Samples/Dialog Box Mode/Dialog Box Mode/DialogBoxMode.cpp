//------------------------------------------------------------------------------
//
//  SimConnect Dialog Box Mode sample
//
//  Description:
//              If the key combination U+Q is typed, a request is sent to set
//              Dialog Mode, and if it is successful, a message box is rendered, and then
//              Dialog Mode is turned off.
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
    EVENT0,
};

static enum INPUT_ID {
    INPUT0,
};

static enum REQUEST_ID {
    REQUEST0,
};


void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    HRESULT hr;

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT0:
                    printf("\nEVENT0: %d", evt->dwData);

                    // Send a request to turn Dialog Mode on
                    hr = SimConnect_SetSystemState( hSimConnect, "DialogMode", 1, 0, NULL );
                    
                    // Send a request to ask whether Dialog Mode is on
                    hr = SimConnect_RequestSystemState(hSimConnect, REQUEST0, "DialogMode");
                    break;

                default:
                    printf("\nSIMCONNECT_RECV_EVENT: 0x%08X 0x%08X 0x%X", evt->uEventID, evt->dwData, cbData);
                    break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_SYSTEM_STATE:
        {
            SIMCONNECT_RECV_SYSTEM_STATE *pState = (SIMCONNECT_RECV_SYSTEM_STATE*)pData;

            switch(pState->dwRequestID)
            {
            case REQUEST0:

                // If Dialog Mode is on, show a Message box

                if ( pState->dwInteger != 0 )
                {
                    MessageBox( NULL, TEXT("Test!"), TEXT("Dialog Mode is on"), MB_OK );

                    // Send a request to turn Dialog Mode off

                    hr = SimConnect_SetSystemState( hSimConnect, "DialogMode", 0, 0, NULL );
                }
                break;

            }

            printf("\nSIMCONNECT_RECV_SYSTEM_STATE RequestID=%d  dwInteger=%d  fFloat=%f  szString=\"%s\"", pState->dwRequestID, pState->dwInteger, pState->fFloat, &pState->szString[0]);
            break;
        }

        case SIMCONNECT_RECV_ID_QUIT:
        {
            quit = 1;
            break;
        }

        case SIMCONNECT_RECV_ID_EXCEPTION:
        {
            SIMCONNECT_RECV_EXCEPTION *except = (SIMCONNECT_RECV_EXCEPTION*)pData;
            printf("\n\n***** EXCEPTION=%d  SendID=%d  uOffset=%d  cbData=%d\n", except->dwException, except->dwSendID, except->dwIndex, cbData);
            break;
        }

        default:
            printf("\nUNKNOWN DATA RECEIVED: pData=%p cbData=%d\n", pData, cbData);
            break;
    }
}

//------------------------------------------------------------------------------
//  main
//------------------------------------------------------------------------------
int __cdecl main(int argc, char* argv[])
{
    HANDLE hEventHandle = ::CreateEvent(NULL, FALSE, FALSE, NULL);
    if(hEventHandle == NULL)
    {
        printf("Error: Event creation failed!  Bailing");
        return 1;
    }

    if (FAILED(SimConnect_Open(&hSimConnect, "DialogBoxMode Sample", NULL, 0, hEventHandle, 0)))
    {
        printf("\nConnection to Flight Simulator failed!");

    } else
    {
        printf("\nConnected to Flight Simulator!");

        HRESULT hr;

        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT0);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP0, EVENT0);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT0, "U+Q", EVENT0);
        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT0, SIMCONNECT_STATE_ON);

        while( 0 == quit && hr==S_OK && ::WaitForSingleObject(hEventHandle, INFINITE) == WAIT_OBJECT_0)
        {
            hr = SimConnect_CallDispatch(hSimConnect, MyDispatchProc, NULL);
        }
        hr = SimConnect_Close(hSimConnect);
        CloseHandle(hEventHandle);
    }

    return 0;
}
