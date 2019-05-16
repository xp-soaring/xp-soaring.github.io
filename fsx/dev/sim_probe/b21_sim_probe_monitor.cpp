//------------------------------------------------------------------------------
//
//  sim_probe_monitor
//  
//  Description:
//              display client data from sim_probe
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>
#include <math.h>

#include "SimConnect.h"

// b21_sim_probe version (sent in client data)
double version = 1.0;

int     quit = 0;
HANDLE  hSimConnect = NULL;

static enum EVENT_ID {
    EVENT_SIM_START,
};

static enum DATA_REQUEST_ID {
    REQUEST_SIMLIFT
};

static enum DEFINITION_ID {
	DEFINITION_SIMLIFT // struct for lift value in client data area
};

//*******************************************************************************
// client data definitions

const char* SIMLIFT_NAME = "b21_sim_probe";

SIMCONNECT_CLIENT_DATA_ID SIMLIFT_ID = 256478; // random number hoping to avoid dupes

// structure for lift value client data
struct SimLift {
	double lift;
	int status; // 0 = ok, 1 = problem, others = reserved
	double version;
};

SimLift sim_lift = {0.0, 0, version}; // variable to hold the lift client data

//**********************************************************************************
//**********************************************************************************
// HERE is where we display lift, status, version from client data
//**********************************************************************************
//**********************************************************************************

void process_client_data() {
		printf("\nLift = %.1f, ",sim_lift.lift);
		printf("Status = %d, ",sim_lift.status);
		printf("Version = %.2f",sim_lift.version);
	}

void request_client_data() {
	HRESULT hr = SimConnect_RequestClientData(hSimConnect,
												SIMLIFT_ID,
												REQUEST_SIMLIFT,
												DEFINITION_SIMLIFT,
												SIMCONNECT_CLIENT_DATA_PERIOD_ON_SET);
}



void CALLBACK MyDispatchProcSO(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{   
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;

            switch(evt->uEventID)
            {
                case EVENT_SIM_START:

					printf("\nGot EVENT_SIM_START");
					// request client data whenever it changes
					request_client_data();

                    break;

                default:
                    printf("\nUnknown event: %d", evt->uEventID);
                    break;
            }
            break;
        }
        
        case SIMCONNECT_RECV_ID_CLIENT_DATA:
        {
            SIMCONNECT_RECV_CLIENT_DATA *pObjData = (SIMCONNECT_RECV_CLIENT_DATA*) pData;

            switch(pObjData->dwRequestID)
            {
                case REQUEST_SIMLIFT:
                {
                    DWORD ObjectID = pObjData->dwObjectID;
                    SimLift *pU = (SimLift*)&pObjData->dwData;
					sim_lift.lift = pU->lift;
					sim_lift.status = pU->status;
					sim_lift.version = pU->version;
                    process_client_data(); // display client data on console
                    break;
                }

                default:
					//debug
					printf("\n\nERROR: RECV_ID_CLIENT_DATA with unknown RequestID\n");
                    break;

            }
            break;
        }

        case SIMCONNECT_RECV_ID_EXCEPTION:
        {
            SIMCONNECT_RECV_EXCEPTION *except = (SIMCONNECT_RECV_EXCEPTION*)pData;
            printf("\n\n***** EXCEPTION=%d  SendID=%d  Index=%d  cbData=%d\n", except->dwException, except->dwSendID, except->dwIndex, cbData);
            break;
        }

        case SIMCONNECT_RECV_ID_OPEN:
        {
            SIMCONNECT_RECV_OPEN *open = (SIMCONNECT_RECV_OPEN*)pData;
            printf("\nConnected to FSX Version %d.%d", open->dwApplicationVersionMajor, open->dwApplicationVersionMinor);
            break;
        }

        case SIMCONNECT_RECV_ID_QUIT:
        {
            quit = 1;
            break;
        }

        default:
            printf("\nUnrecognized RECV_ID Received:%d",pData->dwID);
            break;
    }
}

void startup()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "b21_sim_probe", NULL, 0, 0, 0)))
    {
        printf("\nb21_sim_probe_monitor (Version %.2f) Connected to Flight Simulator!", version);   
          
		// SimLift client data definition
		hr = SimConnect_AddToClientDataDefinition(hSimConnect,
											DEFINITION_SIMLIFT,
											SIMCONNECT_CLIENTDATAOFFSET_AUTO,
											sizeof(sim_lift));
												
		// map the SimLift id
		hr = SimConnect_MapClientDataNameToID(hSimConnect, SIMLIFT_NAME, SIMLIFT_ID);

		// create reserved client data area
		//hr = SimConnect_CreateClientData(hSimConnect,
		//									SIMLIFT_ID,
		//									sizeof(sim_lift),
		//									SIMCONNECT_CREATE_CLIENT_DATA_FLAG_DEFAULT);

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
	printf("sim_probe_monitor version %.1f\n", version);
	//_tprintf (_T("command line argument is %s"), argv[1]);
    startup();
    return 0;
}