//------------------------------------------------------------------------------
//
//  SimConnect probe ground elevation around user aircraft
//  
//  Description:
//              creates five probes and displays their ground altitude each second
//              Written by Ian Forster-Lewis www.forsterlewis.com
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>
#include <math.h>

#include "SimConnect.h"

// sim_probe version (sent in client data)
double version = 1.45;

// 'debug' parameters from command line that control various levels of diagnostic output
bool debug_default = true; // default 'debug' level - prints out startup, lift, errors
bool debug = false; // prints out lift factors as sim_probe runs
bool debug_calls = false; // greater level of debug - procedure calls
bool debug_events = false; // greater level of debug - events

// 'heartbeat' is the 'system ok' flag that is tested every 4 seconds from the EVENT_4S_TIMER event
bool heartbeat = true;

// profile_count is the number of samples in the profile
const int PROFILE_COUNT = 5;

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum EVENT_ID {
    EVENT_SIM_START,
	EVENT_OBJECT_REMOVED,
	EVENT_4S_TIMER,
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
    //REQUEST_PROBE_CREATE5,
    REQUEST_PROBE_REMOVE1,
    REQUEST_PROBE_REMOVE2,
    REQUEST_PROBE_REMOVE3,
    REQUEST_PROBE_REMOVE4,
    //REQUEST_PROBE_REMOVE5,
    REQUEST_PROBE_RELEASE,
    REQUEST_PROBE_POS1,
    REQUEST_PROBE_POS2,
    REQUEST_PROBE_POS3,
    REQUEST_PROBE_POS4,
    //REQUEST_PROBE_POS5,
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
    DEFINITION_USER_POS,
	DEFINITION_SIMLIFT // struct for lift value in client data area
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
	double altitude;
};

//*******************************************************************************
// client data definitions

const char* SIMLIFT_NAME = "b21_sim_probe";

SIMCONNECT_CLIENT_DATA_ID SIMLIFT_ID = 4179368;

// structure for lift value client data
struct SimLift {
	double lift;
	int status; // 0 = ok, 1 = problem, others = reserved
	double version;
};

SimLift sim_lift = {0.0, 0, version}; // variable to hold the lift client data

// end of client data definitions
//*******************************************************************************

// create var to hold user plane position
UserStruct user_pos;

// wind direction
double wind_direction = 0.0;
double wind_velocity = 0.0;

int cycle_count = 0; // modulo 4 counter for rotating symbols on console output
const char *cycle_char = "|/-\\"; // these are the characters cycled through

//*******************************************************************************
//*******************************************************************************
// PROBE DATA

char *probe_model="SimProbe";

// profile[] is the array of samples of ground elevation (in meters), each set by move_probe(i)
ProbeStruct profile[PROFILE_COUNT];

DWORD   probe_id[PROFILE_COUNT];            // object id of probe[i]

// flag to confirm elevation received for probe[i] - set to 'true' as each
// ground elevation request comes in
bool	profile_valid[PROFILE_COUNT] = {false}; 

// flag to confirm probe[i] created - set to 'true' as each
// creation request comes back
bool	probe_created[PROFILE_COUNT] = {false}; 

// profile_distance is the array of sample distances (in meters) upwind of the user aircraft
double profile_distance[PROFILE_COUNT] = {0.0, 250.0, 750.0, 2000.0, -100.0 }; //, 5000.0};
// profile_bearing is the degrees offset relative to wind to apply to the bearing of the probe
double profile_bearing[PROFILE_COUNT] = {0.0, 0.0, 0.0, 0.0, 0.0}; //, 0.0};

// Struct for probe initial position use when created. (testing: set for Seatac)
SIMCONNECT_DATA_INITPOSITION probe_position;

// flag to suppress PROBE ID exceptions (missing probe errors) while probes are re-created

bool suppress_object_id_exceptions = false;

// END OF PROBE DATA
//*******************************************************************************
//*******************************************************************************

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
//**********************************************************************************
//******* NOW WE HAVE THE LIFT CALCULATION FORMULA

double agl_factor(double user_alt, double ground_elevation) {
	// agl_factor (0..1) is the multiple to apply to base lift to take into
	// account the user altitude AGL, i.e. the lift drops off with height AGL
	// agl_factor is linear from zero to BOUNDARY1 (40 meters)
	// agl_factor is 1 from BOUNDARY1 to BOUNDARY2 (80 meters)
	// agl_factor decays exponentially from BOUNDARY2 upwards
	const double ZERO_FACTOR = 0.5; // agl_factor at zero meters AGL
	const double BOUNDARY1 = 40.0; // agl altitude (meters) where agl_factor=1
	const double BOUNDARY2 = 130.0; // agl altitude (meters) where agl_factor=1

	double agl_alt = max(user_alt - ground_elevation,0.0);

	if (agl_alt<BOUNDARY1) { return ZERO_FACTOR + (1-ZERO_FACTOR)*agl_alt/BOUNDARY1; }
	else if (agl_alt<BOUNDARY2) { return 1.0; }
	return exp(-(2+2*ground_elevation/4000)*(agl_alt-BOUNDARY2)/max(ground_elevation, 200));
}

double adj_slope(double slope) {
	double s = sin(atan(5.0 * pow(fabs(slope),1.7)));
	if (slope<0) { s = -s;}
	return s;
}

double ridge_lift() {
	if (debug_calls) printf(" ..entering ridge_lift()..");
	// we have the probe values in ProbeStruct profile[PROFILE_COUNT];
	// i.e. ground elevation at probe[i] is profile[i].ground_elevation
	//
	// probe[i] horizontal distance from user aircraft is profile_distance[i]
	//
	// horizontal wind speed is wind_velocity
	double slope[PROFILE_COUNT-1];
	double factor[PROFILE_COUNT-1];
	// after the factors for each slope are calculated, multiply each by a weighting:
	double weight[PROFILE_COUNT-1] = {0.2, 0.2, 0.5, 0.2};
	// first set slope[i] to real slope from probe[i] to probe[i+1]
	// (+ve slope => +ve lift)
	// the last probe will have slope calculated to user aircraft ground
	slope[0]= (profile[0].ground_elevation - profile[1].ground_elevation)/profile_distance[1];
	slope[1]= (profile[1].ground_elevation - profile[2].ground_elevation)/(profile_distance[2]-profile_distance[1]);
	slope[2]= (profile[2].ground_elevation - profile[3].ground_elevation)/(profile_distance[3]-profile_distance[2]);
	// the last probe will have slope calculated to user aircraft ground
	// and profile_distance will be negative
	slope[3]= (profile[4].ground_elevation - profile[0].ground_elevation)/(-profile_distance[4]);

	// now update factors to normalise between -1 and 1
	factor[0] = adj_slope(slope[0]) * weight[0];

	factor[1] = adj_slope(slope[1]) * weight[1];

	factor[2] = 0.0; // factor[2] (upwind distance) is always 0 or negative
	if (slope[2]<0.0) factor[2] = adj_slope(slope[2]) * weight[2];

	factor[3] = 0.0; // factor[3] (back slope) cannot reduce positive slope[0]
	if (slope[3]>0.0 || slope[0]<0.0) factor[3] = adj_slope(slope[3]) * weight[3];

	double aircraft_agl_factor = agl_factor(user_pos.altitude, user_pos.ground_elevation);

	//debug
	if (debug) {
		printf("\n agl_factor = ,%.3f, Factors ,%.3f,%.3f,%.3f,%.3f,",aircraft_agl_factor,factor[0],factor[1],factor[2],factor[3]);
	}
	if (debug_calls) printf(" ..leaving ridge_lift()..\n");
	return wind_velocity * (factor[0] + factor[1] + factor[2] + factor[3])  * aircraft_agl_factor;
}

//*********************************************************************************************

void remove_probes()
{
    if (debug_calls) printf("\n..entering remove_probes()..");
    HRESULT hr;
	if (probe_created[1]) {
		probe_created[1] = false;
		hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[1], REQUEST_PROBE_REMOVE1);
	}
	if (probe_created[2]) {
		probe_created[2] = false;
		hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[2], REQUEST_PROBE_REMOVE2);
	}
	if (probe_created[3]) {
		probe_created[3] = false;
		hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[3], REQUEST_PROBE_REMOVE3);
	}
	if (probe_created[4]) {
		probe_created[4] = false;
		hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[4], REQUEST_PROBE_REMOVE4);
	}
//	if (probe_created[5]) {
//		probe_created[5] = false;
//		hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[5], REQUEST_PROBE_REMOVE5);
//	}
    if (debug_calls) printf("\n..leaving remove_probes()..");
    
}

void create_probes()
{
    if (debug_calls) printf("\n..entering create_probes()..");
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

	// reset probe_created flag to false for each probe, will set to true when request returns
	// for (int i=1; i<PROFILE_COUNT; i++) probe_created[i] = false;

	// now create probes
    if (!probe_created[1]) hr = SimConnect_AICreateSimulatedObject(hSimConnect, probe_model, probe_position, REQUEST_PROBE_CREATE1);
    if (!probe_created[2]) hr = SimConnect_AICreateSimulatedObject(hSimConnect, probe_model, probe_position, REQUEST_PROBE_CREATE2);
    if (!probe_created[3]) hr = SimConnect_AICreateSimulatedObject(hSimConnect, probe_model, probe_position, REQUEST_PROBE_CREATE3);
    if (!probe_created[4]) hr = SimConnect_AICreateSimulatedObject(hSimConnect, probe_model, probe_position, REQUEST_PROBE_CREATE4);
    //hr = SimConnect_AICreateSimulatedObject(hSimConnect, probe_model, probe_position, REQUEST_PROBE_CREATE5);
    if (debug_calls) printf("\n..leaving create_probes()..");
    
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
    if (debug_calls) printf(" ..entering get_user_pos()..");

    // set data request
    hr = SimConnect_RequestDataOnSimObjectType(hSimConnect, 
                                            REQUEST_USER_POS, 
                                            DEFINITION_USER_POS, 
                                            0,  // radius = 0 => user aircraft
                                            SIMCONNECT_SIMOBJECT_TYPE_USER); 
    if (debug_calls) printf(" ..leaving get_user_pos()..");
}

void get_probes_pos()
{
	HRESULT hr;
	// request the probe data for all probes
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS1,DEFINITION_PROBE_POS,probe_id[1],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS2,DEFINITION_PROBE_POS,probe_id[2],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS3,DEFINITION_PROBE_POS,probe_id[3],SIMCONNECT_PERIOD_ONCE); 
    hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS4,DEFINITION_PROBE_POS,probe_id[4],SIMCONNECT_PERIOD_ONCE); 
    //hr = SimConnect_RequestDataOnSimObject(hSimConnect,REQUEST_PROBE_POS5,DEFINITION_PROBE_POS,probe_id[5],SIMCONNECT_PERIOD_ONCE); 
}

// get_profile() gets ground_elevation sample 0 (user aircraft) and triggers next sample
void get_profile()
{
    if (debug_calls) printf("\n..entering get_profile()..");
    HRESULT hr;
    MoveStruct move_pos;

    calc_profile_latlongs();
    profile[0].ground_elevation = user_pos.ground_elevation;

    // move the probes to the sample points
	for (int i=1; i<PROFILE_COUNT; i++) {
		profile_valid[i] = false;
		// initialise move position to lat/long of user aircraft
		move_pos.altitude = 0;
	    move_pos.latitude = profile[i].latitude;
		move_pos.longitude = profile[i].longitude;
		// now set data on probe[i]
		hr = SimConnect_SetDataOnSimObject(hSimConnect, DEFINITION_MOVE, probe_id[i], 0, 0, sizeof(move_pos), &move_pos);
	}

	// calling get_user_pos() triggers the sequence that gets all the probe elevations
	get_user_pos();

    if (debug_calls) printf(" ..leaving get_profile().. \n");
}


void get_user_pos_and_profile()
{
    if (debug_calls) printf("\n..entering get_user_pos_and_profile()..");
    HRESULT hr;

    // set data request
    hr = SimConnect_RequestDataOnSimObject(hSimConnect, 
                                            REQUEST_USER_POS_AND_PROFILE, 
                                            DEFINITION_USER_POS, 
                                            SIMCONNECT_OBJECT_ID_USER,
                                            SIMCONNECT_PERIOD_SECOND); 
    if (debug_calls) printf("\n..leaving get_user_pos_and_profile()..");
}

//**********************************************************************************
// this routine is called each time a REQUEST_PROBE_CREATE message arrives
// but only does anything if all probe_created[1..4] are true
void process_probe_creates() {
	bool ready = true;
	for (int i=1; i<PROFILE_COUNT; i++) {
		if (!probe_created[i]) {
			ready = false;
			break;
		}
	}
	if (ready) {
		// only continue with processing if all probes created
		// Now request user pos at 1-second intervals
		get_user_pos_and_profile();
	}
}

//**********************************************************************************
// this routine is called each time a REQUEST_PROBE_REMOVE message arrives
// but only does anything if all probe_created[1..4] are false

//void process_probe_removes() {
//	bool ready = true;
//	for (int i=1; i<PROFILE_COUNT; i++) {
//		if (probe_created[i]) {
//			ready = false;
//			break;
//		}
//	}
//	if (ready) {
//		// only continue with processing if all probes removed
//		// Now request user pos at 1-second intervals
//		create_probes();
//	}
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
		if (debug_calls) printf("\n\n..in process_profile() (all profiles valid)..");
		// only process ground elevations if we have them all
		// i.e. profile_valid[i]=true for all
		// otherwise do nothing

		// We're ok, so reset the heartbeat
		heartbeat = true;
		// just in case we previously suppressed object id exceptions
		// getting back to here confirms we're ok again, so reset
		if (suppress_object_id_exceptions) {
			if (debug) printf("\nResetting suppress_object_id_exceptions to false.\n");
			suppress_object_id_exceptions = false;
		}
		// write lift to client data area
		sim_lift.lift = ridge_lift();
		sim_lift.status = 0;
		sim_lift.version = version;
		HRESULT hr = SimConnect_SetClientData(hSimConnect,
												SIMLIFT_ID,
												DEFINITION_SIMLIFT,
												SIMCONNECT_DATA_SET_FLAG_DEFAULT,
												0, // reserved
												sizeof(sim_lift),
												&sim_lift);
		// debug
		if (debug_default) {
			printf("\n%c Ridge Lift = %+.2f",cycle_char[cycle_count],sim_lift.lift);
			cycle_count = (cycle_count+1) % strlen(cycle_char);
		}
		if (debug) {
			printf(",[Lift = ,%.2f,]",sim_lift.lift);
			printf(" (Wind: %.1f m/s @ %.0f) ",wind_velocity, wind_direction);
			printf("Probes: ,%.0f",user_pos.ground_elevation);
			for (int i=1; i<PROFILE_COUNT; i++) {
				printf(",%.0f",profile[i].ground_elevation);
			}
		}
		if (debug_calls) printf(" ..leaving process_profile()..\n");
	}
}

//**********************************************************************************************
// this is the routine that checks the 'heartbeat' boolean which is set to true each time
// ridge lift is successfully calculated.  If the routine finds it false, it recreates the
// probes to kick sim_probe back into life
void test_heartbeat() {
	if (heartbeat) {
		// sim_probe ok, so just reset heartbeat and return
		heartbeat = false;
		return;
	}
	// heartbeat is FALSE here, so we have a problem
	if (debug_default || debug) printf("\nHeartbeat lost - recreating probes...\n");
	suppress_object_id_exceptions = true;
	remove_probes();
	create_probes();
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
					if (debug_events) printf(" [EVENT_SIM_START] ");
                    // Sim has started so turn the input events on
                    hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_ON);

					// create probes
					create_probes();

                    break;

                case EVENT_4S_TIMER:
					if (debug_events) printf(" [EVENT_4S_TIMER] ");
					test_heartbeat();
                    break;

                case EVENT_Z: // keystroke Z
                    if (debug) printf("\n[EVENT_Z] - breaking probe[1..4] ...\n");
					hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[1], REQUEST_PROBE_REMOVE1);
					hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[2], REQUEST_PROBE_REMOVE2);
					hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[3], REQUEST_PROBE_REMOVE3);
					hr = SimConnect_AIRemoveObject(hSimConnect, probe_id[4], REQUEST_PROBE_REMOVE4);
					//probe_id[2] = 996633;
                    break;

                case EVENT_X: // keystroke X
                    //if (debug) printf("\n[EVENT_X] - removing probes ...\n");
					//remove_probes();
					//create_probes();
                    break;
                
                default:
                    if (debug_events) printf("\nUnknown event: %d", evt->uEventID);
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
						if (debug_events) printf(" [REQUEST_PROBE_CREATE1] ");
						probe_id[1] = pObjData->dwObjectID;
						//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[1], REQUEST_PROBE_RELEASE);
						if (debug_default || debug) printf("\nCreated probe 1, id = %d", probe_id[1]);
						probe_created[1] = true;
						process_probe_creates();
						break;
					}
	            
				case REQUEST_PROBE_CREATE2:
					{
						if (debug_events) printf(" [REQUEST_PROBE_CREATE2] ");
						probe_id[2] = pObjData->dwObjectID;
						//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[2], REQUEST_PROBE_RELEASE);
						if (debug_default || debug) printf("\nCreated probe 2, id = %d", probe_id[2]);
						probe_created[2] = true;
						process_probe_creates();
						break;
					}
	            
				case REQUEST_PROBE_CREATE3:
					{
						if (debug_events) printf(" [REQUEST_PROBE_CREATE3] ");
						probe_id[3] = pObjData->dwObjectID;
						//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[3], REQUEST_PROBE_RELEASE);
						if (debug_default || debug) printf("\nCreated probe 3, id = %d", probe_id[3]);
						probe_created[3] = true;
						process_probe_creates();
						break;
					}
	            
				case REQUEST_PROBE_CREATE4:
					{
						if (debug_events) printf(" [REQUEST_PROBE_CREATE4] ");
						probe_id[4] = pObjData->dwObjectID;
						//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[4], REQUEST_PROBE_RELEASE);
						if (debug_default || debug) printf("\nCreated probe 4, id = %d", probe_id[4]);
						probe_created[4] = true;
						process_probe_creates();
						break;
					}
	            
	//            case REQUEST_PROBE_CREATE5:
	//				{
	//					probe_id[5] = pObjData->dwObjectID;
	//					//HRESULT hr = SimConnect_AIReleaseControl(hSimConnect, probe_id[5], REQUEST_PROBE_RELEASE);
	//					printf("\nCreated probe 5, id = %d", probe_id[5]);
	//					probe_created[5] = true;
	//					process_probe_creates();
	//					break;
	//				}
	            
				default:
					if (debug_default || debug_events) printf("\nUnknown creation %d", pObjData->dwRequestID);
					break;

            }
            break;
        }

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*) pData;

            switch(pObjData->dwRequestID)
            {
                case REQUEST_USER_POS_AND_PROFILE:
                {
					if (debug_events) printf(" [REQUEST_USER_POS_AND_PROFILE] ");
                    DWORD ObjectID = pObjData->dwObjectID;
                    UserStruct *pU = (UserStruct*)&pObjData->dwData;
					user_pos.altitude = pU->altitude;
					user_pos.ground_elevation = pU->ground_elevation;
					user_pos.latitude = pU->latitude;
					user_pos.longitude = pU->longitude;
					wind_direction = pU->wind_direction;
					wind_velocity = pU->wind_velocity;
                    get_profile(); // get_profile() will REQUEST_USER_POS
                    break;
                }

				case REQUEST_PROBE_POS1:
                    {
					if (debug_events) printf(" [REQUEST_PROBE_POS1] ");
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[1].ground_elevation = pS->ground_elevation;
					profile_valid[1] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS2:
                    {
					if (debug_events) printf(" [REQUEST_PROBE_POS2] ");
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[2].ground_elevation = pS->ground_elevation;
					profile_valid[2] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS3:
                    {
					if (debug_events) printf(" [REQUEST_PROBE_POS3] ");
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[3].ground_elevation = pS->ground_elevation;
					profile_valid[3] = true;
					process_profile();
                    break;
                    }

                case REQUEST_PROBE_POS4:
                    {
					if (debug_events) printf(" [REQUEST_PROBE_POS4] ");
                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
                    profile[4].ground_elevation = pS->ground_elevation;
					profile_valid[4] = true;
					process_profile();
                    break;
                    }

//                case REQUEST_PROBE_POS5:
//                    {
//                    ProbeStruct *pS = (ProbeStruct*)&pObjData->dwData;
//                    profile[5].ground_elevation = pS->ground_elevation;
//					profile_valid[5] = true;
//					process_profile();
//                    break;
//                    }

                default:
					if (debug_default || debug_events) printf("\nUnknown SIMCONNECT_RECV_ID_SIMOBJECT_DATA request %d", pObjData->dwRequestID);
                    break;

            }
            break;
        }

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE*)pData;
            
            switch(pObjData->dwRequestID)
            {

				// NOTE: REQUEST_USER_POS WILL THEN CALL get_probes_pos()
                case REQUEST_USER_POS:
                {
					if (debug_events) printf(" [REQUEST_USER_POS] ");
                    DWORD ObjectID = pObjData->dwObjectID;
                    UserStruct *pU = (UserStruct*)&pObjData->dwData;
					get_probes_pos();
                    break;
                }

                default:
					if (debug_default || debug_events) printf("\nUnknown SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE request %d", pObjData->dwRequestID);
					break;
            }
            break;
        }

		case SIMCONNECT_RECV_ID_EVENT_OBJECT_ADDREMOVE:
        {
            SIMCONNECT_RECV_EVENT_OBJECT_ADDREMOVE *evt = (SIMCONNECT_RECV_EVENT_OBJECT_ADDREMOVE*)pData;
            
            switch(evt->uEventID)
            {
                case EVENT_OBJECT_REMOVED:
					for (int i=1; i<PROFILE_COUNT; i++) {
						if (evt->dwData == probe_id[i]) {
							if (debug_events) printf("[EVENT_OBJECT_REMOVED probe[%d] ]\n", i);
							probe_created[i] = false;
							break;
						}
					}
                    break;

                //case EVENT_REMOVED_AIRCRAFT:
                //    printf("\nAI object removed: Type=%d, ObjectID=%d", evt->eObjType, evt->dwData);
                //    break;
				default:
					if (debug_default || debug_events) printf("\n\n*Unrecognized SIMCONNECT_RECV_ID_EVENT_OBJECT_ADDREMOVE Type=%d, ObjectID=%d", evt->eObjType, evt->dwData);
					break;

            }
            break;
        }


        case SIMCONNECT_RECV_ID_EXCEPTION:
        {
            SIMCONNECT_RECV_EXCEPTION *except = (SIMCONNECT_RECV_EXCEPTION*)pData;
			switch(except->dwException)
			{
				case SIMCONNECT_EXCEPTION_UNRECOGNIZED_ID:
					{
						if (debug) printf("\nSIMCONNECT_EXCEPTION_UNRECOGNIZED_ID: FSX has lost a probe? (suppressed=%d)\n", suppress_object_id_exceptions);
						if (!suppress_object_id_exceptions) {
							if (debug_default) printf("\nFSX has lost a probe? ..recreating\n");
							suppress_object_id_exceptions = true;
							remove_probes();
							create_probes();
						}
						break;
					}

				case SIMCONNECT_EXCEPTION_CREATE_OBJECT_FAILED:
					{
						if (debug_default || debug) printf("\nCouldn't create AI probe %s, falling back to Food_pallet", probe_model);
						probe_model = "Food_pallet";
						break;
					}

				default:
					if (debug_default || debug_events) printf("\n\n***** EXCEPTION=%d  SendID=%d  Index=%d  cbData=%d\n", except->dwException, except->dwSendID, except->dwIndex, cbData);
					break;
			}
            break;
        }

        case SIMCONNECT_RECV_ID_OPEN:
        {
            SIMCONNECT_RECV_OPEN *open = (SIMCONNECT_RECV_OPEN*)pData;
			if (debug_events) printf("\nConnected to FSX Version %d.%d", open->dwApplicationVersionMajor, open->dwApplicationVersionMinor);
            break;
        }

        case SIMCONNECT_RECV_ID_QUIT:
        {
            quit = 1;
            break;
        }

        default:
            if (debug_default || debug) printf("\nUnrecognized RECV_ID Received:%d",pData->dwID);
            break;
    }
}

void connectToSim()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "sim_probe", NULL, 0, 0, 0)))
    {
        if (debug_default || debug) printf("\nsim_probe (Version %.2f) Connected to Flight Simulator!\n", version);   
          
        // Create some private events
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_Z);
        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_X);
        //hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_C);
        //hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_V);
//        hr = SimConnect_MapClientEventToSimEvent(hSimConnect, EVENT_B);


        // Link the private events to keyboard keys, and ensure the input events are off
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "Z", EVENT_Z);
        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "X", EVENT_X);
        //hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "C", EVENT_C);
        //hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "V", EVENT_V);
//        hr = SimConnect_MapInputEventToClientEvent(hSimConnect, INPUT_ZX, "B", EVENT_B);

        hr = SimConnect_SetInputGroupState(hSimConnect, INPUT_ZX, SIMCONNECT_STATE_OFF);

        // Sign up for notifications
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_Z);
        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_X);
        //hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_C);
        //hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_V);
//        hr = SimConnect_AddClientEventToNotificationGroup(hSimConnect, GROUP_ZX, EVENT_B);

        // DEFINITION_PROBE_POS for probe position
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

        // DEFINITION_MOVE - a lat/long pair to move the probe
		hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_MOVE, 
                                            "Plane Latitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_MOVE, 
                                            "Plane Longitude", 
                                            "degrees");

        hr = SimConnect_AddToDataDefinition(hSimConnect, 
                                            DEFINITION_MOVE, 
                                            "Plane Altitude", 
                                            "meters");

		// DEFINITION_USER_POS - Lat/Long/Alt/Ground elev/wind
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


		// SimLift client data definition
		hr = SimConnect_AddToClientDataDefinition(hSimConnect,
											DEFINITION_SIMLIFT,
											SIMCONNECT_CLIENTDATAOFFSET_AUTO,
											sizeof(sim_lift));
												
		// map the SimLift id
		hr = SimConnect_MapClientDataNameToID(hSimConnect, SIMLIFT_NAME, SIMLIFT_ID);

		// create reserved client data area
		hr = SimConnect_CreateClientData(hSimConnect,
											SIMLIFT_ID,
											sizeof(sim_lift),
											SIMCONNECT_CREATE_CLIENT_DATA_FLAG_READ_ONLY);

        // Listen for a simulation start event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

        // Listen for an event saying an AI object has been removed
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_OBJECT_REMOVED, "ObjectRemoved");

        // Subscribe to the repeating 4-second timer event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_4S_TIMER, "4sec");

        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcSO, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}


//int __cdecl _tmain(int argc, _TCHAR* argv[])
int main(int argc, char* argv[])
{
	// set up command line arguments (debug mode)
	for (int i=2; i<=argc; i++) {
		if (strcmp(argv[i-1],"debug")==0) {
			debug = true;
			debug_default = false;
		}
		else if (strcmp(argv[i-1],"calls")==0) debug_calls = true;
		else if (strcmp(argv[i-1],"events")==0) debug_events = true;
		else if (strcmp(argv[i-1],"model=")==0 && i<argc) probe_model = argv[i];
	}
	if (debug) {
		printf("Starting sim_probe version %.2f in debug mode\n", version, argc-1);
	}
	if (debug || ( debug_default && (strcmp(probe_model,"SimProbe")!=0))) {
		printf("The probe AI Object model is %s\n",probe_model);
	}
    connectToSim();
    return 0;
}