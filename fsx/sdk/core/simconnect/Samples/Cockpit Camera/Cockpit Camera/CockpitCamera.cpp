//------------------------------------------------------------------------------
//
//  SimConnect Cockpit Camera Sample
//  
//  Description:
//              Press the < and > keys (actually the , and . keys, as there is 
//              no use of the shift key) to rotate the pilot's view
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
    EVENT_CAMERA_RIGHT,
    EVENT_CAMERA_LEFT,
 };

static float cameraBank = 0.0f;

float normalize180 (float v)
{
    while (v < -180.0f) v += 360.0f;
    while (v > 180.0f) v -= 360.0f;
    return v;
}

void CALLBACK MyDispatchProcCC(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    HRESULT hr;

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_CAMERA_RIGHT:

                    cameraBank = normalize180( cameraBank + 5.0f);

                    hr = SimConnect_CameraSetRelative6DOF(hSimConnect, 0.0f, 0.0f, 0.0f,
                            SIMCONNECT_CAMERA_IGNORE_FIELD,SIMCONNECT_CAMERA_IGNORE_FIELD, cameraBank);

                    printf("\nCamera Bank = %f", cameraBank);
                    break;

                case EVENT_CAMERA_LEFT:
                    
                    cameraBank = normalize180( cameraBank - 5.0f);

                    hr = SimConnect_CameraSetRelative6DOF(hSimConnect, 0.0f, 0.0f, 0.0f,
                            SIMCONNECT_CAMERA_IGNORE_FIELD,SIMCONNECT_CAMERA_IGNORE_FIELD, cameraBank);
                    
                    printf("\nCamera Bank = %f", cameraBank);
                    break;

                default:
                    break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_EXCEPTION:
        {
            SIMCONNECT_RECV_EXCEPTION *except = (SIMCONNECT_RECV_EXCEPTION*)pData;
            
            switch (except->dwException)
            {
            case SIMCONNECT_EXCEPTION_ERROR:
                printf("\nCamera error");
                break;

            default:
                printf("\nException");
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

static enum INPUT_ID {
    INPUT0,
};

void testCockpitCamera()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Cockpit Camera", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        // Define private events
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_CAMERA_RIGHT);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_CAMERA_LEFT);

        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP0, EVENT_CAMERA_RIGHT);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP0, EVENT_CAMERA_LEFT);

        hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP0, SIMCONNECT_GROUP_PRIORITY_HIGHEST);

        // Map the keys , and . keys to the private events
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT0, "VK_PERIOD", EVENT_CAMERA_RIGHT);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT0, "VK_COMMA", EVENT_CAMERA_LEFT);

        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT0, SIMCONNECT_STATE_ON);

  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcCC, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{

    testCockpitCamera();

    return 0;
}





