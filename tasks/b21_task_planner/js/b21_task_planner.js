"use strict"

/*  This is the 'main' controller class for the B21 Task Planner application.
    index.html contains an onload script with
        b21_task_planner = new B21_TaskPlanner();
        b21_task_planner.init();
*/

/*  Note the use of 'parent' variables is simply a substitute for 'this', but consistently set to
    be an 'object reference' to the currently instantiated class object, as you would expect in most languages.
    Javascript has complex 'this' behaviour when code is executed following a 'click' on a DOM object or during
    setTimeout.
*/

class B21_TaskPlanner {

    constructor() {
        this.M_TO_FEET = 3.28084;
        this.M_TO_MILES = 0.000621371;
        this.MS_TO_KPH = 3.6;
        this.MS_TO_KNOTS = 1.94384;

        this.URL_TIMEOUT_S = 10; // Given a PLN url on startup, will try this many seconds to load that URL file.
    }

    init() {
        let parent = this;

        // Set unique id for user
        this.id = localStorage.getItem('b21_task_planner_id');
        if (this.id == null) {
            this.id = this.create_guid();
            localStorage.setItem('b21_task_planner_id', this.id);
        }
        // ********************************************
        // Define vars for DOM elements
        // ********************************************

        this.skyvector_button_el = document.getElementById("skyvector_button"); // So we can update action URL
        // Search box
        this.search_results_el = document.getElementById("search_results");
        this.search_input_el = document.getElementById("search_input");

        // left_pane content
        this.left_pane_el = document.getElementById("left_pane"); // display none|block
        this.left_pane_show_el = document.getElementById("left_pane_show"); // display none|block
        this.left_pane_tabs_el = document.getElementById("left_pane_tabs"); // display none|block

        // tabs and their content on left pane
        //DEBUG add an "Update Scores" button to tabs when task + tracklogs are loaded.
        this.tab_task_el = document.getElementById("tab_task");
        this.tab_tracklogs_el = document.getElementById("tab_tracklogs");
        this.task_info_el = document.getElementById("task_info");
        this.tracklogs_el = document.getElementById("tracklogs");
        this.tracklogs_select_all_el = document.getElementById("tracklogs_select_all");
        this.tracklog_info_el = document.getElementById("tracklog_info");
        this.rescore_button_el = document.getElementById("rescore_button");

        // right_pane content
        this.right_pane_el = document.getElementById("right_pane");
        this.panes_resize();

        // map pane
        this.map_el = document.getElementById("map");
        // replay bar
        this.replay_el = document.getElementById("replay");
        this.replay_hide_chart_el = document.getElementById("replay_hide_chart"); // button
        this.replay_hide_tracks_el = document.getElementById("replay_hide_tracks"); // button
        this.replay_speed_el = document.getElementById("replay_speed_value");
        this.replay_time_el = document.getElementById("replay_time");
        this.replay_sync_el = document.getElementById("replay_sync_checkbox");
        // charts
        this.charts_el = document.getElementById("charts");

        // ********************************************
        // Define class vars
        // ********************************************

        // Tracklogs array, will contain Tracklog objects for each loaded GPX file
        this.tracklogs = []; // Loaded tracklogs
        this.tracklog_index = null; // index of current tracklog

        // Replay clock - will set to earliest time from any loaded GPX file
        this.replay_mode = false; // true when replay is running.
        this.replay_ts = null; // Timestamp (s) for current replay
        this.replay_end_ts = null; // Latest timestamp in tracklogs, limit for replay
        this.replay_speed = 10; // Replay speed multiplier, relative to real time
        this.replay_timer = null; // JS interval timer
        this.replay_completed = false; // set to true when this.replay_ts is larger than any timestamp in tracklogs
        this.replay_sync = false; // true => replay will synchronize all tracklogs to a common start time

        this.charts_hidden = true; // The 'charts' div is hidded until GPX file is loaded
        this.tracks_hidden = false; // The tracks on the map can be hidden or displayed

        this.local_waypoints = {};      // DICTIONARY of { key -> B21_Local_Waypoints }

        // Restore saved settings
        this.settings = new B21_Settings(this); // Load settings from localStorage incl. local_waypoints

        window.addEventListener("resize", (e) => {
            console.log("window resized", window.innerWidth, window.innerHeight);
            this.panes_resize();
        });

        this.init_drop_zone();

        // Make sure is initialized ok
        this.reset_all();

        this.airports = new B21_Airports(this);

        this.airports.init(this.map); // Here we ASYCHRONOUSLY load the airports JSON data (& will draw on map)

        // Load parameters from querystring into this.querystring object
        try {
            this.querystring = this.parse_querystring();
        } catch (e) {
            this.querystring = null;
            console.log("parse_querystring fail");
        }
        console.log("querystring", this.querystring);

        this.handle_querystring(this.querystring);
    }

    panes_resize() {
        let left_pane_width_px = this.left_pane_el.offsetWidth;
        this.right_pane_el.style.width = "calc(100% - " + (left_pane_width_px + 25).toFixed(0) + "px)";
    }

    create_guid() {
        function _p8(s) {
            var p = (Math.random().toString(16) + "000000000").substr(2, 8);
            return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
        }
        return _p8() + _p8(true) + _p8(true) + _p8();
    }

    parse_querystring() {
        var search = location.search.substring(1);
        console.log(search);
        return JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function(key, value) {
            return key === "" ? value : decodeURIComponent(value)
        })
    }

    // *******************************************************************************
    // Define the map
    // *******************************************************************************

    init_map(parent) {

        parent.canvas_renderer = L.canvas();

        // https://leaflet-extras.github.io/leaflet-providers/preview/

        let tiles_mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        let tiles_outdoor = L.tileLayer(
            'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYjIxc29hcmluZyIsImEiOiJja3M0Z2o0ZWEyNjJ1MzFtcm5rYnAwbjJ6In0.frJxiv-ZUV8e2li7r4_3_A', {
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                maxZoom: 18,
                id: 'mapbox/outdoors-v11',
                tileSize: 512,
                zoomOffset: -1,
                minZoom: 2,
                accessToken: 'pk.eyJ1IjoiYjIxc29hcmluZyIsImEiOiJja3M0Z2o0ZWEyNjJ1MzFtcm5rYnAwbjJ6In0.frJxiv-ZUV8e2li7r4_3_A'
            });

        let tiles_opentopomap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });

        let thunderforest_landscape = L.tileLayer(
            'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey={apikey}', {
                attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                apikey: '<your apikey>',
                maxZoom: 22
            });

        let thunderforest_outdoors = L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}', {
            attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            apikey: '<your apikey>',
            maxZoom: 22
        });

        let stamen_terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            subdomains: 'abcd',
            minZoom: 0,
            maxNativeZoom: 13,
            ext: 'png'
        });

        let cyclosm = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
            maxZoom: 20,
            attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        var esri_natgeo_world = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
                maxZoom: 16
            });

        let esri_world_imagery = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });

        // Optional additional layers
        parent.airport_markers = L.layerGroup(); //.addTo(this.map);

        let open_railway_map = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });

        parent.base_maps = {
            "Streetmap": tiles_mapnik,
            "TopoMap": tiles_opentopomap,
            "NatGeo": esri_natgeo_world,
            "Outdoor": tiles_outdoor,
            //"Thunderforest Land": thunderforest_landscape,
            //"Thunderforest Outdoor": thunderforest_outdoors,
            "StamenTerrain": stamen_terrain,
            //"CyclOSM": cyclosm,
            "Satellite": esri_world_imagery
        }

        parent.map_layers = {
            "Airports": parent.airport_markers,
            "Railways": open_railway_map
        }

        // Clear old map
        if (parent.map) {
            parent.map.off();
            parent.map.remove();
        }

        parent.map = L.map(parent.map_el, {
            minZoom: 5,
            maxZoom: 16,
            layers: [parent.base_maps[parent.settings.base_layer_name], parent.airport_markers]
        });
        //parent.tiles_outdoor.addTo(parent.map);
        //parent.tiles_opentopomap.addTo(parent.map);
        //esri_world_imagery.addTo(parent.map);

        // Create pane in foreground to display the tracklogs
        parent.tracklogs_pane = parent.map.createPane("tracklogs_pane");
        parent.tracklogs_pane.style.zIndex = 450;

        parent.map.on("baselayerchange", (e) => {
            console.log("baselayerchange", e);
            parent.settings.set("base_layer_name", e.name);
        });

        L.control.layers(parent.base_maps, parent.map_layers).addTo(parent.map);

        parent.load_map_coords();

        parent.update_skyvector_link(parent.map.getCenter(), parent.map.getZoom());

        parent.set_map_events(parent);

    }

    draw_map(parent) {
        //console.log("b21_task_planner draw_map()");

        let checked_count = parent.tracklogs_checked_count(parent);
        //console.log("checked_count", checked_count);

        if (checked_count == 0) {
            parent.replay_el.style.display = "none";
            parent.hide_charts(parent);
        } else {
            parent.replay_el.style.display = "flex";
            parent.show_charts(parent);
        }

        parent.map.invalidateSize();
    }

    set_map_events(parent) {
        // Set up the map mouse click callbacks
        parent.map.on('click', (e) => {
            parent.map_left_click(parent, e);
        });

        parent.map.on('contextmenu', (e) => {
            parent.map_right_click(parent, e);
        });

        parent.map.on("moveend", () => {
            console.log("moveend");
            parent.save_map_coords(parent.map.getCenter(), parent.map.getZoom());
            parent.update_skyvector_link(parent.map.getCenter(), parent.map.getZoom());
            parent.airports.draw(parent.map);

            // redraw currently loaded waypoints
            parent.draw_waypoints(parent);
        });

        parent.map.on('zoomend', () => { // Will also call moveend
            console.log("zoomend");
        });

        parent.add_lat_long_display(parent);
    }

    show_tracks_on_map(parent) {
        console.log("show_tracks");
        parent.tracks_hidden = false;
        parent.tracklogs_pane.style.display = "";
    }

    hide_tracks_on_map(parent) {
        console.log("hide_tracks");
        parent.tracks_hidden = true;
        parent.tracklogs_pane.style.display = "none";
    }

    // Called when map moves
    draw_waypoints(parent) {
        console.log("draw_waypoints");
        for (const [local_waypoints_key, waypoints] of Object.entries(parent.local_waypoints)) {
            waypoints.draw();
        }
    }

    // ************************************************************
    // Charts
    // ************************************************************

    init_charts(parent) {
        B21_Utils.clear_div(parent.charts_el)
        parent.hide_charts(parent);
        parent.replay_el.style.display = "none";
    }

    show_charts(parent) {
        console.log("show_charts()");
        parent.map_el.style.height = "calc(75% - 42px)";
        parent.charts_el.style.display = "block";
        parent.charts_hidden = false;
        parent.replay_hide_chart_el.innerHTML = "hide chart";

    }

    hide_charts(parent) {
        console.log("hide_charts()");
        if (parent.replay_el.style.display == "none" || parent.replay_el.style.display == "") {
            console.log("replay_el display == none");
            parent.map_el.style.height = "100%";
        } else {
            console.log("replay_el display != none : ", `"${parent.replay_el.style.display}"`);
            parent.map_el.style.height = "calc(100% - 42px)";
        }
        parent.charts_el.style.display = "none";
        parent.charts_hidden = true;
        parent.replay_hide_chart_el.innerHTML = "show chart";
    }

    add_lat_long_display(parent) {
        let Position = L.Control.extend({
            _container: null,
            options: {
                position: 'bottomleft'
            },
            onAdd: function(map) {
                var latlng = L.DomUtil.create('div', 'mouseposition');
                parent._latlng = latlng;
                return latlng;
            },

            updateHTML: function(lat, lng) {
                var latlng = lat + " " + lng;
                //parent._latlng.innerHTML = "Latitude: " + lat + "   Longitiude: " + lng;
                parent._latlng.innerHTML = "LatLng: " + latlng;
            }
        });

        let position = new Position();
        parent.map.addControl(position);

        parent.map.addEventListener('mousemove', (event) => {
            let lat = Math.round(event.latlng.lat * 100000) / 100000;
            let lng = Math.round(event.latlng.lng * 100000) / 100000;
            position.updateHTML(lat, lng);
        });
    }

    // ********************************************************************************************
    // *********  File loads handling                      ****************************************
    // ********************************************************************************************

    init_drop_zone() {
        let drop_zone_el = document.getElementById("drop_zone");
        //drop_zone_el.style.display = "block";
        let parent = this;
        drop_zone_el.ondragover = (e) => {
            parent.dragover_handler(e);
        };
        drop_zone_el.ondrop = (e) => {
            parent.drop_handler(parent, e);
        };

        let drop_zone_choose_input_el = document.getElementById("drop_zone_choose_input");

        drop_zone_choose_input_el.onchange = () => {
            console.log("drop_zone_choose_input_el.onchange");
            parent.drop_choose_handler(parent, [...drop_zone_choose_input_el.files]);
        };

        let drop_zone_choose_button_el = document.getElementById("drop_zone_choose_button");

        drop_zone_choose_button_el.onclick = () => {
            console.log("drop_zone_choose_button_el.onclick");
            drop_zone_choose_input_el.value = ""; // reset so you can load the same file a second time
            drop_zone_choose_input_el.click();
        };
    }

    drop_handler(parent, ev) {
        console.log('File(s) dropped');
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();

        if (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) {
            console.log(`dataTransfer.items ${ev.dataTransfer.items.length} found`, ev.dataTransfer.items);
            // Use DataTransferItemList interface to access the file(s)
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                console.log("checking data item " + i);
                let item = ev.dataTransfer.items[i];
                // If dropped items aren't files, reject them
                if (item.kind === 'file') {
                    let file = item.getAsFile();
                    console.log('DataTransferItemList... file[' + i + ']' + file.name + '=', file);
                    let reader = new FileReader();
                    reader.onload = (e) => {
                        console.log("FileReader.onload")
                        parent.handle_file_content(parent, Date.now(), e.target.result, file.name);
                    }
                    console.log("reader.readAsArrayBuffer", file.name);
                    reader.readAsArrayBuffer(file);
                } else {
                    console.log("Item dropped not of kind 'file':", ev.dataTransfer.items[i].kind, ev.dataTransfer.items[i]);
                    if (item.kind === 'string') {
                        item.getAsString(function(s) {
                            console.log("item string", s);
                        });
                    }
                }
            }
        } else {
            console.log("dataTransfer.items not found, using dataTransfer.files", ev);
            parent.handle_files(parent, ev.dataTransfer.files);
        }
    }

    drop_choose_handler(parent, files) {
        console.log("drop_choose_handler", files);
        parent.handle_files(parent, files);
    }

    handle_files(parent, files) {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < files.length; i++) {
            console.log("checking file " + i)
            let file = files[i];
            console.log('DataTransfer... file[' + i + '].name = ' + file.name);
            let reader = new FileReader();
            reader.addEventListener("load", (e) => {
                parent.handle_file_content(parent, Date.now(), e.target.result, file.name);
            });
            // event fired when file reading failed
            reader.addEventListener('error', (e) => {
                alert('Error : Failed to read file');
            });
            reader.readAsArrayBuffer(file);
        }
    }

    // Handle the file contents, called after a URL access, file drop, or file choose
    handle_file_content(parent, fetch_start, file_content, name = null) {
        //console.log("handle_file_content", name);
        if (name == null) {
            console.log("No name for dropped file - aborting");
            return;
        }

        let suffix = B21_Utils.file_suffix(name);

        let decoder = new TextDecoder();

        if (suffix == "pln") {
            console.log("handle_drop for PLN file");
            parent.init_task(parent);
            parent.handle_pln_str(parent, fetch_start, decoder.decode(file_content), name);

        } else if (suffix == "tsk") {
            console.log("handle_drop for TSK file");
            parent.init_task(parent);
            parent.handle_tsk_str(parent, fetch_start, decoder.decode(file_content), name);

        } else  if (suffix == "gpx") {
            parent.handle_gpx_str(parent, fetch_start, decoder.decode(file_content), name);

        } else if (suffix == "igc") {
            parent.handle_igc_str(parent, fetch_start, decoder.decode(file_content), name);

        } else if (suffix == "cup") {
            parent.handle_cup_str(parent, fetch_start, decoder.decode(file_content), name);

        } else if (suffix == "comp") {
            parent.handle_comp_str(parent, fetch_start, decoder.decode(file_content), name);

        } else if (suffix == "zip") {
            parent.handle_zip_str(parent, fetch_start, file_content, name);

        } else {
            alert(`${name} not a recognized type`);
            return;
        }
        console.log(`File load time for ${name} was ${Date.now() - fetch_start} milliseconds`);
    }

    dragover_handler(ev) {
        //console.log("dragover_handler preventDefault");
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
    }

    // ********************************************************************************************
    // *********  Handle files from drop or URL                        ****************************
    // ********************************************************************************************

    // Load a PLN file from "pln": "url"
    // Currently param_obj is simply the parsed querystring
    handle_querystring(param_obj) {
        let parent = this;

        if (param_obj == null) {
            return;
        }

        console.log(`Starting querystring file downloads`);

        if (param_obj["pln"] != null) {
            let request_url = "https://" + param_obj["pln"];
            console.log("load pln url", request_url);
            this.handle_url_file(parent, request_url);
        }

        if (param_obj["gpx"] != null) {
            let request_url = "https://" + param_obj["gpx"];
            console.log("load gpx url", request_url);
            this.handle_url_file(parent, request_url);
        }

        if (param_obj["igc"] != null) {
            let request_url = "https://" + param_obj["igc"];
            console.log("load igc url", request_url);
            try {
                this.handle_url_file(parent, request_url);
            } catch (e) {
                alert(e);
            }
        }

        if (param_obj["cup"] != null) {
            let request_url = "https://" + param_obj["cup"];
            console.log("load cup url", request_url);
            this.handle_url_file(parent, request_url);
        }

        if (param_obj["tsk"] != null) {
            let request_url = "https://" + param_obj["tsk"];
            console.log("load tsk url", request_url);
            this.handle_url_file(parent, request_url);
        }

        if (param_obj["comp"] != null) {
            let request_url = "https://" + param_obj["comp"];
            console.log("load comp url", request_url);
            this.handle_url_file(parent, request_url);
        }

    }

    handle_url_file(parent, url) {
        // Get name from url, i.e. between last '/' and '.'
        let filename = url.slice(url.lastIndexOf('/') + 1);
        let name = filename.slice(0, filename.lastIndexOf('.'));
        console.log("loading url name=", filename);

        let fetch_start = Date.now();

        fetch(url).then(response => {
            if (!response.ok) {
                alert("A file referenced in the querystring failed to load.");
                return null;
            }
            return response.arrayBuffer();
        }).then(result_content => {
            //console.log("fetch(url) return");
            if (result_content != null) {
                parent.handle_file_content(parent, fetch_start, result_content, filename);
            }
        }).catch(error => {
            console.error('Network error accessing user URL:', error);
        });
    }

    handle_pln_str(parent, fetch_start, pln_str, name) {
        console.log("handle_pln_str string containing PLN XML '" + name + "'");
        if (parent.airports.available) {
            console.log("airports available, so loading PLN");
            parent.task.load_pln_str(pln_str, name);
        } else {
            console.log(
                `WARNING: handle_pln_str airports not ready after ${((Date.now() - fetch_start)/1000).toFixed(2)} seconds`
            );
            // The airports data is not ready, so have another try loading this PLN after a delay
            let seconds_since_start = (Date.now() - fetch_start) / 1000;
            if (seconds_since_start > parent.URL_TIMEOUT_S) {
                alert(`ERROR: timeout after ${seconds_since_start.toFixed(2)} seconds loading the airports.json data file`);
                return;
            }
            console.log("Setting timer to retry PLN load after one second");
            setTimeout(function() {
                parent.handle_pln_str(parent, fetch_start, pln_str, name);
            }, 1000);
            return;
        }
        parent.map.fitBounds([
            [parent.task.min_lat, this.task.min_lng],
            [parent.task.max_lat, this.task.max_lng]
        ]);
        parent.score_tracklogs();
        parent.show_task_info();
    }

    handle_tsk_str(parent, fetch_start, tsk_str, name) {
        console.log("handle string containing TSK XML '" + name + "'");
        if (parent.airports.available) {
            console.log("airports available, so loading TSK");
            parent.task.load_tsk_str(tsk_str, name);
        } else {
            console.log(
                `WARNING: handle_tsk_string airports not ready after ${((Date.now() - fetch_start)/1000).toFixed(2)} seconds`
            );
            // The airports data is not ready, so have another try loading this TSK after a delay
            let seconds_since_start = (Date.now() - fetch_start) / 1000;
            if (seconds_since_start > parent.URL_TIMEOUT_S) {
                alert(`ERROR: timeout after ${seconds_since_start.toFixed(2)} seconds loading the airports.json data file`);
                return;
            }
            console.log("Setting timer to retry TSK load after one second");
            setTimeout(function() {
                parent.handle_tsk_str(parent, fetch_start, tsk_str, name);
            }, 1000);
            return;
        }
        this.map.fitBounds([
            [this.task.min_lat, this.task.min_lng],
            [this.task.max_lat, this.task.max_lng]
        ]);
        this.score_tracklogs();
        this.show_task_info();
    }

    // ********************************************************************************************
    // *********  Handle GPX file (from drop or URL)                   ****************************
    // ********************************************************************************************

    handle_gpx_str(parent, fetch_start, file_str, filename) {
        console.log("loading GPX as tracklogs[" + parent.tracklogs.length + "]", filename);
        let tracklog = new B21_TrackLog(parent.tracklogs.length, parent, parent.map);
        let ok = tracklog.load_gpx(file_str, filename);

        if (ok) {
            parent.tracklogs.push(tracklog);
            parent.tracklog_index = parent.tracklogs.length - 1;

            parent.tracklog_loaded(parent, tracklog);
        } else {
            alert("Problem loading GPX file "+filename);
        }
    }

    // ********************************************************************************************
    // *********  Handle IGC file (from drop or URL)                   ****************************
    // ********************************************************************************************

    handle_igc_str(parent, fetch_start, file_str, filename) {
        console.log("loading IGC as tracklogs[" + parent.tracklogs.length + "]", filename);
        let tracklog = new B21_TrackLog(parent.tracklogs.length, parent, parent.map);
        let ok = tracklog.load_igc(file_str, filename);

        if (ok) {
            parent.tracklogs.push(tracklog);
            parent.tracklog_index = parent.tracklogs.length - 1;

            parent.tracklog_loaded(parent, tracklog);
        } else {
            alert("Problem loading IGC file "+filename);
        }
    }

    // ********************************************************************************************
    // *********  Handle CUP file (from drop or URL)                   ****************************
    // ********************************************************************************************

    handle_cup_str(parent, fetch_start, file_str, filename) {
        console.log("loading CUP waypoints", filename);
        let key = filename;
        let waypoints = new B21_Local_Waypoints(parent, key); // filename here is the reference key.

        let ok = waypoints.load_cup(file_str, filename);
        if (ok) {
            // Set the local_waypoints object
            this.local_waypoints[key] = waypoints;
            let prompt_str = `"${filename}" loaded for this session.\n\n`;
            prompt_str += `Click 'OK' if you want these waypoints reloaded each time you use this app. `;
            prompt_str += `You can enable/disable/delete these waypoints in Settings.`;
            if(confirm(prompt_str)) {
                // persist these waypoints to localStorage
                parent.settings.set_settings_local_waypoints(key, waypoints);
            }
        }
    }

    // ********************************************************************************************
    // *********  Handle COMP file (from drop or URL)                  ****************************
    // A .comp file is simply a text file containing a list of URL's
    // ********************************************************************************************

    handle_comp_str(parent, fetch_start, file_str, filename) {
        console.log("loading COMP files from", filename);
        let lines = file_str.split("\n");
        for (let i=0; i < lines.length; i++) {
            let url = lines[i];
            let suffix = B21_Utils.file_suffix(url);
            if (url.startsWith("https://") && ["pln","tsk","igc","gpx","cup"].includes(suffix)) {
                parent.handle_url_file(parent, url);
            } else {
                if (url.length > 2) {
                    console.log(`${filename} contains bad url '${url}'`);
                }
            }
        }
    }

    // ********************************************************************************************
    // *********  Handle ZIP file (from drop or URL)                   ****************************
    // ********************************************************************************************

    handle_zip_str(parent, fetch_start, file_content, filename) {
        console.log("loading ZIP files from", filename);

        JSZip.loadAsync(file_content)
            .then( function (zip) {
                zip.forEach( function (path, zip_object) {
                    if (! zip_object.dir) {
                        let name = zip_object.name;
                        console.log("handle_zip_str",name);
                        zip.file(name).async("arraybuffer")
                            .then( function (file_content) {
                                parent.handle_file_content(parent, fetch_start, file_content, name);
                            });
                    }
                });
            });
        return;

        for (let i=0; i < lines.length; i++) {
            let url = lines[i];
            let suffix = B21_Utils.file_suffix(url);
            if (url.startsWith("https://") && ["pln","tsk","igc","gpx","cup"].includes(suffix)) {
                parent.handle_url_file(parent, url);
            } else {
                if (url.length > 2) {
                    console.log(`${filename} contains bad url '${url}'`);
                }
            }
        }
    }

    // ********************************************************************************************
    // *********  Persist map position and scale between sessions      ****************************
    // ********************************************************************************************

    save_map_coords(center, zoom) {
        //console.log(center.toString(), zoom);
        let move_obj = {
            lat: center.lat,
            lng: center.lng,
            zoom: zoom
        };
        let move_str = JSON.stringify(move_obj);
        localStorage.setItem("b21_task_planner_map_coords", move_str);
    }

    load_map_coords() {
        let move_str = localStorage.getItem("b21_task_planner_map_coords");
        console.log("load_map_coords", move_str);
        if (move_str == null | move_str == "undefined") {
            this.map.setView(new L.latLng(52.194748, 0.144295), 11);
            return;
        }
        let move_obj = {};
        try {
            move_obj = JSON.parse(move_str);
        } catch (e) {
            console.log("bad b21_task_planner_map_coords localStorage");
            return;
        }
        if (move_obj.lat == null || move_obj.lng == null) {
            return;
        }

        this.map.setView(new L.latLng(move_obj.lat, move_obj.lng), move_obj.zoom);
    }

    // ********************************************************************************************
    // *********  Manage the SkyVector link                            ****************************
    // ********************************************************************************************

    // Build the SkyVector button link
    // e.g. https://skyvector.com/?ll=54.65188861732224,-2.073669422461872&chart=301&zoom=1
    update_skyvector_link(center, zoom) {
        let sv_link = "https://skyvector.com/?ll=#LAT#,#LNG#&chart=301&zoom=#ZOOM#"
        let sv_zoom = 2 * (11 - zoom); // Convert OSM zoom to SV zoom
        if (sv_zoom < 1) { // limit SkyVector zoom to 1..12
            sv_zoom = 1;
        }
        if (sv_zoom > 12) {
            sv_zoom = 12;
        }
        sv_link = sv_link.replace("#LAT#", center.lat.toFixed(8));
        sv_link = sv_link.replace("#LNG#", center.lng.toFixed(8));
        sv_link = sv_link.replace("#ZOOM#", sv_zoom.toFixed(0));

        this.skyvector_button_el.setAttribute("href", sv_link);
    }


    // ********************************************************************************************
    // *********  Map click callbacks                      ****************************************
    // ********************************************************************************************

    map_left_click(parent, e) {
        let position = e.latlng;
        this.add_task_point(position);
    }

    map_right_click(parent, e) {
        /*
        this.current_latlng = e.latlng; // Preserve 'current' latlng so page methods can use it

        let menu_str = '<div class="menu">';
        menu_str += parent.menuitem("Add WP", "add_wp");
        menu_str += parent.menuitem("Add Airport", "add_airport");
        menu_str += '</div>'; // end menu

        var popup = L.popup()
            .setLatLng(this.current_latlng)
            .setContent(menu_str)
            .openOn(parent.map);
        */
    }

    menuitem(menu_str, menu_function_name) {
        return '<button onclick="b21_task_planner.' + menu_function_name + '()" class="menuitem">' + menu_str + '</button>';
    }

    // User has clicked somewhere on the map
    add_task_point(position) {
        console.log("add_task_point " + position);
        let wp = this.task.add_point_wp(position);

        this.map.closePopup();

        wp.request_alt_m();

        this.task.update_display();

        wp.display_menu();
    }

    // User has clicked on an existing WP and selected 'Add this WP to task'
    duplicate_wp_to_task() {
        console.log("B21TaskPlanner duplicate_wp_to_task()");
        this.task.duplicate_current_wp();
    }

    // User has clicked on WP menu (Update waypoint elevation)
    update_wp_elevation() {
        console.log("User click Update WP elevation");
        this.task.current_wp().request_alt_m();
    }

    change_wp_name(new_name) {
        console.log("new wp name = ", new_name);
        this.task.current_wp().set_name(new_name);
        this.task.display_task_info();
    }

    change_wp_icao(new_icao) {
        console.log("new wp icao = ", new_icao);
        this.task.current_wp().set_icao(new_icao);
        this.task.display_task_info();
    }

    change_wp_runway(runway) {
        console.log("new wp runway = ", runway);
        this.task.current_wp().set_runway(runway);
        this.task.display_task_info();
    }

    // Runway selected from drop-down box
    select_wp_runway(runway) {
        document.getElementById("wp_runway").value = runway;
        console.log("Selected runway", runway);
        this.change_wp_runway(runway);
    }

    change_wp_alt(new_alt) {
        console.log("new wp alt = ", new_alt);
        let wp = this.task.current_wp();
        wp.alt_m = parseFloat(new_alt) / (this.settings.altitude_units == "m" ? 1 : this.M_TO_FEET);
        wp.alt_m_updated = true;
        this.task.display_task_info();
    }

    change_wp_radius(radius_str) {
        console.log("new wp radius = " + radius_str);
        let radius_m = parseFloat(radius_str) / (this.settings.wp_radius_units == "m" ? 1 : this.M_TO_FEET);
        let wp = this.task.current_wp();
        if (radius_m == null || isNaN(radius_m) || radius_m == 0) {
            wp.set_radius(null);
        } else {
            wp.set_radius(radius_m);
        }
        this.task.redraw();
        this.task.display_task_info();
    }

    change_wp_max_alt(new_alt) {
        console.log("new wp max alt = ", new_alt);
        let wp = this.task.current_wp();
        wp.max_alt_m = parseFloat(new_alt) / (this.settings.altitude_units == "m" ? 1 : this.M_TO_FEET);
        if (isNaN(wp.max_alt_m) || wp.max_alt_m == 0) {
            wp.max_alt_m = null;
        }
        this.task.display_task_info();
    }

    change_wp_min_alt(new_alt) {
        console.log("new wp min alt = ", new_alt);
        let wp = this.task.current_wp();
        wp.min_alt_m = parseFloat(new_alt) / (this.settings.altitude_units == "m" ? 1 : this.M_TO_FEET);
        if (isNaN(wp.min_alt_m) || wp.min_alt_m == 0) {
            wp.min_alt_m = null;
        }
        this.task.display_task_info();
    }

    remove_wp_from_task() {
        console.log("remove WP from task", this.task.current_wp().get_name());
        this.task.remove_wp(this.task.index);
    }

    click_soaring_task(el) {
        console.log("click_soaring_task", el.checked);
        let option = el.checked;
        this.settings.set("soaring_task", option ? 1 : 0);
    }

    click_start(e) {
        let wp = this.task.current_wp();
        if (e.checked) {
            // See if this WP is an airport (so cannot be start or finish)
            if (wp.icao != null) {
                let alert_str = "You cannot set the departure airport as a soaring task START in a flightplan.";
                alert_str += " Create another waypoint after this one and set that as start.";
                alert_str += " See General Hint (1) in help.";
                alert(alert_str);
                e.checked = false;
                return;
            }
            this.task.start_index = wp.index;
            if (wp.radius_m == null) {
                wp.radius_m = wp.DEFAULT_START_RADIUS_M;
            }
            if (this.task.finish_index != null && this.task.finish_index <= wp.index) {
                this.task.finish_index = null;
            }
        } else {
            this.task.start_index = null;
        }
        this.task.update_waypoint_icons();
        wp.display_menu();
        this.task.redraw();
        this.task.display_task_info();
    }

    click_finish(e) {
        let wp = this.task.current_wp();
        if (e.checked) {
            // See if this WP is an airport (so cannot be start or finish)
            if (wp.icao != null) {
                let alert_str = "You cannot set the destination airport as a soaring task FINISH in a flightplan.";
                alert_str += " Create a waypoint before this and set that as task FINISH.";
                alert_str += " See General Hint (1) in help.";
                alert(alert_str);
                e.checked = false;
                return;
            }
            this.task.finish_index = wp.index;
            if (wp.radius_m == null) {
                wp.radius_m = wp.DEFAULT_FINISH_RADIUS_M;
            }
            console.log("Setting finish_index to", this.task.finish_index);
            // Remove start if it is AFTER this finish
            if (this.task.start_index != null && this.task.start_index >= wp.index) {
                this.task.start_index = null;
            }
        } else {
            this.task.finish_index = null;
        }
        this.task.update_waypoint_icons();
        wp.display_menu();
        this.task.redraw();
        this.task.display_task_info();
    }

    // ********************************************************************************************
    // *********  Reset things                             ****************************************
    // ********************************************************************************************

    init_task(parent) {
        if (this.task) {
            this.task.reset();
        } else {
            // Task object to hold accumulated waypoints
            this.task = new B21_Task(this);
        }
    }

    init_replay(parent) {
        parent.replay_restart();
    }

    init_tracklog_info(parent) {
        parent.rescore_button_el.style.display = "none";
        parent.tracklog_info_el.style.display = "none";
    }

    // ********************************************************************************************
    // *********  Page buttons                             ****************************************
    // ********************************************************************************************

    // Clear the current task and start afresh
    reset_all() {
        let parent = this;
        parent.init_task(parent);
        parent.init_tracklogs(parent);
        parent.init_tracklog_info(parent);
        parent.init_replay(parent);
        parent.init_charts(parent);
        parent.init_map(parent);
        if (parent.airports) {
            parent.airports.draw(parent.map);
        }
        for (const [local_waypoints_key, waypoints] of Object.entries(parent.local_waypoints) ) {
            try {
                console.log("reset_all local_waypoints ",local_waypoints_key);
                waypoints.waypoints_loaded();
            } catch(e) {
                console.log("reset_all could not draw waypoints",local_waypoints_key, e);
            }
        }
    }

    download_pln() {
        console.log("download_pln()");
        try {
            this.task.save_file_pln();
        } catch (e) {
            alert(e);
            console.log(e);
            return;
        }
    }

    download_pln() {
        console.log("download_pln()");
        try {
            this.task.save_file_pln();
        } catch (e) {
            alert(e);
            console.log(e);
            return;
        }
    }

    download_tsk() {
        console.log("download_tsk()");
        try {
            this.task.save_file_tsk();
        } catch (e) {
            alert(e);
            return;
        }
    }

    update_elevations() {
        console.log("Update elevations");
        this.task.update_elevations();
    }

    zoom_to_task() {
        if (this.task.available()) {
            this.task.update_bounds();
            console.log([
                [this.task.min_lat, this.task.min_lng],
                [this.task.max_lat, this.task.max_lng]
            ]);
            this.map.fitBounds([
                [this.task.min_lat, this.task.min_lng],
                [this.task.max_lat, this.task.max_lng]
            ]);
            return;
        }
        for (let i=0; i<this.tracklogs.length; i++) {
            let tracklog = this.tracklogs[i];
            if (tracklog.checked) {
                if (tracklog.map_bounds != null) {
                    this.map.fitBounds(tracklog.map_bounds);
                    return;
                }
            }
        }
        alert("No task or selected tracklog to zoom to.");
    }

    toggle_settings() {
        this.settings.toggle();
    }

    // User has typed in search box
    search(e) {
        let parent = this;
        this.search_results_el.style.display = "none";
        let search_value = this.search_input_el.value.toLowerCase();
        console.log("search", search_input.value);
        if (!this.airports.available) {
            return;
        }
        if (search_value.length < 3) {
            return;
        }

        // Search airports (msfs and ourairports)
        let airports_results = this.airports.search(search_value);
        console.log("airports search results", airports_results);

        // Search local waypoints
        let local_waypoints_results = [];
        for (let i=0; i<parent.settings.local_waypoints_info.length; i++) {
            let wp_info = parent.settings.local_waypoints_info[i];
            console.log("searching local_waypoints[",wp_info.local_waypoints_key,"]");
            if (wp_info.active) {
                let waypoints = parent.local_waypoints[wp_info.local_waypoints_key];
                let wp_results = waypoints.search(search_value);
                console.log(wp_info.local_waypoints_key, "wp_results length",wp_results.length);
                local_waypoints_results = local_waypoints_results.concat(wp_results);
            }
        }

        console.log("local_waypoints search results", local_waypoints_results);

        let results = airports_results.concat(local_waypoints_results);

        // Sort results based on distance from current map center
        let map_center = this.map.getCenter();
        results.sort((a,b) => {
            let da = Geo.get_distance_m(a,map_center);
            let db = Geo.get_distance_m(b,map_center);
            return db > da ? -1 : 1;
        });

        if (results.length > 0) {
            while (this.search_results_el.firstChild) {
                this.search_results_el.removeChild(this.search_results_el.lastChild);
            }
            this.search_results_el.style.display = "block";
            for (let i = 0; i < results.length; i++) {
                let location = results[i];
                let result_el = document.createElement("div");
                result_el.className = "search_result";
                let marker_el = document.createElement("div");
                marker_el.className = location.source == "msfs_airports" ? "search_result_marker_msfs"
                                    : location.source == "ourairports" ? "search_result_marker_ourairports"
                                    : "search_result_marker_waypoint";
                result_el.appendChild(marker_el);
                //console.log("marker for ",location.source,marker_el.className);
                let text_el = document.createElement("div");
                text_el.className = "search_result_text";
                text_el.innerHTML = (location["id"] + " " + location["name"]).replaceAll(" ", "&nbsp;");
                result_el.appendChild(text_el);

                result_el.onclick = (e) => {
                    this.search_results_el.style.display = "none";
                    parent.search_result_clicked(parent, location);
                }
                this.search_results_el.appendChild(result_el);
            }
        }
    }

    search_result_clicked(parent, location) {
        console.log("result clicked", location);
        let lat = location["lat"];
        let lng = location["lng"];
        // Set the search_ident so draw() knows the redraw is due to a search and can highlight the location on map
        if (location.local_waypoints_key != null) {
            parent.local_waypoints[location.local_waypoints_key].search_location_id = location.id;
        }
        parent.airports.search_ident = location["ident"];
        parent.map.panTo([lat, lng]);
    }


    left_pane_hide_click() {
        console.log("left_pane_hide_click()");
        this.left_pane_el.style.display = "none";
        this.left_pane_show_el.style.display = "inline-block";
        this.right_pane_el.style.width = "calc(98% - 50px)";
        this.resize_charts();
        this.map.invalidateSize();
    }

    left_pane_show_click() {
        console.log("left_pane_show_click()");
        this.left_pane_el.style.display = "inline-block";
        this.left_pane_show_el.style.display = "none";
        console.log("left_pane width=", this.left_pane_el.offsetWidth);
        let left_pane_width_px = this.left_pane_el.offsetWidth;
        this.right_pane_el.style.width = "calc(98% - " + (left_pane_width_px + 25).toFixed(0) + "px)";
        this.resize_charts();
        this.map.invalidateSize();
    }

    // ********************************************************************************************
    // Replay - animates all checked tracklogs
    // ********************************************************************************************

    replay_play() {
        console.log("b21_task_planner replay_play()");
        let parent = this;
        clearTimeout(parent.replay_timer); // ensure only one running timer
        if (parent.tracklogs_checked_count(parent) == 0) {
            alert("No tracklogs selected to play.");
            return;
        }
        parent.replay_mode = true;
        parent.replay_continue(parent);
    }

    replay_continue(parent) {
        //console.log("replay_continue()");

        parent.replay_update_time(parent);

        // Iterate the tracklogs and set their current logpoints index to replay time
        for (let i = 0; i < parent.tracklogs.length; i++) {
            parent.tracklogs[i].replay_ts(parent.replay_ts);
        }

        const TIMESTEP_MS = 100;

        // Update global replay timer (in seconds)
        parent.replay_ts += parent.replay_speed * TIMESTEP_MS / 1000;

        // If we've reached the latest timestamp in all the tracklogs
        // we will terminate the repeating loop by NOT calling setTimeout
        if (parent.replay_ts > parent.replay_end_ts) {
            parent.replay_restart();
        }

        // Call this again after a fixed delay
        parent.replay_timer = setTimeout(() => {
            parent.replay_continue(parent);
        }, TIMESTEP_MS);
    }

    replay_pause() {
        console.log("replay_pause()");
        clearTimeout(this.replay_timer);
    }

    replay_restart() {
        let parent = this;
        //console.log("b21_task_planner replay_restart()");

        // Stop the replay timer running, just in case
        clearTimeout(parent.replay_timer);

        // Update the replay bar
        this.replay_speed_el.innerHTML = "x" + this.replay_speed;

        parent.replay_ts = null;

        let start_ts = null;
        for (let i = 0; i < parent.tracklogs.length; i++) {
            //console.log(`b21_task_manager resetting tracklog ${i}`);
            let tracklog = parent.tracklogs[i];
            tracklog.replay_restart();
            // Collect the begin / end timestamp bounds for all the checked logs
            if (tracklog.checked && tracklog.logpoints.length > 0) {
                // Update parent.replay_ts if this tracklog begins earlier
                let current_start_ts;
                if (this.replay_sync) {
                    current_start_ts = tracklog.get_start_ts();
                    if (current_start_ts == null) {
                        continue; // skip this tracklog
                    }
                } else {
                    current_start_ts = tracklog.get_begin_ts();
                }

                if (start_ts == null || (current_start_ts != null && start_ts > current_start_ts)) {
                    start_ts = current_start_ts;
                    //console.log("Updating b21_task_planner.replay_ts with begin time of GPX", start_ts, tracklog.get_filename());
                }

                // Update parent.replay_end_ts if this tracklog ends later
                let end_ts = tracklog.logpoints[tracklog.logpoints.length - 1].ts;
                if (parent.replay_end_ts == null || parent.replay_end_ts < end_ts) {
                    parent.replay_end_ts = end_ts;
                    console.log("Updating b21_task_planner.replay_end_ts with end time of GPX", parent.replay_end_ts, tracklog.get_filename());
                }
            }
        }
        parent.replay_ts = start_ts;

        // Given current start_ts, set time offset for each log
        for (let i = 0; i < parent.tracklogs.length; i++) {
            let tracklog = parent.tracklogs[i];
            if (this.replay_sync) {
                tracklog.replay_update_offset(start_ts);
            } else {
                tracklog.replay_update_offset(null);
            }

        }

        parent.replay_mode = false;
        parent.replay_update_time(parent);
    }

    replay_slower() {
        let replay_inc = this.replay_speed <= 5 ? 1 : 5;
        this.replay_speed -= replay_inc;
        if (this.replay_speed < 1) {
            this.replay_speed = 1;
        }
        this.replay_speed_el.innerHTML = "x" + this.replay_speed;
    }

    replay_faster() {
        let replay_inc = this.replay_speed < 5 ? 1 : 5;
        this.replay_speed += replay_inc;
        this.replay_speed_el.innerHTML = "x" + this.replay_speed;
    }

    // User has clicked the replay_hide_chart button to show/hide the charts
    replay_hide_chart() {
        let parent = this;
        console.log("replay_hide_chart currently charts_hidden = ", parent.charts_hidden);
        if (parent.charts_hidden) {
            parent.show_charts(parent);
        } else {
            parent.hide_charts(parent);
        }
        this.map.invalidateSize();
    }

    // User has clicked the replay_hide_tracks button to show/hide the tracks on the map
    replay_hide_tracks() {
        let parent = this;
        console.log("replay_hide_tracks currently tracks_hidden = ", parent.tracks_hidden);
        if (parent.tracks_hidden) {
            parent.show_tracks_on_map(parent);
            parent.replay_hide_tracks_el.innerHTML = "hide map tracks";
        } else {
            parent.hide_tracks_on_map(parent);
            parent.replay_hide_tracks_el.innerHTML = "show map tracks";
        }
    }

    replay_sync_click() {
        if (this.replay_sync_el.checked) {
            console.log("replay_sync_click ON");
            if (!this.task.available()) {
                alert("You must have a task loaded for 'Sync starts' to work");
                this.replay_sync_el.checked = false;
                return;
            }
            this.replay_sync = true;
            this.replay_restart();
        } else {
            console.log("replay_sync_click OFF");
            this.replay_sync = false;
            this.replay_restart();
        }
    }

    // Update the time displayed in the replay bar
    replay_update_time(parent) {
        let ts = parent.replay_ts == null ? 0 : parent.replay_ts;

        this.replay_time_el.innerHTML = (new Date(ts * 1000)).toUTCString().substring(5, 25) + "Z";
    }

    // ********************************************************************************************
    // *********  Tabs Area                                ****************************************
    // ********************************************************************************************

    tab_task_click() {
        this.show_task_info();
        this.close_tracklog_info(); // Close tracklog info popup window
    }

    tab_tracklogs_click() {
        this.show_tracklogs();
        this.close_tracklog_info(); // Close tracklog info popup window
    }

    rescore_click() {
        this.score_tracklogs();
    }

    // Show task info
    show_task_info() {
        this.update_rescore_button();
        this.task.display_task_info();
        this.tab_task_el.className = "tab_active";
        //this.task_info_el.style.display = "block";
        this.tab_tracklogs_el.className = "tab_inactive";
        this.tracklogs_el.style.display = "none";
    }

    // Show list of tracklogs
    show_tracklogs() {
        let parent = this;
        console.log("show_tracklogs()");
        this.update_rescore_button();
        this.display_tracklogs(parent);
        this.tab_task_el.className = "tab_inactive";
        this.tab_tracklogs_el.className = "tab_active";
        this.tracklogs_el.style.display = "block";
        this.task.hide_task_info();
    }

    update_rescore_button() {
        if (this.task.available()) {
            this.rescore_button_el.style.display = "inline-flex";
        } else {
            this.rescore_button_el.style.display = "none";
        }
    }

    // ********************************************************************************************
    // *********  Tracklogs                                ****************************************
    // ********************************************************************************************

    init_tracklogs(parent) {
        // Discard existing tracklogs
        this.tracklogs = [];
        // Empty the 'tracklogs' div
        B21_Utils.clear_div(this.tracklogs_el);
        // Hide the tabs in the left-pane
        parent.left_pane_tabs_el.style.display = "none";
    }

    display_tracklogs(parent) {

        B21_Utils.clear_div(this.tracklogs_el);

        let tracklogs_table_el = document.createElement("table");
        tracklogs_table_el.id = "tracklogs_table";

        // Create array with tracklogs sorted by speed (no task, or incompleted task => 0)
        let sorted_tracklog_indexes = [];
        for (let i=0; i < parent.tracklogs.length; i++) {
            let tracklog = parent.tracklogs[i];
            let speed = tracklog.scoring_data == null ? 0 :
                tracklog.scoring_data.finished_ok == null ? 0 :
                tracklog.scoring_data.finished_ok.task_speed_ms ;

            sorted_tracklog_indexes.push({ tracklog_index: i, speed: speed});
        }
        sorted_tracklog_indexes.sort( (a,b) => { return b.speed - a.speed; } );

        // Add tracklog entries sorted by speed
        for (let i = 0; i < sorted_tracklog_indexes.length; i++) {
            let tracklog_index = sorted_tracklog_indexes[i].tracklog_index;
            parent.display_tracklogs_entry(tracklogs_table_el, parent.tracklogs[tracklog_index]);
        }
        parent.tracklogs_el.appendChild(tracklogs_table_el);
    }

    // * Handle loaded tracklog
    tracklog_loaded(parent, tracklog) {
        tracklog.draw_map();

        parent.left_pane_tabs_el.style.display = 'block';

        parent.draw_map(parent);

        // zoom the map to the polyline
        //DEBUG before zooming to tracklog check to see if we have already zoomed to task
        parent.map.fitBounds(tracklog.map_bounds);

        tracklog.draw_chart();
        if (parent.task != null) {
            tracklog.score_task();
        }

        this.replay_restart();

        parent.show_tracklogs();
    }

    set_current_tracklog(index) {
        for (let i = 0; i < this.tracklogs.length; i++) {
            if (i == index) {
                this.tracklogs[i].tracklogs_entry_el.className = "tracklogs_entry_current";
            } else {
                this.tracklogs[i].tracklogs_entry_el.className = "tracklogs_entry";
            }
        }
        this.tracklog_index = index;
        this.tracklogs[index].show();
    }

    score_tracklogs() {
        let parent = this;
        for (let i = 0; i < parent.tracklogs.length; i++) {
            parent.tracklogs[i].score_task();
        }
        parent.display_tracklogs(parent);
    }

    // Create and display an entry on the "Tracklogs" tab
    display_tracklogs_entry(table_el, tracklog) {
        let parent = this;
        // The index of this tracklog is tracklog.index
        // The task planner 'current tracklog' is parent.tracklog_index
        //console.log("Displaying tracklogs entry tracklog.index=" + tracklog.index + " current=" + parent.tracklog_index);
        let tracklogs_entry_el = document.createElement("tr");
        tracklogs_entry_el.className = tracklog.index == this.tracklog_index ? "tracklogs_entry_current" : "tracklogs_entry";

        // ***********************************
        // entry_checkbox
        // ***********************************
        let checkbox_td_el = document.createElement("td");
        checkbox_td_el.className = "tracklogs_entry_checkbox";
        tracklogs_entry_el.appendChild(checkbox_td_el);

        let checkbox_el = document.createElement("input");
        checkbox_el.setAttribute("type", "checkbox");
        if (tracklog.checked) {
            checkbox_el.setAttribute("checked", "checked");
        }

        // Set up click callback, where e will be the element clicked
        checkbox_el.addEventListener("click", (e) => {
            parent.tracklog_checkbox_clicked(parent, e, tracklog.index);
        });

        checkbox_td_el.appendChild(checkbox_el);

        // ***********************************
        // entry_info
        // ***********************************
        let tracklogs_entry_info_el = document.createElement("td"); // TrackLog name
        tracklogs_entry_info_el.className = "tracklogs_entry_info";
        tracklogs_entry_info_el.addEventListener("click", (e) => {
            parent.set_current_tracklog(tracklog.index);
            parent.show_tracklog_info();
        });
        //tracklogs_entry_info_el.addEventListener('mouseenter', (e) => {
        //    tracklog.scroll_chart();
        //});
        // info: name
        let name_el = document.createElement("div");
        let name_str = tracklog.get_name();
        name_el.innerHTML = name_str;
        let name_size = Math.max(...(name_str.split(/[\s-]+/).map(el => el.length))); // find length of longest word in name
        if (name_size > 28) {
            name_el.style = "font-size: " + (14 * 28 / name_size).toFixed(0) + "px;"; // scale font down from 14px
        }
        tracklogs_entry_info_el.appendChild(name_el);

        // info: filename
        let filename_el = document.createElement("div");
        let filename_str = tracklog.get_filename();
        filename_el.innerHTML = filename_str;
        let filename_size = Math.max(...(filename_str.split(/[\s-]+/).map(el => el.length))); // find length of longest word in name
        if (filename_size > 28) {
            filename_el.style = "font-size: " + (14 * 28 / filename_size).toFixed(0) + "px;"; // scale font down from 14px
        }
        tracklogs_entry_info_el.appendChild(filename_el);

        // info: begin_date
        let begin_date_el = document.createElement("div");
        begin_date_el.innerHTML = "Begins: " + (new Date(tracklog.get_begin_ts() * 1000)).toUTCString().substring(5, 22) + "Z";
        tracklogs_entry_info_el.appendChild(begin_date_el);

        tracklogs_entry_el.appendChild(tracklogs_entry_info_el);

        // ***********************************************************
        // entry_colors - this shows the color-code for this tracklog
        // ***********************************************************
        let entry_colors_el = document.createElement("td"); // TrackLog colors bar

        // Create the DOM object (3 stacked divs) to hold the tracklog colors
        let colors_el = document.createElement("div");
        colors_el.className = "tracklogs_entry_colors"; // set width of column
        entry_colors_el.appendChild(colors_el);

        let color_top_el = document.createElement("div");
        color_top_el.className = "tracklogs_entry_color_top";
        colors_el.appendChild(color_top_el);

        let color_middle_el = document.createElement("div");
        color_middle_el.className = "tracklogs_entry_color_middle";
        colors_el.appendChild(color_middle_el);

        let color_bottom_el = document.createElement("div");
        color_bottom_el.className = "tracklogs_entry_color_bottom";
        colors_el.appendChild(color_bottom_el);

        //console.log(`display_tracklogs_entry setting tracklog ${tracklog.name} color1=${tracklog.color1} color2=${tracklog.color2}`);
        color_top_el.style.backgroundColor = tracklog.color1;
        color_middle_el.style.backgroundColor = tracklog.color2 == null ? tracklog.color1 : tracklog.color2;
        color_bottom_el.style.backgroundColor = tracklog.color1;

        //console.log(`display_tracklogs_entry set tracklog ${tracklog.name} color_top_el=${color_top_el.style.backgroundColor}`);

        tracklogs_entry_el.appendChild(entry_colors_el);

        // ***********************************
        // entry_finished
        // ***********************************
        let tracklogs_entry_finished_el = document.createElement("td"); // TrackLog finished task indicator
        tracklogs_entry_finished_el.className = "tracklogs_entry_finished";
        if (parent.task.waypoints.length > 0) {
            if (tracklog.is_finished()) {
                tracklogs_entry_finished_el.style.backgroundColor = "lightgreen";
                if (tracklog.scoring_data["finished_ok"] != null && tracklog.scoring_data.finished_ok["task_speed_ms"] != null) {
                    let speed_ms = tracklog.scoring_data.finished_ok["task_speed_ms"];
                    let speed = this.settings.distance_units == "km" ? speed_ms * this.MS_TO_KPH : speed_ms * this.MS_TO_KNOTS;
                    tracklogs_entry_finished_el.innerHTML = speed.toFixed(1) + " " + (this.settings.distance_units == "km" ?
                        "kph" : "knots");
                }
            } else {
                tracklogs_entry_finished_el.style.backgroundColor = "pink";
            }
        }
        //tracklogs_entry_finished_el.addEventListener("click",(e) => {
        //    parent.set_current_tracklog(tracklog.index);
        //});
        //tracklogs_entry_finished_el.addEventListener('mouseenter', (e) => {
        //    tracklog.scroll_chart();
        //});
        //tracklogs_entry_finished_el.innerHTML = "X";

        tracklogs_entry_el.appendChild(tracklogs_entry_finished_el);

        table_el.appendChild(tracklogs_entry_el);

        tracklog.tracklogs_entry_el = tracklogs_entry_el;
    }

    // User has checked or unchecked the checkbox in the "Tracklogs" header
    tracklogs_select_all_clicked() {
        let parent = this;
        console.log("tracklogs_select_all_clicked", parent.tracklogs_select_all_el.checked);
        if (parent.tracklogs_select_all_el.checked) {
            for (let i=0; i<parent.tracklogs.length; i++) {
                parent.tracklogs[i].checked = true;
                parent.tracklogs[i].show();
            }
        } else {
            for (let i=0; i<parent.tracklogs.length; i++) {
                parent.tracklogs[i].checked = false;
                parent.tracklogs[i].hide();
            }
        }
        parent.display_tracklogs(parent);
        parent.draw_map(parent);
        parent.replay_restart();
    }

    // Handle tick of checkbox on Tracklogs tab
    tracklog_checkbox_clicked(parent, e, tracklog_index) {
        console.log(`tracklog_checkbox_clicked ${tracklog_index} checked=${e.target.checked}`);

        let checked_count = parent.tracklogs_checked_count(parent);
        console.log("checked_count", checked_count);

        if (e.target.checked) {
            // CHECKED
            console.log("tracklog was checked");
            parent.set_current_tracklog(tracklog_index);
        } else {
            // UNCHECKED
            console.log("tracklog was unchecked");
            parent.tracklog_info_el.style.display = "none";
            parent.tracklogs[tracklog_index].hide();
        }
        console.log("tracklog_checkbox_clicked: redrawing map");
        parent.draw_map(parent);
        parent.replay_restart();
    }

    // Return the count of how many tracklogs currently have ticked checkboxes
    tracklogs_checked_count(parent) {
        let count = 0;
        if (parent.tracklogs != null) {
            for (let i = 0; i < parent.tracklogs.length; i++) {
                if (parent.tracklogs[i].checked) {
                    count++;
                }
            }
        }
        return count;
    }

    // Show single tracklog info
    show_tracklog_info() {
        this.tracklog_info_el.style.display = "block";
        if (this.tracklog_index != null) {
            this.tracklogs[this.tracklog_index].display_info();
        } else {
            document.getElementById("tracklog_info").innerHTML = "No tracklogs loaded";
        }
    }

    // Close the tracklog_info panel
    close_tracklog_info() {
        if (this.tracklogs.length > 0 && this.tracklog_index != null && this.tracklog_index < this.tracklogs.length) {
            this.tracklogs[this.tracklog_index].tracklog_info_exit();
        }
        this.tracklog_info_el.style.display = "none";
    }

    resize_charts() {
        for (let i = 0; i < this.tracklogs.length; i++) {
            let tracklog = this.tracklogs[i];
            if (tracklog.checked) {
                tracklog.resize_chart();
            }
        }
    }

    // **************************************************************
    // Waypoints
    // **************************************************************

    // Add a new B21_Local_Waypoints object to .local_waypoints
    add_local_waypoints(local_waypoints_key, waypoints) {
        this.local_waypoints[local_waypoints_key] = waypoints;
    }

    // Return true if local waypoints with given key are already loaded
    local_waypoints_loaded_status(local_waypoints_key) {
        return this.local_waypoints[local_waypoints_key] != null;
    }

    // Used by settings to tell this planner new waypoints have been loaded
    local_waypoints_load_completed(local_waypoints_key) {
        this.local_waypoints[local_waypoints_key].waypoints_loaded();
    }

    // hide the markers for given local waypoints key
    local_waypoints_hide(local_waypoints_key) {
        this.local_waypoints[local_waypoints_key].hide();
    }

    // Remove loaded waypoints entry from .local_waypoints
    local_waypoints_delete(local_waypoints_key) {
        delete this.local_waypoints[local_waypoints_key];
    }

    local_waypoints_set_active(local_waypoints_key) {
        this.local_waypoints[local_waypoints_key].active = true;
    }

    local_waypoints_set_inactive(local_waypoints_key) {
        this.local_waypoints[local_waypoints_key].active = false;
    }

} // End class B21_TaskPlanner
