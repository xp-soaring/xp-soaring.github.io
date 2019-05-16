//------------------------------------------------------------------------------
//
//  SimConnect AI ATC Aircraft sample
//  
//	Description:
//				Adds AI aircraft to make the flight from Yakima to Spokane busy.
//				First start the user aircraft at Yakima (or load the Yakima to Spokane
//				flight plan used by the AI aircraft - then drive off the runway to view
//				the goings on).
//				Press the Z key to add six AI aircraft
//				Press the X key to give the parked aircraft the Yakima to Spokane
//				flight plan
//				Both keys can only work once.
//				The creation of the 747 shguld fail - as Yakima airport is not
//				large enough for this aircraft.
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;
DWORD   ParkedBoeingID = SIMCONNECT_OBJECT_ID_USER;
DWORD   ParkedMooneyID = SIMCONNECT_OBJECT_ID_USER;

static enum EVENT_ID {
    EVENT_SIM_START,
    EVENT_Z,
    EVENT_X,
    EVENT_ADDED_AIRCRAFT,
    EVENT_REMOVED_AIRCRAFT,
};

static enum DATA_REQUEST_ID7 {
    REQUEST_BOEING737,
    REQUEST_BOEING747,
    REQUEST_BARON,
    REQUEST_LEARJET,
    REQUEST_BOEING737_PARKED,
    REQUEST_MOONEY_PARKED,
    REQUEST_BOEING737_PARKED_FLIGHTPLAN,
    REQUEST_MOONEY_PARKED_FLIGHTPLAN,
};

static enum GROUP_ID {
    GROUP_ZX,
};

static enum INPUT_ID {
    INPUT_ZX,
};

// Set up flags so these operations only happen once
static bool plansSent       = false;
static bool aircraftCreated = false;

void sendFlightPlans()
{
    HRESULT hr;
    
    if (ParkedBoeingID != SIMCONNECT_OBJECT_ID_USER)
    {
        hr = SimConnect_AISetAircraftFlightPlan(hSimConnect, ParkedBoeingID,
            "IFR Yakima Air Term Mcallister to Spokane Intl", REQUEST_BOEING737_PARKED_FLIGHTPLAN);
    }
    if (ParkedMooneyID != SIMCONNECT_OBJECT_ID_USER)
    {
        hr = SimConnect_AISetAircraftFlightPlan(hSimConnect, ParkedMooneyID,
            "IFR Yakima Air Term Mcallister to Spokane Intl", REQUEST_MOONEY_PARKED_FLIGHTPLAN);
    }
}


void setUpAIAircraft()
{
    HRESULT hr;

    // Add some AI controlled aircraft
    hr = SimConnect_AICreateEnrouteATCAircraft(hSimConnect, "Boeing 737-800", "N100", 100,
        "IFR Yakima Air Term Mcallister to Spokane Intl", 0.0f, false, REQUEST_BOEING737);

    hr = SimConnect_AICreateEnrouteATCAircraft(hSimConnect, "Boeing 747-400", "N101", 101,
        "IFR Yakima Air Term Mcallister to Spokane Intl", 0.0f, false, REQUEST_BOEING747);

    hr = SimConnect_AICreateEnrouteATCAircraft(hSimConnect, "Beech Baron 58", "N200", 200,
        "IFR Yakima Air Term Mcallister to Spokane Intl", 0.0f, false, REQUEST_BARON);
    
    hr = SimConnect_AICreateEnrouteATCAircraft(hSimConnect, "Learjet 45", "N201", 201,
        "IFR Yakima Air Term Mcallister to Spokane Intl", 0.0f, false, REQUEST_LEARJET);

    // Park a few aircraft
    hr = SimConnect_AICreateParkedATCAircraft(hSimConnect, "Boeing 737-800", "N102",
        "KYKM", REQUEST_BOEING737_PARKED);

    hr = SimConnect_AICreateParkedATCAircraft(hSimConnect, "Mooney Bravo", "N202",
        "KYKM", REQUEST_MOONEY_PARKED);
}

void CALLBACK MyDispatchProcAI(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{   
    HRESULT hr;

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_SIM_START:

                    // Sim has started so turn input events on
                    hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_ON);
                    break;

                case EVENT_Z:
                    if (!aircraftCreated)
                    {
                        setUpAIAircraft();
                        aircraftCreated = true;
                    }
                    break;

                case EVENT_X:
                    if (!plansSent && aircraftCreated)
                    {
                        sendFlightPlans();
                        plansSent = true;
                    }
                    break;

                default:
                    printf("\nUnknown event: %d", evt->uEventID);
                    break;
            }
            break;
        }
        
        case SIMCONNECT_RECV_ID_EVENT_OBJECT_ADDREMOVE:
        {
            SIMCONNECT_RECV_EVENT_OBJECT_ADDREMOVE *evt = (SIMCONNECT_RECV_EVENT_OBJECT_ADDREMOVE*)pData;
            
            switch(evt->uEventID)
            {
                case EVENT_ADDED_AIRCRAFT:
                    printf("\nAI object added: Type=%d, ObjectID=%d", evt->eObjType, evt->dwData);
                    break;

                case EVENT_REMOVED_AIRCRAFT:
                    printf("\nAI object removed: Type=%d, ObjectID=%d", evt->eObjType, evt->dwData);
                    break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID:
        {
            SIMCONNECT_RECV_ASSIGNED_OBJECT_ID *pObjData = (SIMCONNECT_RECV_ASSIGNED_OBJECT_ID*)pData;
    
            switch( pObjData ->dwRequestID)
            {
                // Do nothing specific in these cases, as the aircraft already have their flight plans
            
            case REQUEST_BOEING737:
                printf("\nCreated Boeing 737 id = %d", pObjData->dwObjectID);
                break;

            case REQUEST_BOEING747:
                printf("\nCreated Boeing 747 id = %d", pObjData->dwObjectID);
                break;

            case REQUEST_BARON:
                printf("\nCreated Beech Baron id = %d", pObjData->dwObjectID);
                break;

            case REQUEST_LEARJET:
                printf("\nCreated Learjet id = %d", pObjData->dwObjectID);
                break;

            case REQUEST_BOEING737_PARKED:

                // Record the object ID, so the flightplan can be sent out later
                ParkedBoeingID = pObjData ->dwObjectID;

                printf("\nCreated parked Boeing %d", pObjData->dwObjectID);

                break;

            case REQUEST_MOONEY_PARKED:

                // Record the object ID, so the flightplan can be sent out later
                ParkedMooneyID = pObjData ->dwObjectID;

                printf("\nCreated parked Mooney %d", pObjData->dwObjectID);
                
                break;

            default:
                printf("\nUnknown creation %d", pObjData->dwRequestID);
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
            printf("\nReceived:%d",pData->dwID);
            break;
    }
}

void testAIAircraft()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "AI Traffic", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
          
        // Create some private events
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_Z);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_X);

        // Link the private events to keyboard keys, and ensure input events are off
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "Z", EVENT_Z);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "X", EVENT_X);

        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_OFF);

        // Sign up for notifications
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_Z);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_X);
        
        // Request a simulation start event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

        // Subscribe to system events notifying the client that objects have been added or removed
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_ADDED_AIRCRAFT, "ObjectAdded");
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_REMOVED_AIRCRAFT, "ObjectRemoved");

        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcAI, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}


int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testAIAircraft();
    return 0;
}