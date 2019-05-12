//------------------------------------------------------------------------------
//
//  SimConnect AI Objects sample
//  
//	Description:
//				Adds Non ATC controlled simulation objects.
//				With the default flight (Cessna at Seatac) - turn off the engine
//				and watch the antics.
//				Press z to create the objects
//				Press x to load them with their waypoint lists
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;
DWORD	BalloonID	= SIMCONNECT_OBJECT_ID_USER;
DWORD	BellID		= SIMCONNECT_OBJECT_ID_USER;
DWORD	MooneyID	= SIMCONNECT_OBJECT_ID_USER;
DWORD	TruckID		= SIMCONNECT_OBJECT_ID_USER;

static enum EVENT_ID {
	EVENT_SIM_START,
	EVENT_Z,
	EVENT_X,
	EVENT_C,
	EVENT_V,
};

static enum DATA_REQUEST_ID7 {
	REQUEST_BALLOON1,
	REQUEST_BELL,
	REQUEST_MOONEY,
	REQUEST_DOUGLAS,
	REQUEST_TRUCK,
	REQUEST_WHALE,
};

static enum GROUP_ID {
	GROUP_ZX,
};

static enum INPUT_ID {
	INPUT_ZX,
};

static enum DEFINITION_ID {
	DEFINITION_WAYPOINT,
	DEFINITION_THROTTLE
};

struct structBalloonControl 
{
	double throttlePercent;
};

structBalloonControl		bc;

// Set up flags so these operations only happen once
static bool plansSent		= false;
static bool	objectsCreated	= false;

void sendFlightPlans()
{
	HRESULT hr;
	SIMCONNECT_DATA_WAYPOINT	wp[3];	// Mooney waypoint list
	SIMCONNECT_DATA_WAYPOINT	ft[2];	// Truck waypoint list

	// Mooney aircraft should fly in circles across the North end of the runway

	wp[0].Flags		= SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
	wp[0].Altitude	= 800;
	wp[0].Latitude	= 47 + (27.79/60);	
	wp[0].Longitude = -122 - (18.46/60);
	wp[0].ktsSpeed	= 100;

	wp[1].Flags		= SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
	wp[1].Altitude	= 600;
	wp[1].Latitude	= 47 + (27.79/60);	
	wp[1].Longitude = -122 - (17.37/60);
	wp[1].ktsSpeed	= 100;

	wp[2].Flags		= SIMCONNECT_WAYPOINT_WRAP_TO_FIRST | SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
	wp[2].Altitude	= 800;
	wp[2].Latitude	= 47 + (27.79/60);	
	wp[2].Longitude = -122 - (19.92/60);
	wp[2].ktsSpeed	= 100;

	// Send the three waypoints to the Mooney
	hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_WAYPOINT, MooneyID, 0, 3, sizeof(wp), wp);

	// Truck goes down the runway
	ft[0].Flags		= SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
	ft[0].Altitude	= 433;
	ft[0].Latitude	= 47 + (25.93/60);	
	ft[0].Longitude = -122 - (18.46/60);
	ft[0].ktsSpeed	= 75;

	ft[1].Flags		= SIMCONNECT_WAYPOINT_WRAP_TO_FIRST | SIMCONNECT_WAYPOINT_SPEED_REQUESTED;
	ft[1].Altitude	= 433;
	ft[1].Latitude	= 47 + (26.25/60);	
	ft[1].Longitude = -122 - (18.46/60);
	ft[1].ktsSpeed	= 55;

	// Send the two waypoints to the truck
	hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_WAYPOINT, TruckID, 0, 2, sizeof(ft), ft);


}

void setUpSimObjects()
{
	SIMCONNECT_DATA_INITPOSITION Init;
	HRESULT hr;

	// Add a parked museum aircraft, just west of the runway

    Init.Altitude   = 433.0;				// Altitude of Sea-tac is 433 feet
    Init.Latitude   = 47 + (25.97/60);		// Convert from 47 25.97 N
    Init.Longitude  = -122 - (18.51/60);	// Convert from 122 18.51 W
    Init.Pitch      =  0.0;
    Init.Bank       =  0.0;
    Init.Heading    = 90.0;
    Init.OnGround   = 1;
    Init.Airspeed	= 0;
	hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Douglas DC-3", Init, REQUEST_DOUGLAS);

	// Add a hot air balloon

    Init.Altitude   = 500.0;				// Altitude of Sea-tac is 433 feet
    Init.Latitude   = 47 + (25.97/60);		// Convert from 47 26.22 N
    Init.Longitude  = -122 - (18.45/60);	// Convert from 122 18.45 W
    Init.Pitch      =  0.0;
    Init.Bank       =  0.0;
    Init.Heading    = 0.0;
    Init.OnGround   = 0;
    Init.Airspeed	= 0;
	hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Hot_Air_Balloon", Init, REQUEST_BALLOON1);

	// Add a helicopter

    Init.Altitude   = 433.0;				// Altitude of Sea-tac is 433 feet
    Init.Latitude   = 47 + (26.22/60);		// Convert from 47 26.22 N
    Init.Longitude  = -122 - (18.48/60);	// Convert from 122 18.48 W
    Init.Pitch      =  0.0;
    Init.Bank       =  0.0;
    Init.Heading    = 0.0;
    Init.OnGround   = 1;
    Init.Airspeed	= 100;
	
	//hr = SimConnect_AICreateNonATCAircraft(hSimConnect, "Bell 206B JetRanger", "H1000", Init, REQUEST_BELL);
    
	// Initialize Mooney aircraft just in front of user aircraft
	// User aircraft is at 47 25.89 N, 122 18.48 W

	Init.Altitude   = 433.0;				// Altitude of Sea-tac is 433 feet
    Init.Latitude   = 47 + (25.91/60);		// Convert from 47 25.90 N
    Init.Longitude  = -122 - (18.48/60);	// Convert from 122 18.48 W
    Init.Pitch      =  0.0;
    Init.Bank       =  0.0;
    Init.Heading    = 360.0;
    Init.OnGround   = 1;
    Init.Airspeed	= 1;
	
	hr = SimConnect_AICreateNonATCAircraft(hSimConnect, "Mooney Bravo", "N1001", Init, REQUEST_MOONEY);
	
	// Initialize truck just in front of user aircraft
	// User aircraft is at 47 25.89 N, 122 18.48 W

	Init.Altitude   = 433.0;				// Altitude of Sea-tac is 433 feet
    Init.Latitude   = 47 + (25.91/60);		// Convert from 47 25.90 N
    Init.Longitude  = -122 - (18.47/60);	// Convert from 122 18.48 W
    Init.Pitch      =  0.0;
    Init.Bank       =  0.0;
    Init.Heading    = 360.0;
    Init.OnGround   = 1;
    Init.Airspeed	= 0;
	
	hr = SimConnect_AICreateSimulatedObject(hSimConnect, "VEH_jetTruck", Init, REQUEST_TRUCK);
	
	// Add a humpback whale

    Init.Altitude   = 433.0;				// Altitude of Sea-tac is 433 feet
    Init.Latitude   = 47 + (25.89/60);		// Convert from 47 25.89 N
    Init.Longitude  = -122 - (18.51/60);	// Convert from 122 18.51 W
    Init.Pitch      =  0.0;
    Init.Bank       =  0.0;
    Init.Heading    =  0.0;
    Init.OnGround   = 1;
    Init.Airspeed	= 0;
	hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Humpbackwhale", Init, REQUEST_WHALE);
}

void CALLBACK MyDispatchProcSO(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
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

					// Sim has started so turn the input events on
					hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_ON);

					break;

                case EVENT_Z:
					if (!objectsCreated)
					{
						setUpSimObjects();
						objectsCreated = true;
					}
                    break;

				case EVENT_X:
					if (!plansSent && objectsCreated)
					{
						sendFlightPlans();
						plansSent = true;
					}
					break;

				case EVENT_C:
					{

						// Give the balloon some throttle
						if (bc.throttlePercent < 100.0f)
							bc.throttlePercent	+= 5.0f;

						hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_THROTTLE, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(bc), &bc);

						break;
					}

				case EVENT_V:
					{

						// Give the balloon some throttle
						if (bc.throttlePercent > 0.0f)
							bc.throttlePercent	-= 5.0f;

						hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_THROTTLE, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(bc), &bc);

						break;
					}
                
				default:
					printf("\nUnknown event: %d", evt->uEventID);
                    break;
            }
            break;
        }
		
		case SIMCONNECT_RECV_ID_ASSIGNED_OBJECT_ID:
		{
			SIMCONNECT_RECV_ASSIGNED_OBJECT_ID *pObjData = (SIMCONNECT_RECV_ASSIGNED_OBJECT_ID*)pData;
	
			switch( pObjData ->dwRequestID)
			{
			
			case REQUEST_BALLOON1:
				BalloonID = pObjData->dwObjectID;
				printf("\nCreated Balloon 1 id = %d", BalloonID);
				break;

			case REQUEST_BELL:
				BellID = pObjData->dwObjectID;
				printf("\nCreated Bell Helicopter id = %d", BellID);
				break;	
			
			case REQUEST_MOONEY:
				MooneyID = pObjData->dwObjectID;
				printf("\nCreated Mooney Bravo id = %d", MooneyID);
				break;	

			case REQUEST_DOUGLAS:
				printf("\nCreated stationary Douglas DC3 id = %d", pObjData->dwObjectID);
				break;

			case REQUEST_TRUCK:
				TruckID = pObjData->dwObjectID;
				printf("\nCreated truck id = %d", TruckID);
				break;
			
			case REQUEST_WHALE:
				printf("\nCreated humpback whale id = %d", pObjData->dwObjectID);
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

void testSimObjects()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "AI Objects and Waypoints", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
          
		// Create some private events
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_Z);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_X);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_C);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_V);


        // Link the private events to keyboard keys, and ensure the input events are off
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "Z", EVENT_Z);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "X", EVENT_X);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "C", EVENT_C);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "V", EVENT_V);

        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_OFF);

        // Sign up for notifications
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_Z);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_X);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_C);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_V);

		// Set up a definition for a waypoint list
		hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_WAYPOINT,
			"AI Waypoint List", "number", SIMCONNECT_DATATYPE_WAYPOINT);

		// Set up a definition for the balloon throttle
		bc.throttlePercent = 0.0f;

        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_THROTTLE,
			"GENERAL ENG THROTTLE LEVER POSITION:1", "percent");

		// Request a simulation start event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

		while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcSO, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}


int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testSimObjects();
	return 0;
}