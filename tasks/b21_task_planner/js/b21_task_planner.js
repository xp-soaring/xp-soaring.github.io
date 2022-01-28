"use strict"

class B21_TaskPlanner {

    constructor() {
        this.M_TO_FEET = 3.28084;
        this.M_TO_MILES = 0.000621371;
        this.MS_TO_KPH = 3.6;
        this.MS_TO_KNOTS = 1.94384;
    }

    init() {
        let parent = this;

        this.skyvector_button_el = document.getElementById("skyvector_button"); // So we can update action URL
        this.chart_el = document.getElementById("chart");
        this.left_pane_tabs_el = document.getElementById("left_pane_tabs");

        this.tab_task_el = document.getElementById("tab_task");
        this.tab_tracklogs_el = document.getElementById("tab_tracklogs");
        this.tab_tracklog_el = document.getElementById("tab_tracklog");
        this.task_info_el = document.getElementById("task_info");
        this.tracklogs_info_el = document.getElementById("tracklogs_info");
        this.tracklog_info_el = document.getElementById("tracklog_info");

        this.tracklogs = []; // Loaded tracklogs
        this.tracklog_index = null; // index of current tracklog

        this.settings = new B21_Settings(this); // Load settings from localStorage

        this.init_drop_zone();

        this.init_map();

        this.airports = new B21_Airports(this, this.map);

        this.airports.init();
        //this.init_airports();

        // Task object to hold accumulated waypoints
        this.task = new B21_Task(this);

        // Load parameters from querystring into this.querystring object
        try {
            this.querystring = this.parse_querystring();
        } catch (e) {
            this.querystring = null;
            console.log("parse_querystring fail");
        }
        console.log(this.querystring);

        this.load_pln_url(this.querystring);
    }

    parse_querystring() {
        var search = location.search.substring(1);
        console.log(search);
        return JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function(key, value) {
            return key === "" ? value : decodeURIComponent(value)
        })
    }

    init_map() {

        let parent = this;

        // Where you want to render the map.
        const map_el = document.getElementById('map');

        this.canvas_renderer = L.canvas();

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
        this.airport_markers = L.layerGroup(); //.addTo(this.map);

        let open_railway_map = L.tileLayer('https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org">OpenRailwayMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });

        this.base_maps = {
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

        this.map_layers = {
            "Airports": this.airport_markers,
            "Railways": open_railway_map
        }

        this.map = L.map(map_el, {
            minZoom: 5,
            maxZoom: 16,
            layers: [this.base_maps[this.settings.base_layer_name], this.airport_markers]
        });
        //this.tiles_outdoor.addTo(this.map);
        //this.tiles_opentopomap.addTo(this.map);
        //esri_world_imagery.addTo(this.map);

        this.map.on("baselayerchange", (e) => {
            console.log("baselayerchange", e);
            this.settings.set("base_layer_name", e.name);
        });

        L.control.layers(this.base_maps, this.map_layers).addTo(this.map);

        this.load_map_coords();

        this.update_skyvector_link(parent.map.getCenter(), parent.map.getZoom());

        this.create_baro_marker(parent);

        this.set_map_events(parent);

    }

    set_map_events(parent) {
        // Set up the map mouse click callbacks
        this.map.on('click', (e) => {
            parent.map_left_click(parent, e);
        });

        this.map.on('contextmenu', (e) => {
            parent.map_right_click(parent, e);
        });

        this.map.on("moveend", () => {
            console.log("moveend");
            parent.save_map_coords(parent.map.getCenter(), parent.map.getZoom());
            parent.update_skyvector_link(parent.map.getCenter(), parent.map.getZoom());
            parent.airports.draw();
        });
        this.map.on('zoomend', () => { // Will also call moveend
            console.log("zoomend");
        });
    }

    create_baro_marker(parent) {
        let position = new L.latLng(0, 0);
        parent.baro_marker = L.circleMarker(position, {
            color: "darkred",
            radius: 30
        });
        parent.baro_marker.addTo(parent.map);
        parent.baro_marker.bindPopup("Foo<br/>Bar<br/>FUBAR");
        parent.baro_marker.on('mouseover', function(event) {
            parent.baro_marker.openPopup();
        });
        parent.baro_marker.on('mouseout', function(event) {
            parent.baro_marker.closePopup();
        });
        parent.baro_marker.on('click', (e) => {
            console.log("User baro_marker click");
        });

    }

    // ********************************************************************************************
    // *********  Flight Plan handling                     ****************************************
    // ********************************************************************************************

    init_drop_zone() {
        this.drop_zone_el = document.getElementById("drop_zone");
        this.drop_zone_el.style.display = "block";
        let parent = this;
        this.drop_zone_el.ondragover = (e) => {
            parent.dragover_handler(e);
        };
        this.drop_zone_el.ondrop = (e) => {
            parent.drop_handler(parent, e);
        };
    }

    drop_handler(parent, ev) {
        console.log('File(s) dropped');
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();

        if (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) {
            console.log(`dataTransfer.items ${ev.dataTransfer.items.length} found`);
            // Use DataTransferItemList interface to access the file(s)
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (ev.dataTransfer.items[i].kind === 'file') {
                    let file = ev.dataTransfer.items[i].getAsFile();
                    console.log('DataTransferItemList... file[' + i + '].name = ' + file.name);
                    let reader = new FileReader();
                    reader.onload = (e) => {
                        parent.handle_drop(parent, e, file.name);
                    }
                    console.log("reader.readAsText", file.name);
                    reader.readAsText(file);
                }
            }
        } else {
            console.log("dataTransfer.items not found, using dataTransfer.files");
            // Use DataTransfer interface to access the file(s)
            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                let file = ev.dataTransfer.files[i];
                console.log('DataTransfer... file[' + i + '].name = ' + file.name);
                let reader = new FileReader();
                reader.addEventListener("load", (e) => {
                    parent.handle_drop(parent, e);
                });
                // event fired when file reading failed
                reader.addEventListener('error', (e) => {
                    alert('Error : Failed to read file');
                });
                reader.readAsText(file);
            }
        }
    }

    handle_drop(parent, e, name = null) {
        console.log("handle_drop", name, e);
        if (name == null) {
            console.log("No name for dropped file - aborting");
            return;
        }
        if (name.toLowerCase().endsWith(".pln")) {
            parent.reset();
            parent.handle_pln_str(e.target.result, name);
            return;
        }
        if (name.toLowerCase().endsWith(".gpx")) {
            parent.handle_gpx_str(e.target.result, name);
            return;
        }
    }

    dragover_handler(ev) {
        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
    }

    // ********************************************************************************************
    // *********  Handle PLN file (from drop or URL)                   ****************************
    // ********************************************************************************************

    // Load a PLN file from param_obj.pln URL
    load_pln_url(param_obj) {
        if (param_obj == null) {
            return;
        }

        if (param_obj["pln"] == null) {
            return;
        }

        let request_str = param_obj["pln"];

        console.log("load_pln_url", request_str);
        fetch(request_str).then(response => {
            if (!response.ok) {
                console.log("User PLN url fetch error");
                return null;
            }
            return response.text();
        }).then(result_str => {
            console.log("load_pln_url return ok");
            this.handle_pln_str(result_str);
        }).catch(error => {
            console.error('Network error accessing user PLN URL:', error);
        });
    }

    //DEBUG load task should score TrackLogs
    handle_pln_str(file_str) {
        console.log("handle string containing PLN XML");
        this.task.load_flightplan(file_str);
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

    handle_gpx_str(file_str, name) {
        console.log("loading tracklogs[" + this.tracklogs.length + "]", name);
        let tracklog = new B21_TrackLog(this.tracklogs.length, this, this.map);
        this.tracklogs.push(tracklog);
        this.tracklog_index = this.tracklogs.length-1;
        tracklog.load_gpx(file_str, name);
        tracklog.draw_map();
        // zoom the map to the polyline
        this.map.fitBounds(tracklog.polyline.getBounds());
        // If this is the 1st time we're drawing the chart, adjust size of map
        if (this.tracklogs.length == 1) {
            let map_el = document.getElementById("map");
            map_el.style.height = "75%";
            this.chart_el.style.display = "block";
            this.map.invalidateSize();

            this.left_pane_tabs_el.style.display = 'block';
        }

        tracklog.draw_chart();
        if (this.task != null) {
            tracklog.score_task();
        }
        this.show_tracklog_info();
    }

    // ********************************************************************************************
    // *********  Persist map position and scale between sessions      ****************************
    // ********************************************************************************************

    save_map_coords(center, zoom) {
        console.log(center.toString(), zoom);
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
        this.add_new_wp(position);
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
        return '<div onclick="b21_task_planner.' + menu_function_name + '()" class="menuitem">' + menu_str + '</div>';
    }

    // User has clicked somewhere on the map
    add_new_wp(position) {
        console.log("add_new_wp " + position);
        let wp = this.task.add_new_wp(position);

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

    //DEBUG TODO implement WP database
    delete_wp_from_database() {
        console.log("delete WP from database", this.task.current_wp().get_name());
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
    // *********  Page buttons                             ****************************************
    // ********************************************************************************************

    // Clear the current task and start afresh
    reset() {
        this.task.reset();
    }

    download_pln() {
        console.log("download_pln()");
        try {
            this.task.save_file_pln();
        } catch (e) {
            alert(e);
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

    reset_map() {
        this.task.update_bounds();
        console.log([
            [this.task.min_lat, this.task.min_lng],
            [this.task.max_lat, this.task.max_lng]
        ]);
        this.map.fitBounds([
            [this.task.min_lat, this.task.min_lng],
            [this.task.max_lat, this.task.max_lng]
        ]);
    }

    toggle_settings() {
        this.settings.toggle();
    }

    set_altitude_units_m() {
        this.settings.set("altitude_units", "m");
        this.task.display_task_info();
    }

    set_altitude_units_feet() {
        this.settings.set("altitude_units", "feet");
        this.task.display_task_info();
    }

    set_speed_units_kph() {
        this.settings.set("speed_units", "kph");
        this.task.display_task_info();
    }

    set_speed_units_knots() {
        this.settings.set("speed_units", "knots");
        this.task.display_task_info();
    }


    // User has typed in search box
    //DEBUG pan the map to the clicked airport result, and highlight that airport
    search(e) {
        let results_el = document.getElementById("search_results");
        results_el.style.display = "none";
        let search_input_el = document.getElementById("search_input");
        let search_value = search_input_el.value.toLowerCase();
        console.log("search", search_input.value);
        if (!this.airports.available) {
            return;
        }
        if (search_value.length < 3) {
            return;
        }
        this.airports.search(search_value, results_el);
    }

    // ********************************************************************************************
    // TrackLog stuff
    // ********************************************************************************************

    score_tracklogs() {
        for (let i=0; i<this.tracklogs.length; i++) {
            this.tracklogs[i].score_task();
        }
    }

    //DEBUG tracklog select should update map, chart
    set_current_tracklog(index) {
        this.tracklog_index = index;
        this.show_tracklog_info();
    }

    // ********************************************************************************************
    // *********  Tabs                                     ****************************************
    // ********************************************************************************************

    tab_task() {
        this.show_task_info();
    }

    tab_tracklogs() {
        this.show_tracklogs_info();
    }

    tab_tracklog() {
        this.show_tracklog_info();
    }

    // Show task info
    show_task_info() {
        this.task.display_task_info();
        this.tab_task_el.className = "tab_active";
        this.task_info_el.style.display = "block";
        this.tab_tracklogs_el.className = "tab_inactive";
        this.tracklogs_info_el.style.display = "none";
        this.tab_tracklog_el.className = "tab_inactive";
        this.tracklog_info_el.style.display = "none";
    }

    // Show list of tracklogs
    show_tracklogs_info() {
        console.log("tab_tracklogs()");
        this.display_tracklogs_info();
        this.tab_task_el.className = "tab_inactive";
        this.task_info_el.style.display = "none";
        this.tab_tracklogs_el.className = "tab_active";
        this.tracklogs_info_el.style.display = "block";
        this.tab_tracklog_el.className = "tab_inactive";
        this.tracklog_info_el.style.display = "none";
    }

    // Show single tracklog info
    show_tracklog_info() {
        if (this.tracklog_index != null) {
            this.tracklogs[this.tracklog_index].display_info();
        } else {
            document.getElementById("tracklog_info").innerHTML = "No tracklogs loaded";
        }
        this.tab_task_el.className = "tab_inactive";
        this.task_info_el.style.display = "none";
        this.tab_tracklogs_el.className = "tab_inactive";
        this.tracklogs_info_el.style.display = "none";
        this.tab_tracklog_el.className = "tab_active";
        this.tracklog_info_el.style.display = "block";
    }

    // ********************************************************************************************
    // *********  Tracklogs                                ****************************************
    // ********************************************************************************************

    display_tracklogs_info() {
        while (this.tracklogs_info_el.firstChild) {
            this.tracklogs_info_el.removeChild(this.tracklogs_info_el.lastChild);
        }
        let tracklogs_table_el = document.createElement("table");
        tracklogs_table_el.id = "task_info";

        // Column headings
        let headings_el = document.createElement("tr");
        let heading1 = document.createElement("th"); // WP #
        headings_el.appendChild(heading1);

        tracklogs_table_el.appendChild(headings_el);

        // Add tracklog
        for (let i = 0; i < this.tracklogs.length; i++) {
            this.display_tracklogs_entry(tracklogs_table_el, this.tracklogs[i]);
        }
        this.tracklogs_info_el.appendChild(tracklogs_table_el);
    }

    display_tracklogs_entry(table_el, tracklog) {
        console.log("Displaying tracklogs entry tracklog.index="+tracklog.index+" current="+this.tracklog_index);
        let tracklog_entry_el = document.createElement("tr");
        tracklog_entry_el.className = tracklog.index == this.tracklog_index ? "tracklogs_info_entry_current" : "tracklogs_info_entry";
        let parent = this;
        let tracklog_name_el = document.createElement("td"); // TrackLog name
        tracklog_name_el.className = "tracklogs_info_entry_name";
        tracklog_name_el.onclick = function() {
            parent.set_current_tracklog(tracklog.index);
        };
        tracklog_name_el.innerHTML = tracklog.get_name() + "<br/>" + tracklog.get_filename();

        tracklog_entry_el.appendChild(tracklog_name_el);

        table_el.appendChild(tracklog_entry_el);
    }

} // End class B21_TaskPlanner
