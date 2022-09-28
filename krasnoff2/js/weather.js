
class Weather {

    constructor(main) {
        this.main = main;

        this.weather_id = null;

        this.settings = {};

        this.settings["type-0"] = {
            // Block describing conditions type-0 (normal) Median 3.6 knots to 4000 ft, 9km

            "pre_desc": "<p>Cumulus clouds can be seen in the distance.</p>",

            "desc":"<p>The sky is full of good-looking cumulus clouds. "+
                    "Cloudbase is about 4000 feet</p>",

            "cloudbase": 3900, // 4000 foot cloudbase (allow 100 feet for overrun)

            // strength of next thermal in knots:
            "thermal": [1.5,2.1,2.5,3.1,3.5,3.7,4.2,4.5,4.6,4.6,4.7,4.7,4.7,4.8,
                                4.8,4.9,5.4,5.5,5.8,6.2],

            "thermal_width": 1000, // width of thermal in feet for pullup calculation

            // distance to next thermal in kilometers:
            "distance": [0.5,1.0,1.1,2.0,3,5,6,6,7,8,10,11,11,12,12,12,14,16,18,20]
        };

        this.settings["type-1"] = {
            // Block describing conditions type-1 (stronger) Median 4.6knots to 5000 ft, 6.3km

            "pre_desc": "<p>Cumulus clouds can be seen in the distance.</p>",

            "desc": "<p>The sky is full of good-looking closely spaced cumulus clouds. "+
              "Cloudbase is approximately 5000 feet</p>",

            "cloudbase": 4880, // 5000 foot cloudbase (allow 120 feet for overrun)

            // strength of next thermal in knots:
            "thermal": [1.5,2.1,2.5,3.1,4.0,4.2,4.7,5.0,5.1,5.6,5.7,5.7,5.7,5.8,
                           5.8,5.9,6.4,6.5,6.8,7.2],

            "thermal_width": 1000, // width of thermal in feet for pullup calculation

            // distance to next thermal in kilometers
            "distance": [0.5,1.0,1.1,1.4,2,3,4,4,4.5,6,6.6,7,7,8,8,8,9,10,12,14]
        };

        this.settings["type-2"] = {
            // Block describing conditions type-2 (over-convected)  Median 2.4knots to 4000ft, 13km

            "pre_desc": "<p>The sky in the distance looks over-convected.</p>",

            "desc": "<p>The sky has over-convected, with 6/8ths Cu and rapid cycling. "+
                    "Cloudbase is around 4000 feet, and the climbs are harder to find.</p>",

            "cloudbase": 3700, // 3700 foot cloudbase

            "thermal": [1.5,2.1,2.5,2.6,3.2,3.2,3.3,3.3,3.4,3.4,3.5,3.6,3.6,3.7,
                                3.8,3.8,3.9,4.0,5.0,5.5],

            "thermal_width": 1000, // width of thermal in feet for pullup calculation

            "distance": [0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,18,18,18,20,22,27,30]
        };

        this.settings["type-3"] = {
            // Block describing conditions type-3 (blue) Median 3.6knots to 4500ft, 13km

            "pre_desc": "<p>The sky in the distance looks blue.</p>",

            "desc": "<p>The sky has gone completely blue."+
                    "Cloudbase is around 4500 feet, and the climbs seem further apart.</p>",

            "cloudbase": 4500, // 4500 foot cloudbase

            "thermal": [1.5,2.1,2.5,3.1,3.5,3.7,4.2,4.5,4.6,4.6,4.7,4.7,4.7,4.8,
                                4.8,4.9,5.4,5.5,5.8,6.2],

            "thermal_width": 1000, // width of thermal in feet for pullup calculation

            "distance": [0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,18,18,18,20,22,27,30]
        };

        this.settings["type-4"] = {
            // Block describing conditions type-4 (weak) Median 1.8knots to 3500ft, 13km

            "pre_desc": "<p>The sky in the distance has weakening Cu's.</p>",

            "desc": "<p>The Cu's look scattered and weak."+
                    "Cloudbase is around 3500 feet, and the climbs seem further apart.</p>",

            "cloudbase": 3500,

            "thermal": [1.3,1.6,1.8,2.1,2.3,2.4,2.6,2.8,2.8,2.8,2.9,2.9,2.9,2.9,
                                2.9,3.0,3.2,3.3,3.4,3.6],

            "thermal_width": 1000, // width of thermal in feet for pullup calculation

            "distance": [0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,17,17,17,18,18,20,21]
        };

        this.settings["type-5"] = {
            // Block describing conditions type-5 (weak-blue)  Median 1.8knots to 3500ft, 13km

            "pre_desc": "<p>The sky in the distance is blue.</p>",

            "desc": "<p>The sky has gone completely blue."+
                    "Cloudbase is around 3500 feet, and the climbs seem further apart.</p>",

            "cloudbase": 3500,

            "thermal": [1.3,1.6,1.8,2.1,2.3,2.4,2.6,2.8,2.8,2.8,2.9,2.9,2.9,2.9,
                                2.9,3.0,3.2,3.3,3.4,3.6],

            "thermal_width": 1000, // width of thermal in feet for pullup calculation

            "distance": [0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,18,18,18,20,22,27,30]
        };

        this.settings["type-6"] = {
            // Block describing conditions type-6 (streeting)  4500ft, some @4.6kt, others less @ 1km

            "pre_desc": "<p>There are clearly defined cloudstreets on track ahead.</p>",

            "desc": "<p>There are clearly defined cloudstreets on track at 4500 feet.</p>",

            "cloudbase": 4500,

            "thermal": [1.7,2.1,2.5,2.8,3.2,3.4,3.6,3.7,3.8,3.9,4.0,4.1,4.2,5.8,
                                    5.8,5.9,6.4,6.5,6.8,7.2],

            "thermal_width": 2000, // width of thermal in feet for pullup calculation

            "distance": [0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2,2,2,3,3,4,5]
        };
    } // End constructor

    set_weather(weather_id) {
        console.log("set_weather",weather_id);
        this.weather_id = weather_id;
    }

    update_page(el) {
        this.main.clear_div(el);
        el.innerHTML = this.settings[this.weather_id].desc;
    }
} // end class Weather
