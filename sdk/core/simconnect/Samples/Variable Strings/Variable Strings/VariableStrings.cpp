                    
//------------------------------------------------------------------------------
//
//  SimConnect Variable String Sample
//  
//	Description:
//				Shows how to extract three variable length strings from a
//				structure
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>

#include "SimConnect.h"

static enum EVENT_ID {
	EVENT_SIM_START,
};

static enum DATA_DEFINE_ID {
	DEFINITION_1
};

static enum DATA_REQUEST_ID {
	REQUEST_1
};

struct StructVS
{
    char    strings[1];   // variable-length strings
};

int		quit			= 0;
HANDLE	hSimConnect		= NULL;

void CALLBACK MyDispatchProcVS(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
{
    switch(pData->dwID)
    {
        case SIMCONNECT_RECV_ID_EVENT:
        {
            SIMCONNECT_RECV_EVENT *evt = (SIMCONNECT_RECV_EVENT*)pData;
            switch(evt->uEventID)
            {
                case EVENT_SIM_START:
                    
                    // Send this request to get the user aircraft id
                    HRESULT hr = SimConnect_RequestDataOnSimObjectType(hSimConnect, REQUEST_1, DEFINITION_1, 0, SIMCONNECT_SIMOBJECT_TYPE_USER);
                    break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA_BYTYPE:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA_BYTYPE*)pData;
            
            switch(pObjData->dwRequestID)
            {
                case REQUEST_1:
                {
					StructVS *pS = (StructVS*)&pObjData->dwData;
                    char *pszTitle;
					char *pszAirline;
					char *pszType;
                    DWORD cbTitle;
					DWORD cbAirline;
					DWORD cbType;

					// Note how the third parameter is moved along the data received
                    if(SUCCEEDED(SimConnect_RetrieveString(pData, cbData, &pS->strings, &pszTitle, &cbTitle)) &&
                       SUCCEEDED(SimConnect_RetrieveString(pData, cbData, pszTitle+cbTitle, &pszAirline, &cbAirline)) &&
					   SUCCEEDED(SimConnect_RetrieveString(pData, cbData, pszAirline+cbAirline, &pszType, &cbType)))
                    {
                            printf("\nTitle = \"%s\" \nAirline = \"%s\" \nType = \"%s\"",
                                pszTitle, pszAirline, pszType );
                    } else
						printf("\nReceived %s",&pS->strings);
                    break;
                }
            }
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
            printf("\n\n***** EXCEPTION=%d  SendID=%d  Index=%d  cbData=%d\n", except->dwException, except->dwSendID, except->dwIndex, cbData);
            break;
        }

        default:
            printf("\nUNKNOWN DATA RECEIVED: pData=%p cbData=%d\n", pData, cbData);
            break;
    }
}

bool testVariableStrings()
{
    HANDLE hEventHandle = ::CreateEvent(NULL, FALSE, FALSE, NULL);
    
	if(hEventHandle == NULL)
    {
        printf("Error: Event creation failed!");
        return false;
    }

    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Variable Strings", NULL, 0, hEventHandle, 0)))
    {
		printf("\nConnected to Flight Simulator!");

		// Set up a data definition contained a number of variable length strings
		hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "TITLE",				NULL, SIMCONNECT_DATATYPE_STRINGV);
		hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "ATC AIRLINE",		NULL, SIMCONNECT_DATATYPE_STRINGV);
		hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "ATC TYPE",			NULL, SIMCONNECT_DATATYPE_STRINGV);

		// Request a simulation start event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");

		while( 0 == quit && ::WaitForSingleObject(hEventHandle, INFINITE) == WAIT_OBJECT_0)
		{
			SimConnect_CallDispatch(hSimConnect, MyDispatchProcVS, NULL);
		} 

		CloseHandle(hEventHandle);
		hr = SimConnect_Close(hSimConnect);
		return true;
	}
	return false;
}

int __cdecl _tmain(int argc, char* argv[])
{
	bool ok = testVariableStrings();
    return 0; 
}



