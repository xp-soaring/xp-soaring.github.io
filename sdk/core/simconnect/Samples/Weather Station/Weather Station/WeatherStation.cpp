//------------------------------------------------------------------------------
//
//  SimConnect Weather Station sample
//  
//	Description:
//				Requests weather data from the nearest weather station to the
//				user aircraft, every 10 seconds
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

int     quit = 0;
HANDLE  hSimConnect = NULL;


static enum EVENT_ID {
    EVENT_SIM_START,
};

static enum DATA_DEFINE_ID7 {
    DEFINTION_LLA,
};

static enum DATA_REQUEST_ID7 {
    REQUEST_LLA,
    REQUEST_WEATHER,
};

struct Struct_7
{
    double  altitude;
    double  latitude;
    double  longitude;
};

void CALLBACK MyDispatchProc7(SIMCONNECT_RECV* pData, DWORD cbData, void *pContext)
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
                    
                    // Start requesting lat/lon data every 10 seconds
                    hr = SimConnect_RequestDataOnSimObject(hSimConnect, REQUEST_LLA, DEFINTION_LLA, SIMCONNECT_OBJECT_ID_USER,
                        SIMCONNECT_PERIOD_SECOND, 0, 0, 10, 0);
                    break;
            }
            break;
        }

        case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
        {
            SIMCONNECT_RECV_SIMOBJECT_DATA *pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;
            
            printf("\nObject data received");

            switch(pObjData->dwRequestID)
            {
                case REQUEST_LLA:
                {
                    Struct_7 *pS = (Struct_7*)&pObjData->dwData;
                    printf("\nLat=%f  Lon=%f  IndAlt=%f", pS->latitude, pS->longitude, pS->altitude );
                    
                    // Now request the weather data - this will also be requested every 10 seconds
                    
                    hr = SimConnect_WeatherRequestObservationAtNearestStation(hSimConnect, REQUEST_WEATHER, (float) pS->latitude, (float) pS->longitude);
 
                    break;
                }

                default:
                    break;
            }
            break;
        }

       case SIMCONNECT_RECV_ID_WEATHER_OBSERVATION:
        {
            SIMCONNECT_RECV_WEATHER_OBSERVATION* pWxData = (SIMCONNECT_RECV_WEATHER_OBSERVATION*) pData;

            const char* pszMETAR = pWxData->szMetar;

			switch(pWxData->dwRequestID)
            {
			case REQUEST_WEATHER:
				printf("\n\nWEATHER OBSERVATION: %s", pszMETAR);
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

void testWeatherNearestStation()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Weather Station", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
               
        // Set up the data definition, note this matches the order in Struct_7
        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINTION_LLA, "Indicated Altitude",   "feet");
        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINTION_LLA, "Plane Latitude",       "degrees");
        hr = SimConnect_AddToDataDefinition(hSimConnect, DEFINTION_LLA, "Plane Longitude",      "degrees");
        
		// Request a flight loaded event
        hr = SimConnect_SubscribeToSystemEvent(hSimConnect, EVENT_SIM_START, "SimStart");
      
        while( 0 == quit )
        {
            SimConnect_CallDispatch(hSimConnect, MyDispatchProc7, NULL);
            Sleep(1);
        } 

        hr = SimConnect_Close(hSimConnect);
    }
}


int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testWeatherNearestStation();
	return 0;
}