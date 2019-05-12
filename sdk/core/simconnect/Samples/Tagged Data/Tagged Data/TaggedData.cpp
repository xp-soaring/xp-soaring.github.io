//------------------------------------------------------------------------------
//
//  SimConnect Tagged Data Request Sample
//  
//	Description:
//				After a flight has loaded, request the vertical speed and pitot
//				heat switch setting of the user aircraft, but only when the data
//				has changed
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;

// A basic structure for a single item of returned data
struct StructOneDatum {
	int		id;
	float	value;
};

// maxReturnedItems is 2 in this case, as the sample only requests
// vertical speed and pitot heat switch data
#define maxReturnedItems	2

// A structure that can be used to receive Tagged data
struct StructDatum {
	StructOneDatum  datum[maxReturnedItems];
};

static enum EVENT_PDR {
    EVENT_SIM_START,
};

static enum DATA_DEFINE_ID {
    DEFINITION_PDR,
};

static enum DATA_REQUEST_ID {
    REQUEST_PDR,
};

static enum DATA_NAMES {
	DATA_VERTICAL_SPEED,
	DATA_PITOT_HEAT,
};

void CALLBACK MyDispatchProcPDR(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
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
                    
                    // Make the call for data every second, but only when it changes and
                    // only that data that has changed
                    hr = SimConnect_RequestDataOnSimObject(hSimConnect, REQUEST_PDR, DEFINITION_PDR,
                        SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_SECOND,
                        SIMCONNECT_DATA_REQUEST_FLAG_CHANGED | SIMCONNECT_DATA_REQUEST_FLAG_TAGGED	);

                    break;

                default:
                   break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;
            
            switch(pObjData->dwRequestID)
            {
                case REQUEST_PDR:
                {
					int	count	= 0;;
                    StructDatum *pS = (StructDatum*)&pObjData->dwData;
			
					// There can be a minimum of 1 and a maximum of maxReturnedItems
					// in the StructDatum structure. The actual number returned will
					// be held in the dwDefineCount parameter.

					while (count < (int) pObjData->dwDefineCount)
					{
						switch (pS->datum[count].id)
						{
						case DATA_VERTICAL_SPEED:
							printf("\nVertical speed = %f", pS->datum[count].value );
							break;

						case DATA_PITOT_HEAT:
							printf("\nPitot heat = %f", pS->datum[count].value );
							break;

						default:
							printf("\nUnknown datum ID: %d", pS->datum[count].id);
							break;
						}
						++count;
					}
                    break;
                }

                default:
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
            printf("\Unknown dwID: %d",pData->dwID);
            break;
    }
}

void testTaggedDataRequest()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Tagged Data", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
        
        // Set up the data definition, ensuring that all the elements are in Float32 units, to
		// match the StructDatum structure
		// The number of entries in the DEFINITION_PDR definition should be equal to
		// the maxReturnedItems define

		hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PDR, "Vertical Speed", "Feet per second",
											SIMCONNECT_DATATYPE_FLOAT32, 0, DATA_VERTICAL_SPEED);
        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_PDR, "Pitot Heat", "Bool",
											SIMCONNECT_DATATYPE_FLOAT32, 0, DATA_PITOT_HEAT);

        // Request a simulation start event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProcPDR, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{

    testTaggedDataRequest();

	return 0;
}





