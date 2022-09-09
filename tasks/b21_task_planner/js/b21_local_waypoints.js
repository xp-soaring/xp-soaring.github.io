"use strict"

// ******************************************************************************
// ***********   B21_Local_Waypoints class           ****************************
// ******************************************************************************

/* Interface;
        constructor(tracklog)
        load_cup(file_str, filename)
        lookup(id)
        search(str)
        file_type                   // "cup"
        waypoints                   // dictionary id -> {id, name, lat, lng, alt_m, desc, type = "user_waypoint", source = "local_waypoints"}
*/

// CUP format Holds custom waypoints
// name,code,country,lat,lon,elev,style,rwdir,rwlen,rwwidth,freq,desc
/* E.g. {
            code: "SCHLDMNG"
            country: "A"
            desc: ""
            elev: "749M"
            freq: ""
            lat: "4724.100N"
            lon: "01342.000E"
            name: "Schladming"
            rwdir: ""
            rwlen: ""
            style: "3"
        }
*/


class B21_Local_Waypoints {

    constructor(planner, local_waypoints_key) {
        this.planner = planner;
        this.local_waypoints_key = local_waypoints_key; // the dict key in b21_task_planner.local_waypoints for these waypoints
        this.file_type = null;
        this.filename = null;
        this.active = true;     // As in user settings, controls whether these waypoints should be displayed
        this.waypoints = {};    // { id: { id, name, lat, lng, alt_m, desc}, ...}
        this.box = null;        // { min_lat, min_lng, max_lat, max_lng }
        this.markers = null;    // holds map waypoint markers
        this.search_location_id = null; // waypoint selected from search
        this.map_layer_group = L.layerGroup();
    }

    waypoints_loaded() {
        console.log(this.local_waypoints_key,"waypoints_loaded()");
        this.add_to_map(this.planner.map);
        if (this.active) {
            this.draw();
        }
    }

    lookup(id) {
        return this.waypoints[id];
    }

    // Search all the waypoints, returning a list that contain the given string in the id or name
    search(str) {
        const RESULTS_MAX = 10;
        let search_str = str.toLowerCase();
        let results_id = [];
        let results_name = [];
        let search_names = true;
        for (var key in this.waypoints) {
            let wp = this.waypoints[key];

            if (wp.id != null && wp.id.toLowerCase().includes(search_str)) {
                wp.local_waypoints_key = this.local_waypoints_key;
                results_id.push(wp);
                if (results_id.length >= RESULTS_MAX) {
                    break;
                }
            } else if (search_names && wp.name != null && wp.name.toLowerCase().includes(search_str)) {
                wp.local_waypoints_key = this.local_waypoints_key;
                results_name.push(wp);
                if (results_name.length >= RESULTS_MAX) {
                    search_names = false;
                }
            }
        }
        // We will return the 'id' matches FIRST, followed by the 'name' matches, limited to RESULTS_MAX
        return results_id.concat(results_name).slice(0,RESULTS_MAX);
    }

    set_current_searched(id) {
        this.search_location_id = id;
    }

    draw() {
        let zoom = this.planner.map.getZoom();
        if (zoom < 10) {
            console.log(this.local_waypoints_key, "draw() Too zoomed out to display user waypoints");
            this.planner.map.removeLayer(this.map_layer_group);
            return;
        }
        let map_bounds = this.planner.map.getBounds();
        let map_box = {
            "min_lat": map_bounds.getSouth(),
            "min_lng": map_bounds.getWest(),
            "max_lat": map_bounds.getNorth(),
            "max_lng": map_bounds.getEast()
        }
        console.log(this.local_waypoints_key, "draw() waypoints", map_box);
        //drawing box of local_waypoints
        //L.rectangle([
        //    [this.box.min_lat, this.box.min_lng],
        //    [this.box.max_lat, this.box.max_lng]
        //]).addTo(map);

        if (Geo.box_overlap(this.box, map_box)) {
            if (! this.planner.map.hasLayer(this.map_layer_group)) {
                console.log(this.local_waypoints_key, "draw() local_waypoints adding layer to map");
                this.planner.map.addLayer(this.map_layer_group);
            } else {
                console.log(this.local_waypoints_key, "draw() no need for addLayer as the layer already exists");
            }
        } else {
            console.log(this.local_waypoints_key, "no box overlap so draw() local_waypoints removeLayer");
            this.hide();
        }
        // If a waypoint search result is selected, open popup for that waypoint
        if (this.search_location_id != null) {
            let marker = this.markers[this.search_location_id];
            marker.openPopup();
            this.search_location_id = null;
        }
    }

    hide() {
        this.planner.map.removeLayer(this.map_layer_group);
    }

    add_to_map() {
        this.map_layer_group.clearLayers();

        this.markers = {};

        console.log("add_to_map",this.local_waypoints_key);

        for (var key in this.waypoints) {
            let wp = this.waypoints[key];
            //console.log("waypoints draw",wp);

            let position = new L.latLng(wp["lat"], wp["lng"]);
            let id = wp["id"];
            let type = wp["type"];
            let name = wp["name"].replaceAll('"', ""); // Remove double quotes if original name includes those.
            let desc = wp["desc"].replaceAll('"', ""); // Remove double quotes if original name includes those.
            let alt_m = wp["alt_m"];
            let circle_radius = 4; //3 * (zoom - 7);
            let marker = L.circleMarker(position, {
                renderer: this.planner.canvas_renderer,
                color: "#ff4d4d",
                radius: circle_radius
            });
            marker.addTo(this.map_layer_group);

            // add popup
            let popup_content = name + "<br/>" + type + "<br/>" + id + (desc != "" ? "<br/>" + desc : "");
            let popup = L.popup({
                autoPan: false
            }).setContent(popup_content);
            marker.bindPopup(popup);

            marker.on('mouseover', function(event) {
                marker.openPopup();
            });
            marker.on('mouseout', function(event) {
                marker.closePopup();
            });

            // on click : add this waypoint to task
            marker.on('click', (e) => {
                console.log("User click:", id, name);
                this.planner.task.add_new_poi(position, type, {
                    //"ident": id,
                    "name": name,
                    "alt_m": alt_m
                });
            });
            this.markers[id] = marker;
        }
    }

    dumps() {
        // Set/Store the local_waypoints object
        let store_obj = {
            local_waypoints_key: this.local_waypoints_key,
            box: this.box,
            file_type: this.file_type,
            filename: this.filename,
            waypoints: this.waypoints
        };

        return JSON.stringify(store_obj);
    }

    loads(obj_str) {
        let store_obj = JSON.parse(obj_str);
        this.box = store_obj.box;
        this.file_type = store_obj.file_type;
        this.filename = store_obj.filename;
        this.waypoints = store_obj.waypoints;
        //this.waypoints_loaded();
    }

    // ******************************************************************************
    // ************ CUP file handling        ****************************************
    // ******************************************************************************

    // load_cup(file_str, filename) reads CUP waypoint records from the file_str
    load_cup(file_str, filename) {
        try {
            this.file_str = file_str;
            this.filename = filename;

            // Read the first line of the file, and split into column keys
            let line_term_r = file_str.indexOf('\r');
            let line_term_n = file_str.indexOf('\n');
            let line_term = line_term_r == -1 ? line_term_n : line_term_r;

            let keys = file_str.substring(0, line_term).split(',');
            this.keys = keys;

            if (this.bad_header(keys)) {
                // CUP csv column names were not as expected, so replacing:
                const header = "name,code,country,lat,lon,elev,style,rwdir,rwlen,freq,desc\n";
                file_str = header + file_str.substring(file_str.indexOf("\n") + 1);
            }

            // Find where the "---Related Tasks---" section is in the CUP file and remove it.
            let tasks_index = file_str.indexOf("---Related");
            if (tasks_index > 0) {
                file_str = file_str.slice(0,tasks_index);
            }

            this.cup_waypoints = d3.csvParse(file_str);

            this.parse_cup(this.cup_waypoints);

            this.file_type = "cup";

            this.waypoints_loaded();

            return true;
        } catch (e) {
            console.log("CUP file load failed with exception", e);
        }
        return false;
    }

    // Convert CUP format waypoints to our common standard.
    parse_cup(cup_waypoints) {
        this.waypoints = {};
        // bounds for map_box
        this.box = {};
        this.box["min_lat"] = 90;
        this.box["min_lng"] = 180;
        this.box["max_lat"] = -90;
        this.box["max_lng"] = -180;

        for (let i=0; i<cup_waypoints.length; i++) {
            let cup_wp = cup_waypoints[i];

            // Basic validity check:
            if (cup_wp["lon"] == '') {
                console.log("parse_cup skipping", cup_wp.name);
                continue;
            }
            let wp = {};

            // id
            wp.id = cup_wp.code != "" ? cup_wp.code : cup_wp.name;

            // name
            wp.name = cup_wp.name;

            // lat
            wp.lat = this.cup_latlng(cup_wp.lat);

            // lng
            wp.lng = this.cup_latlng(cup_wp.lon);

            // Update box lat/lng bounds
            if (wp.lat < this.box.min_lat) {
                this.box.min_lat = wp.lat;
            } else if (wp.lat > this.box.max_lat) {
                this.box.max_lat = wp.lat;
            }
            if (wp.lng < this.box.min_lng) {
                this.box.min_lng = wp.lng;
            } else if (wp.lng > this.box.max_lng) {
                this.box.max_lng = wp.lng;
            }

            // alt_m
            wp.alt_m = this.cup_alt_m(cup_wp.elev);

            // desc
            wp.desc = this.cup_style(cup_wp.style) + ". "+cup_wp.desc;

            wp.type = "user_waypoint";

            wp.source = "local_waypoints";

            this.waypoints[wp.id] = wp;
        }
    }

    bad_header(header_keys) {
        let correct_keys = ["name", "code", "country", "lat", "lon", "elev", "style"]
        let header_bad = false;
        for (let i = 0; i < correct_keys.length; i++) {
            let key = correct_keys[i];
            if (!header_keys.includes(correct_keys[i])) {
                console.log(`CUP file bad header (missing ${correct_keys[i]})`);
                header_bad = true;
                break;
            }
        }
        return header_bad;
    }

    // Convert string from CUP record to float decimal degrees lat/lng
    // E.g. 5107.830N -> 51.1305, 05107.830W -> -51.1305
    cup_latlng(str) {
        let EWNS = str.slice(-1);
        let deg;
        let min;
        if (EWNS == "N" || EWNS == "S") {
            deg = parseInt(str.substring(0, 2));
            min = parseFloat(str.substring(2, 8));
        } else {
            deg = parseInt(str.substring(0, 3));
            min = parseFloat(str.substring(3, 9));
        }

        if ((EWNS == 'W') || (EWNS == 'S')) {
            return -(deg + (min / 60));
        }
        return (deg + (min / 60));
    }

    // Convert CUP elev values (e.g. "123.4ft") into numerical meters values
    cup_alt_m(elev_str) {
        let alt = parseFloat(elev_str);
        if (elev_str.toLowerCase().endsWith('ft')) {
            return alt / this.planner.M_TO_FEET;
        }
        return alt;
    }

    // Convert CUP style numbers into string descriptions
    cup_style(style_str) {
        const styles = [
            "Unknown wp type",
            "Waypoint",
            "Airfield with grass surface runway",
            "Outlanding",
            "Gliding airfield",
            "Airfield with solid surface runway",
            "Mountain Pass",
            "Mountain Top",
            "Transmitter Mast",
            "VOR",
            "NDB",
            "Cooling Tower",
            "Dam",
            "Tunnel",
            "Bridge",
            "Power Plant",
            "Castle",
            "Intersection",
            "Marker",
            "Control/Reporting Point",
            "PG Take Off",
            "PG Landing Zone" ];
        let style_num = parseInt(style_str);
        if (isNaN(style_num)) {
            return "";
        }
        return styles[style_num];
    }

    // Convert B record string into a time-of-day in seconds
    time_s(str) {
        return parseInt(str.substring(0, 2)) * 3600 + parseInt(str.substring(2, 4)) * 60 + parseInt(str.substring(4, 6));
    }

    // Convert HFDTE string to JS UTC Date
    date(str) {
        //      ddmmyy
        // E.g. 230622
        return new Date("20" + str.substring(4, 6) + "-" + str.substring(2, 4) + "-" + str.substring(0, 2));
    }

} // end class B21_File_CUP
