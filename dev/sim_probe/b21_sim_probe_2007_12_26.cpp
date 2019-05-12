//------------------------------------------------------------------------------
//
//  SimConnect probe ground elevation around user aircraft
//  
//  Description:
//              creates five probes and displays their ground altitude each second
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>
#include <math.h>

#include "SimConnect.h"

// profile_count is the number of samples in the profile
const int PROFILE_COUNT = 6;

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum EVENT_ID {
    EVENT_SIM_START,
// the following are keystroke events useed in testing
    EVENT_Z,
    EVENT_X,
    EVENT_C,
    EVENT_V,
//  EVENT_B
};

static enum DATA_REQUEST_ID {
//    REQUEST_1,
    REQUEST_PROBE_CREATE1,
    REQUEST_PROBE_CREATE2,
    REQUEST_PROBE_CREATE3,
    REQUEST_PROBE_CREATE4,
    REQUEST_PROBE_CREATE5,
    REQUEST_PROBE_RELEASE,
    REQUEST_PROBE_POS1,
    REQUEST_PROBE_POS2,
    REQUEST_PROBE_POS3,
    REQUEST_PROBE_POS4,
    REQUEST_PROBE_POS5,
    REQUEST_USER_POS,
    REQUEST_USER_POS_AND_PROFILE
};

// GROUP_ID and INPUT_ID are used for keystroke events in testing
static enum GROUP_ID {
    GROUP_ZX
};

static enum INPUT_ID {
    INPUT_ZX
};

static enum DEFINITION_ID {
//    DEFINITION_1,
    DEFINITION_MOVE,
    DEFINITION_PROBE_POS,
    DEFINITION_USER_POS
};

struct ProbeStruct {
    double ground_elevation;
    double latitude;
    double longitude;
};

struct UserStruct {
    double latitude;
    double longitude;
    double altitude; // meters
    double ground_elevation;
    double wind_velocity; // m/s
    double wind_direction; // degrees
};

struct MoveStruct {
    double latitude;
    double longitude;
};

//struct Struct1
//{
//    char    title[256];
//    double  kohlsmann;
//    double  altitude;
//    double  latitude;
//    double  longitude;
//};

// create var to hold user plane position
UserStruct user_pos;

// wind direction
double wind_direction = 0.0;
double wind_velocity = 0.0;

// profile[] is the array of samples of ground elevation (in meters), each set by move_probe(i)
ProbeStruct profile[PROFILE_COUNT];

DWORD   probe_id[PROFILE_COUNT];            // object id of probe[i]

// flag to confirm elevation received for probe[i] - set to 'true' as each
// ground elevation request comes in
bool	profile_valid[PROFILE_COUNT] = {false}; 

// profile_distance is the array of sample distances (in meters) upwind of the user aircraft
double profile_distance[PROFILE_COUNT] = {0.0, 500.0, 1000.0, 3000.0, -500.0, 5000.0};
// profile_bearing is the degrees offset relative to wind to apply to the bearing of the probe
double profile_bearing[PROFILE_COUNT] = {0.0, 0.0, 0.0, 0.0, 0.0, 0.0};


// Set up flags so that probes only created once
static bool objectsCreated  = false;

// Struct for probe initial position use when created. (testing: set for Seatac)
SIMCONNECT_DATA_INITPOSITION probe_position;


const double M_PI = 4.0*atan(1.0); // pi
const double EARTH_RAD = 6366710.0; // earth's radius in meters

//**********************************************************************************
// now we have a number of functions to do lat/long calculations to work
// out the lat/long needed for each probe.

// convert radians at the center of the earth to meters on the surface
inline double rad2m(double rad)
{
    return EARTH_RAD * rad;
}

// convert metres on earths surface to radians subtended at the centre
inline double m2rad(double distance)
{
    return distance / EARTH_RAD;
}

// convert degrees to radians
inline double deg2rad(double deg)
{
    return deg * (M_PI / 180.0);
}

// convert radians to degrees

inline double rad2deg(double rad)
{
    return rad * (180.0 / M_PI);
}

// distance_and_bearing(...) returns a new lat/long a distance and bearing from lat1,lon1.
// lat, longs and bearings in degrees, distance in meters
MoveStruct distance_and_bearing(double lat1, double long1, double distance, double bearing) {
	double rlat1, rlong1, rbearing, rdistance, rlat2, rlong2;
	MoveStruct r;
	rlat1 = deg2rad(lat1);
	rlong1 = deg2rad(long1);
	rdistance = m2rad(distance);
	rbearing = deg2rad(bearing);
	rlat2 = asin(sin(rlat1)*cos(rdistance)+cos(rlat1)*sin(rdistance)*cos(rbearing));
	if (cos(rlat2)==0) {
        rlong2 = rlong1;      // endpoint a pole
	}
	else {
		rlong2 = fmod((rlong1+asin(sin(rbearing)*sin(rdistance)/cos(rlat2))+M_PI),(2*M_PI))-M_PI;
	}
	r.latitude = rad2deg(rlat2);
	r.longitude = rad2deg(rlong2);
	return r;
}
//**********************************************************************************

void create_probes()
{
    HRESULT hr;

    
    // Initialize probes at Seatac
    // User aircraft is at 47 25.89 N, 122 18.48 W

    probe_position.Altitude   = 0;              // Altitude of Sea-tac is 433 feet
    probe_position.Latitude   = 47 + (25.91/60);        // Convert from 47 25.90 N
    probe_position.Longitude  = -122 - (18.47/60);  // Convert from 122 18.48 W
    probe_position.Pitch      =  0.0;
    probe_position.Bank       =  0.0;
    probe_position.Heading    = 360.0;
    probe_position.OnGround   = 1;
    probe_position.Airspeed = 0;
    
    hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Food_pallet", probe_position, REQUEST_PROBE_CREATE1);
    hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Food_pallet", probe_position, REQUEST_PROBE_CREATE2);
    hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Food_pallet", probe_position, REQUEST_PROBE_CREATE3);
    hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Food_pallet", probe_position, REQUEST_PROBE_CREATE4);
    hr = SimConnect_AICreateSimulatedObject(hSimConnect, "Food_pallet", probe_position, REQUEST_PROBE_CREATE5);
    
}

// calc_profile_latlongs() populates profile[i].lat/long for each element of profile

void calc_profile_latlongs() {
	double distance, bearing; // meters, degrees
	//debug calc wind bearing here
	// wind_bearing = wind_bearing + 10.0; // test rotation on each call
    profile[0].latitude = user_pos.latitude;
    profile[0].longitude = user_pos.longitude;
    for (int i=1; i<PROFILE_COUNT; i++) {
		distance = profile_distance[i];
		bearing = wind_direction + profile_bearing[i];
		MoveStruct p = distance_and_bearing(user_pos.latitude, user_pos.longitude, distance, bearing);
		profile[i].latitude = p.latitude;
		profile[i].longitude = p.longitude;
	}
}

void get_user_pos()
{
    HRESULT hr;
    //printf("\nCalling get_user_pos()");

    // set data request
    hr = SimConnect_RequestDataOnSimObjectType(hSimConnect, 
                                            REQUEST_USER_POS, 
                                            DEFINITION_USER_POS, 
                                            0,  // radius = 0 => user aircraft
                                            SIMCONNECT_SIMOBJECT_TYPE_USER); 
    //printf("\nLeaving get_user_pos()");
}

void get_probes_pos()
{
	HRESULT hr;
	// request the probe data for all probes
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS1,DEFINITION_PROBE_POS,probe_id[1],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS2,DEFINITION_PROBE_POS,probe_id[2],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS3,DEFINITION_PROBE_POS,probe_id[3],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS4,DEFINITION_PROBE_POS,probe_id[4],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS5,DEFINITION_PROBE_POS,probe_id[5],SIMCONNECT_PERIOD_ONCE); 
}

// get_profile() gets ground_elevation sample 0 (user aircraft) and triggers next sample
void get_profile()
{
    //printf("\nCalling get_profile()");
    HRESULT hr;
    MoveStruct move_pos;

    calc_profile_latlongs();
    profile[0].ground_elevation = user_pos.ground_elevation;

    // move the probes to the sample points
	for (int i=1; i<PROFILE_COUNT; i++) {
		profile_valid[i] = false;
		// initialise move position to lat/long of user aircraft
	    move_pos.latitude = profile[i].latitude;
		move_pos.longitude = profile[i].longitude;
		// now set data on probe[i]
		hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_MOVE, probe_id[i], 0, 0, sizeof(move_pos), &move_pos);
	}

	// calling get_user_pos() triggers the sequence that gets all the probe elevations
	get_user_pos();

    //printf("\nLeaving get_profile()");
}

// get_probe(i) gets ground_elevation sample i and triggers next sample
//void get_probe(int i)
//{
//    if (i>=PROFILE_COUNT) {
//        return;
//    }
//
//    HRESULT hr;
//    MoveStruct move_pos;
//    DATA_REQUEST_ID request_id;
//
//    if (i==1) request_id = REQUEST_PROBE_POS1;
//    else if (i==2) request_id = REQUEST_PROBE_POS2;
//    else if (i==3) request_id = REQUEST_PROBE_POS3;
//    else if (i==4) request_id = REQUEST_PROBE_POS4;
//    else request_id = REQUEST_PROBE_POS5;
//
//    // initialise move position to lat/long of user aircraft
//    move_pos.latitude = profile[i].latitude;
//    move_pos.longitude = profile[i].longitude;
//
//    // move the probe to the sample point 1 lat/long
//    hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_MOVE, ProbeID, 0, 0, sizeof(move_pos), &move_pos);
//
//    // request the probe data for sample point 1
//   hr = SimConnect_RequestDataOnSimObject(hSimConnect, 
//                                            request_id, 
//                                            DEFINITION_PROBE_POS, 
//                                            ProbeID, 
//                                            SIMCONNECT_PERIOD_ONCE); 
//}

void get_user_pos_and_profile()
{
    HRESULT hr;
    //printf("\nCalling get_user_pos_and_profile()");

    // set data request
    hr = SimConnect_RequestDataOnSimObject(hSimConnect, 
                                            REQUEST_USER_POS_AND_PROFILE, 
                                            DEFINITION_USER_POS, 
                                            SIMCONNECT_OBJECT_ID_USER,
                                            SIMCONNECT_PERIOD_SECOND); 
    //printf("\nLeaving get_user_pos_and_profile()");
}

//void get_user_pos2()
//{
//  HRESULT hr;
//  printf("\nCalling get_user_pos2()");
//
//  // set data request
//    hr = SimConnect_RequestDataOnSimObjectType(hSimConnect, REQUEST_1, DEFINITION_1, 0, SIMCONNECT_SIMOBJECT_TYPE_USER);
//  printf("\nLeaving get_user_pos2()");
//}

//**********************************************************************************
//**********************************************************************************
// HERE is where we process ground elevations that have been returned
//**********************************************************************************
//**********************************************************************************

void process_profile() {
	bool ready = true;
	for (int i=1; i<PROFILE_COUNT; i++) {
		if (!profile_valid[i]) {
			ready = false;
			break;
		}
	}
	if (ready) {
		// only process ground elevations if we have them all
		// i.e. profile_valid[i]=true for all
		// otherwise do nothing
		printf("\n(Wind: %.0f m/s @ %.0f) ",wind_velocity, wind_direction);
		printf("Probes: %.0f m",user_pos.ground_elevation);
		for (int i=1; i<PROFILE_COUNT; i++) {
			printf(", %.0f m",profile[i].ground_elevation);
		}
	}
}


void CALLBACK MyDispatchProcSO(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{   
    HRESULT hr;
    //printf("\nIn dispatch proc");

    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_SIM_START:

					printf("\nGot EVENT_SIM_START");
                    // Sim has started so turn the input events on
                    hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_ON);

					// create probes
					create_probes();

					// request user pos at 1-second intervals
					get_user_pos_and_profile();

                    break;

//                case EVENT_Z: // can also create 
//                    if (!objectsCreated)
//                    {
//                        create_probes();
//                        objectsCreated = true;
//                    }
//                    break;

//                case EVENT_X:
//                    if (objectsCreated)
//                    {
//                        get_user_pos_and_profile();
//                    }
//                    break;
                
//              case EVENT_C:
//                  if (objectsCreated)
//                  {
//                      get_probe_pos();
//                  }
//                  break;
                
//				case EVENT_C:
//					get_user_pos();
//					break;
                
//              case EVENT_B:
//                  get_user_pos2();
//                  break;
                
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
            
            case REQUEST_PROBE_CREATE1:
				{
					probe_id[1] = pObjData->dwObjectID;
					//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[1], REQUEST_PROBE_RELEASE);
					printf("\nCreated probe 1, id = %d", probe_id[1]);
					break;
				}
            
            case REQUEST_PROBE_CREATE2:
				{
					probe_id[2] = pObjData->dwObjectID;
					//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[2], REQUEST_PROBE_RELEASE);
					printf("\nCreated probe 2, id = %d", probe_id[2]);
					break;
				}
            
            case REQUEST_PROBE_CREATE3:
				{
					probe_id[3] = pObjData->dwObjectID;
					//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[3], REQUEST_PROBE_RELEASE);
					printf("\nCreated probe 3, id = %d", probe_id[3]);
					break;
				}
            
            case REQUEST_PROBE_CREATE4:
				{
					probe_id[4] = pObjData->dwObjectID;
					//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[4], REQUEST_PROBE_RELEASE);
					printf("\nCreated probe 4, id = %d", probe_id[4]);
					break;
				}
            
            case REQUEST_PROBE_CREATE5:
				{
					probe_id[5] = pObjData->dwObjectID;
					//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[5], REQUEST_PROBE_RELEASE);
					printf("\nCreated probe 5, id = %d", probe_id[5]);
					break;
				}
            
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

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*) pData;

            switch(pObjData->dwRequestID)
            {
                case REQUEST_USER_POS_AND_PROFILE:
                {
                    DWORD ObjectID = pObjData->dwObjectID;
                    UserStruct *pU = (UserStruct*)&pObjData->dwData;
					user_pos.altitude = pU->altitude;
					user_pos.ground_elevation = pU->ground_elevation;
					user_pos.latitude = pU->latitude;
					user_pos.longitude = pU->longitude;
					wind_direction = pU->wind_direction;
					wind_velocity = pU->wind_velocity;
                    //printf("\nUser/Probe0 alt = %f, ground = %f, Lat=%f, Long=%f", 
                    //       user_pos.altitude, 
                    //       user_pos.ground_elevation, 
                    //       user_pos.latitude,
                    //       user_pos.longitude
                    //       );
                    get_profile(); // get_profile() will REQUEST_USER_POS
                    break;
                }

				case REQUEST_PROBE_POS1:
                    {
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[1].ground_elevation = pS->ground_elevation;
					profile_valid[1] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS2:
                    {
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[2].ground_elevation = pS->ground_elevation;
					profile_valid[2] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS3:
                    {
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[3].ground_elevation = pS->ground_elevation;
					profile_valid[3] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS4:
                    {
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[4].ground_elevation = pS->ground_elevation;
					profile_valid[4] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS5:
                    {
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[5].ground_elevation = pS->ground_elevation;
					profile_valid[5] = true;
					process_profile();
                    break;
                    }

                default:
                    break;

            }
            break;
        }

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE*)pData;
            
            switch(pObjData->dwRequestID)
            {
//                case REQUEST_1:
//                {
//                    DWORD ObjectID = pObjData->dwObjectID;
//                    Struct1 *pS = (Struct1*)&pObjData->dwData;
//                    //if (SUCCEEDED(StringCbLengthA(&pS->title[0], sizeof(pS->title), NULL))) // security check
//                    //{
//                        //printf("\nObjectID=%d  Title=\"%s\"\nLat=%f  Lon=%f  Alt=%f  Kohlsman=%.2f", ObjectID, pS->title, pS->latitude, pS->longitude, pS->altitude, pS->kohlsmann );
//                        printf("\nLat=%f", pS->latitude);
//                    //} 
//                    break;
//                }

				// NOTE: REQUEST_USER_POS WILL THEN CALL get_probes_pos()
                case REQUEST_USER_POS:
                {
                    DWORD ObjectID = pObjData->dwObjectID;
                    UserStruct *pU = (UserStruct*)&pObjData->dwData;

                    //printf("\nUser alt = %f, ground = %f, Lat=%f, Long=%f", 
                    //       pU->altitude, 
                    //       pU->ground_elevation, 
                    //       pU->latitude,
                    //       pU->longitude
                    //       );
					get_probes_pos();
                    break;
                }

                default:
                   break;
            }
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

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "b21_sim_probe", NULL, 0, 0, 0)))
    {
        printf("\nsim_probe Connected to Flight Simulator!");   
          
        // Create some private events
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_Z);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_X);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_C);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_V);
//        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_B);


        // Link the private events to keyboard keys, and ensure the input events are off
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "Z", EVENT_Z);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "X", EVENT_X);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "C", EVENT_C);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "V", EVENT_V);
//        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "B", EVENT_B);

        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_OFF);

        // Sign up for notifications
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_Z);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_X);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_C);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_V);
//        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_B);

        // Set up a definition for probe altitude
        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_PROBE_POS,
                                            "GROUND ALTITUDE", 
                                            "meters");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_PROBE_POS,
                                            "Plane Latitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_PROBE_POS,
                                            "Plane Longitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_MOVE, 
                                            "Plane Latitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_MOVE, 
                                            "Plane Longitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_USER_POS,
                                            "Plane Latitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_USER_POS,
                                            "Plane Longitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_USER_POS,
                                            "PLANE ALTITUDE", 
                                            "meters");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_USER_POS,
                                            "GROUND ALTITUDE", 
                                            "meters");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_USER_POS,
                                            "AMBIENT WIND VELOCITY", 
                                            "m/s");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_USER_POS,
                                            "AMBIENT WIND DIRECTION", 
                                            "degrees");


        // Set up the data definition, but do not yet do anything with it
        //hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Title", NULL, SIMCONNECT_DATATYPE_STRING256);
        //hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Ground Altitude", "meters");
        //hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Plane Altitude", "feet");
  //      hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Plane Latitude", "degrees");
        //hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Plane Longitude", "degrees");


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