//------------------------------------------------------------------------------
//
//  SimConnect Open and Close Sample
//  
//	Description:
//				Opens and immediately Closes SimConnect
//------------------------------------------------------------------------------

#include <windows.h>
#include <tchar.h>
#include <stdio.h>
#include <strsafe.h>

#include "SimConnect.h"

HANDLE  hSimConnect = NULL;

void testOpenClose()
{
    HRESULT hr;

    if (SUCCEEDED(SimConnect_Open(&hSimConnect, "Open and Close", NULL, 0, 0, 0)))
    {
        printf("\nConnected to Flight Simulator!");   
    
        hr = SimConnect_Close(hSimConnect);

        printf("\nDisconnected from Flight Simulator");
    } else
		printf("\nFailed to connect to Flight Simulator");
}

int __cdecl _tmain(int argc, _TCHAR* argv[])
{
    testOpenClose();

    return 0;
}





