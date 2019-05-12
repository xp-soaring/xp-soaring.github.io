//------------------------------------------------------------------------------
//
//  SimConnect Mission Action Sample
//  
//	Description:
//				Link SimConnect client with a Mission.
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

// Need copies of all the GUIDs used in the mission file

// {FD078977-153F-42de-8080-CA0927A3C2A5}
static const GUID g_guidCustomAction1 = 
{ 0xfd078977, 0x153f, 0x42de, { 0x80, 0x80, 0xca, 0x9, 0x27, 0xa3, 0xc2, 0xa5 } };

// {FD078977-153F-42de-8080-CA0927A3C2A5}
static const GUID g_guidCustomAction2 = 
{ 0xfd078977, 0x153f, 0x42de, { 0x80, 0x80, 0xca, 0x9, 0x27, 0xa3, 0xc2, 0xa5 } };

// {FD078977-153F-42de-8080-CA0927A3C2A5}
static const GUID g_guidMissionAction1 = 
{ 0xfd078977, 0x153f, 0x42de, { 0x80, 0x80, 0xca, 0x9, 0x27, 0xa3, 0xc2, 0xa5 } };

// {FD078977-153F-42de-8080-CA0927A3C2A5}
static const GUID g_guidMissionAction2 = 
{ 0xfd078977, 0x153f, 0x42de, { 0x80, 0x80, 0xca, 0x9, 0x27, 0xa3, 0xc2, 0xa5 } };


static enum EVENT_ID {
	EVENT_MISSION_ACTION,
	EVENT_MISSION_COMPLETED
};

void CALLBACK MyDispatchProcMA(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
	HRESULT hr;

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

			switch(evt->uEventID)
            {
                case EVENT_MISSION_COMPLETED:

					printf("\nMission completed, result = %d", evt->dwData);

					// Perform any additional processing to complete the mission
					// Perhaps writing out a status file that can be read in by another
					// mission.

                    break;

                default:
                   break;
            }
            break;
        }
        
		case SIMCONNECT_RECV_ID_CUSTOM_ACTION:
        {
			SIMCONNECT_RECV_CUSTOM_ACTION *pCustomAction = (SIMCONNECT_RECV_CUSTOM_ACTION *)pData;
 
			if (pCustomAction->guidInstanceId == g_guidCustomAction1)
			{
				printf("\nCustom Action 1, payload: %s", pCustomAction->szPayLoad);

				// Custom actions can include calls to actions within the mission xml file, though
				// if this is done we cannot know if the actions have been completed within this
				// section of code (the actions may initiate triggers and it may be some time
				// before the sequence is ended).

				hr = SimConnect_ExecuteMissionAction(hSimConnect, g_guidMissionAction1);
				hr = SimConnect_ExecuteMissionAction(hSimConnect, g_guidMissionAction2);
			
			} else
			if (pCustomAction->guidInstanceId == g_guidCustomAction2)
			{
				printf("\nCustom Action 2, payload: %s", pCustomAction->szPayLoad);

				// This action simply notifies the Mission system that the first action
				// is complete
				hr = SimConnect_CompleteCustomMissionAction(hSimConnect, g_guidCustomAction1);

			} else
			{
				printf("\nUnknown custom action: %p", pCustomAction->guidInstanceId);
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

void testMissionAction()
{
    HRESULT hr;

    HANDLE hEventHandle = ::CreateEvent(NULL, FALSE, FALSE, NULL);
    
	if(hEventHandle == NULL)
    {
        printf("Error: Event creation failed!");
        return;
    }
    
	if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Mission Action", NULL, 0, hEventHandle, 0)))
    {
        printf("\nConnected to Flight Simulator!");   

		// Subscribe to the mission completed event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_MISSION_COMPLETED, "MissionCompleted");
        
		// Subscribe to a notification when a custom action executes
		hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_MISSION_ACTION, "CustomMissionActionExecuted");
 
		// Check for messages only when a Windows event has been received

		while( 0 == quit && ::WaitForSingleObject(hEventHandle, INFINITE) == WAIT_OBJECT_0)
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcMA, NULL);
            Sleep(1);
        }

		CloseHandle(hEventHandle);
        
		hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
	testMissionAction();

	return 0;
}
