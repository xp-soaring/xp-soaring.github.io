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

M_TO_FEET = 3.28084

BOX_COORDS = {}
BOXES = {}

def main(fn_airport, fn_runway, fn_out):
    airports = {};
    runways = {};
    with open(fn_airport, 'r') as csvfile:
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
                airport = [ row[F_ID],
                            ident,
                            row[F_TYPE],
                            row[F_NAME],
                            float(row[F_LAT]),
                            float(row[F_LNG]),
                            0 if row[F_ELEVATION]=='' else float(row[F_ELEVATION]) / M_TO_FEET
                ]
                airports[ident]=airport
            except Exception as e:
                print("airport error",row,e, file=sys.stderr)
                break

    with open(fn_runway, 'r') as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            try:
                ident = row[0]
                if ident in runways:
                    runways[ident] = runways[ident]+" "+str(row[1])
                else:
                    runways[ident] = str(row[1])
            except Exception as e:
                print("runway error",row,e, file=sys.stderr)
                break
    #print(runways["1N7"], "1N7" in runways)
    #print(airports["1N7"])

    with sys.stdout if fn_out is None else open(fn_out, 'w', newline='') as f:
        writer = csv.writer(f,delimiter=',',quotechar='"',quoting=csv.QUOTE_MINIMAL)
        for ident in airports:
            #print(ident, airports[ident])
            airport = airports[ident]
            runway = ""
            if ident in runways:
                runway = runways[ident]
            airport += [runway]
            if ident=="1N7":
                print(airports[ident])
            writer.writerow(airport)

if __name__=="__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("airport_file", help="CSV file id,ident,type,name,lat,lng,elev_ft[,short_desc,long_desc]")
    parser.add_argument("runway_file", help="CSV file ident,runway_name")
    parser.add_argument("--output_file", help="CSV output file")
    args = parser.parse_args()
    main(args.airport_file, args.runway_file, args.output_file)

