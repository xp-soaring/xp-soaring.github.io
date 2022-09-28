"use strict"

class Gliders {

    constructor() {

        this.settings = {};

        //      Sink rates for:
        //        Thermal:
        //             Hunt:
        //          Cruise: 60   70   80   90  100  110 120 knots
        this.settings["asw28"] = {
            "glider_id": "asw28",
            "title": "ASW-28",
            "handicap": 100,
            "sink": [
                [ 1.13,1.52,1.52,2.01,2.63,3.86,5.68,7.58,9.7],
                [ 1.37,1.45,1.45,1.78,2.30,3.16,4.40,5.81,7.6],
                [ 1.61,1.38,1.38,1.55,1.98,2.46,3.12,4.05,5.3]
            ]
        };

        //      Sink rates for:
        //        Thermal:
        //             Hunt:
        //          Cruise: 60   70   80   90  100  110 120 knots
        //                                                      then rows for no/half/full ballast
        this.settings["asw27"] = {
            "glider_id": "asw27",
            "title": "ASW-27",
            "handicap": 104,
            "sink": [
                [ 0.99,1.24,1.24,1.6,2.09,2.81,3.74,4.92,6.4],
                [ 1.11,1.25,1.25,1.52,1.91,2.49,3.22,4.09,5.2],
                [ 1.22,1.27,1.27,1.43,1.72,2.16,2.69,3.26,3.9]
            ]
        };
        //      Sink rates for:
        //        Thermal:
        //             Hunt:
        //          Cruise: 60   70   80   90  100  110 120 knots
        //                                                      then rows for no/half/full ballast
        this.settings["asw22"] = {
            "glider_id": "asw22",
            "title": "ASW-22",
            "handicap": 118,
            "sink": [
                [ 0.82,1.11,1.11,1.60,2.30,3.08,4.09,5.16,6.3],
                [ 0.86,1.05,1.05,1.43,2.01,2.83,3.61,4.58,5.7],
                [ 0.89,1.00,1.00,1.26,1.72,2.59,3.12,4.00,5.1]
            ]
        };
    }
}
