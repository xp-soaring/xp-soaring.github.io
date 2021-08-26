#!/usr/bin/env python3

MAX_AIRPORTS_PER_BOX = 500 # This is the parameter which ensures no lat/lng box contains more than this number of airports

import csv
import math
import json
import argparse
import sys

# csv offsets in airports.csv file (see above)
F_ID = 0
F_IDENT = 1
F_TYPE = 2
F_NAME = 3
F_LAT = 4
F_LNG = 5
F_ELEVATION = 6
F_RUNWAYS = 7
F_GPS_CODE = 12
F_LOCAL_CODE = 14

M_TO_FEET = 3.28084

LAT_LNG_DIFF = 0.03 ## decimals lat|lng to consider same location

BOX_COORDS = {}
BOXES = {}

def main(fn_msfs, fn_ourairports, fn_out):
    msfs = {};
    ourairports = {};
    with open(fn_msfs, 'r') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            #airport = { 'lat': float(row[LAT]),
            #            'lng': float(row[LNG]),
            #            'name': row[NAME],
            #            'type': row[TYPE],
            #            'alt_m': 0 if row[ELEVATION]=='' else float(row[ELEVATION]) / M_TO_FEET
            #}
            try:
                ident = row[F_IDENT]
                airport = [ float(row[F_LAT]),
                            float(row[F_LNG]),
                            row[F_NAME]
                 ]
                msfs[ident]=airport
            except Exception as e:
                print("msfs airport error",row,e, file=sys.stderr)
                break

    with open(fn_ourairports, 'r') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            try:
                ident = row[F_IDENT]
                airport = [ row[F_ID],
                            ident,
                            row[F_TYPE],
                            row[F_NAME],
                            float(row[F_LAT]),
                            float(row[F_LNG]),
                            0 if row[F_ELEVATION]=='' else float(row[F_ELEVATION]),
                            row[F_GPS_CODE],
                            row[F_LOCAL_CODE]
                ]
                ourairports[ident]=airport
            except Exception as e:
                print("ourairports airport error",row,e, file=sys.stderr)
                break

    #print(runways["1N7"], "1N7" in runways)
    #print(airports["1N7"])

    ourairports_extra = {}

    for ident in ourairports:
        try:
            #print("checking ourairports",ident, ourairports[ident])
            airport = ourairports[ident]
            #   ICAO                 GPS_CODE                   LOCAL_CODE
            if "airport" in airport[F_TYPE] and ident not in msfs and airport[7] not in msfs and airport[8] not in msfs:
                match = match_lat_lng(msfs,airport[F_LAT],airport[F_LNG])
                if match is None:
                    ourairports_extra[ident] = airport
                else:
                    print(f'match msfs {match}:{msfs[match]} with ourairports {airport}', file=sys.stderr)
            #writer.writerow(airport)
        except Exception as e:
            print("ourairports airport error",airport,e, file=sys.stderr)
            break

    with sys.stdout if fn_out is None else open(fn_out, 'w', newline='') as f:
        writer = csv.writer(f,delimiter=',',quotechar='"',quoting=csv.QUOTE_MINIMAL)
        for ident in ourairports_extra:
            try:
                #print(ident, airports[ident])
                airport = ourairports_extra[ident]
                #print(airport)
                writer.writerow(airport)
            except Exception as e:
                print("ourairports_extra airport error",airport,e, file=sys.stderr)
                break

def match_lat_lng(airports, lat, lng):
    for ident in airports:
        #print(f'match {lat},{lng} with msfs[{ident}] {airports[ident]}')
        lat_diff = abs(lat - airports[ident][0])
        lng_diff = abs(lng - airports[ident][1])
        if lat_diff < LAT_LNG_DIFF and lng_diff < LAT_LNG_DIFF:
            return ident

    #print(f'no match for {lat},{lng}')
    return None


if __name__=="__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("msfs_file", help="CSV file id,ident,type,name,lat,lng,elev_ft,runways")
    parser.add_argument("ourairports_file", help="CSV same[0..6] as MSFS, plus [12]=gps_code, [14]=local_code")
    parser.add_argument("--output_file", help="CSV output file")
    args = parser.parse_args()
    main(args.msfs_file, args.ourairports_file, args.output_file)
