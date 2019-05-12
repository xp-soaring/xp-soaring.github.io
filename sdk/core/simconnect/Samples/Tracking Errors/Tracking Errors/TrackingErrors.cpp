//------------------------------------------------------------------------------
//
//  SimConnect Tracking Errors Sample
//  
//	Description:
//				Shows how to use GetLastSendID to record the ID of a request, along
//				with an identification string, in order to match the IDs of errors
//				returned to identify which call caused the error
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

// Header file is in FSX/SDK/Simconnect/inc
#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

#define max_send_records        10

// Declare a structure to hold the send IDs and identification strings
struct  record_struct {
    char  call[256];
    DWORD   sendid;
};

int     record_count = 0;
struct  record_struct send_record[max_send_records];

// Record the ID along with the identification string in the send_record structure

void addSendRecord(char* c)
{
    DWORD id;

    if (record_count < max_send_records)
    {
        int hr = SimConnect_GetLastSentPacketID(hSimConnect, &id);

        strncpy_s(send_record[ record_count ].call, 255, c, 255);
        send_record[ record_count ].sendid = id;
        ++record_count;
    }
}

// Given the ID of an erroneous packet, find the identification string of the call

char* findSendRecord(DWORD id)
{
    bool found  = false;
    int count   = 0;
    while (!found && count < record_count)
    {
        if (id == send_record[count].sendid)
            return send_record[count].call;
        ++count;
    }
    return "Send Record not found";
}

static enum GROUP_ID11 {
    GROUP_11,
};

static enum EVENT_ID11 {
    EVENT_BRAKES_11,
    EVENT_BAD,
 };

void CALLBACK MyDispatchProc11(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_BRAKES_11:
                    printf("\nEvent brakes: %d", evt->dwData);
                    break;

                default:
                    break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_EXCEPTION:
        {
            SIMCONNECT_RECV_EXCEPTION *except = (SIMCONNECT_RECV_EXCEPTION*)pData;
            printf("\n\n***** EXCEPTION=%d  SendID=%d  Index=%d  cbData=%d\n", except->dwException, except->dwSendID, except->dwIndex, cbData);

			// Locate the bad call and print it out
            char* s = findSendRecord(except->dwSendID);
            printf("\n%s", s);
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

void testErrors()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Tracking Errors", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_BRAKES_11, "brakes");
        addSendRecord(" SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_BRAKES_11, \"brakes\"); ");

        // To force an error, use the wrong event
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_11, EVENT_BAD);
        addSendRecord(" SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_11, EVENT_BAD); ");

        hr = SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_11, SIMCONNECT_GROUP_PRIORITY_HIGHEST);
        addSendRecord(" SimConnect_SetNotificationGroupPriority(hSimConnect, GROUP_11, SIMCONNECT_GROUP_PRIORITY_HIGHEST); ");
  
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProc11, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testErrors();
	return 0;
}





