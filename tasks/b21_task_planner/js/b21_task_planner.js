"use strict"

class B21TaskPlanner {

    constructor() {
    }

    init() {
        let parent = this;

        this.load_settings();

        // Where you want to render the map.
        const element = document.getElementById('map');

        // Create Leaflet map on map element.
        this.map = L.map(element);

        this.tiles_outdoor = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYjIxc29hcmluZyIsImEiOiJja3M0Z2o0ZWEyNjJ1MzFtcm5rYnAwbjJ6In0.frJxiv-ZUV8e2li7r4_3_A', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/outdoors-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiYjIxc29hcmluZyIsImEiOiJja3M0Z2o0ZWEyNjJ1MzFtcm5rYnAwbjJ6In0.frJxiv-ZUV8e2li7r4_3_A'
        });

        this.tiles_outdoor.addTo(this.map);

        // Target's GPS coordinates.
        const target = L.latLng(52, 0);

        // Set map's center to target with zoom 14.
        this.map.setView(target, 11);

        // Set up the map mouse click callbacks
        this.map.on('click', (e) => {parent.map_left_click(parent, e);} );

        this.map.on('contextmenu', (e) => {parent.map_right_click(parent, e);} );

        // Task object to hold accumulated waypoints
        this.task = new Task(this);
    }

    map_left_click(parent, e) {
        this.current_latlng = e.latlng;
        this.add_wp();
    }

    map_right_click(parent, e) {

        this.current_latlng = e.latlng; // Preserve 'current' latlng so page methods can use it

        let menu_str = '<div class="menu">';
        menu_str += parent.menuitem("Add WP", "add_wp");
        menu_str += parent.menuitem("Add Airport", "add_airport");
        menu_str += '</div>'; // end menu

        var popup = L.popup()
            .setLatLng(this.current_latlng)
            .setContent(menu_str)
            .openOn(parent.map);
    }

    menuitem(menu_str, menu_function_name) {
        return '<div onclick="b21_task_planner.'+menu_function_name+'()" class="menuitem">'+menu_str+'</div>';
    }

    add_wp() {
        console.log("add wp " + this.current_latlng);
        let wp = this.task.add_wp(this.current_latlng);

        this.map.closePopup();

        wp.get_alt_m();

        wp.display_menu();
    }

    // User has clicked on an existing WP and selected 'Add this WP to task'
    add_wp_to_task() {
        console.log("B21TaskPlanner add_wp_to_task()");
        this.task.append_current_wp_to_task();
    }

    add_airport() {
        console.log("add airport" + this.current_latlng);
    }

    change_wp_name(new_name) {
        console.log("new wp name = ",new_name);
        this.task.current_wp().name = new_name;
        this.task.display_task_list();
    }

    change_wp_alt(new_alt) {
        console.log("new wp alt = ",new_alt);
        this.task.current_wp().alt_m = parseFloat(new_alt);
        this.task.display_task_list();
    }

    delete_wp() {
        console.log("delete WP", this.task.current_wp().get_name());
        this.task.remove_wp(this.task.index);
    }

    reset() {
        this.task.reset();
    }

    download() {
        console.log("download()");
    }

    toggle_elevation_units() {
        this.toggle_setting("altitude_units");
        document.getElementById("elevation_units").innerHTML = "Elevation in "+this.altitude_units;
    }

    toggle_setting(var_name) {
        console.log("toggle",var_name);
        let index = -1;
        for (let i=0; i<this.settings_values[var_name].length; i++) {
            if ( this[var_name] == this.settings_values[var_name][i] ) {
                index = i;
                break;
            }
        }
        if (index == -1) {
            this[var_name] = this.settings_values[var_name][0];
        } else {
            index += 1;
            if (index >= this.settings_values[var_name].length) {
                index = 0;
            }
            this[var_name] = this.settings_values[var_name][index];
        }
        console.log("toggle index", index);
        localStorage.setItem('b21_task_planner_'+var_name, this.var_name);
    }

    get_setting(var_name) {
        let value = window.localStorage.getItem('b21_task_planner_'+var_name);
        let error = true;
        for (let i=0; i<this.settings_values[var_name].length; i++) {
            if (value == this.settings_values[var_name][i]) {
                this[var_name] = value;
                error = false;
                break;
            }
        }
        if (error) {
            this[var_name] = this.settings_values[var_name][0];
        }
    }

    load_settings() {
        this.settings_values = {
            altitude_units: ["feet","meters"],
            distance_units: ["km", "miles" ]
        };
        this.get_setting("altitude_units");
        this.get_setting("distance_units");

        console.log("load_settings",this.altitude_units, this.distance_units);
    }
}

// ******************************************************************************
// ***********   WP class                  **************************************
// ******************************************************************************

class WP {
    constructor(planner, index, latlng) {
        console.log("new WP", latlng);
        this.planner = planner; // reference to B21TaskPlanner instance
        let marker = L.marker(latlng,
                              { draggable: true,
                                autoPan: true
        });
        let parent = this;
        marker.on("drag", function(e) {
            let marker = e.target;
            parent.latlng = marker.getLatLng();
            parent.planner.task.redraw();
        });
        marker.on("dragend", function (e) {
            let marker = e.target;
            parent.get_alt_m();
        });
        marker.on("click", function(e) {
            parent.planner.task.index = parent.index;
            parent.display_menu();
            parent.planner.task.display_task_list(); // update highlight of current WP
        });
        marker.addTo(planner.map);
        this.marker = marker;
        this.index = index;
        this.name = null;
        this.latlng = latlng;
        this.alt_m = 123;
        this.task_line = null;
    }

    get_alt_m() {
        let request_str = "https://api.open-elevation.com/api/v1/lookup?locations="+this.latlng.lat+","+this.latlng.lng;
        console.log(request_str);
        fetch(request_str).then(response => {
            return response.json();
        }).then( results => {
            console.log(results["results"][0]["elevation"]);
            this.alt_m = results["results"][0]["elevation"];
            this.display_menu();
            this.planner.task.display_task_list();
        });
    }

    get_name() {
        if (this.name == null) {
            return "WP "+this.index;
        }
        return this.name;
    }

    display_menu() {
        let form_str = 'Name: <input onchange="change_wp_name(this.value)" value="'+this.get_name() + '"</input>';
        form_str += '<br/>Alt: <input onchange="change_wp_alt(this.value)" value="' + this.alt_m + '"</input>' + " m";
        form_str += '<div class="menu">';
        form_str += this.planner.menuitem("Add this WP to task","add_wp_to_task");
        form_str += this.planner.menuitem("Delete this WP","delete_wp");
        form_str += '</div>';
        var popup = L.popup({ offset: [0,-25]})
            .setLatLng(this.latlng)
            .setContent(form_str)
            .openOn(this.planner.map);
    }

    copy(index) {
        let wp = new WP(this.planner, index, this.latlng);
        wp.name = this.name;
        wp.alt_m = this.alt_m;
        return wp;
    }
}

// ******************************************************************************
// ***********   Task class                **************************************
// ******************************************************************************

class Task {
    constructor(planner) {
        this.planner = planner; // Reference to B21TaskPlanner instance
        this.task_el = document.getElementById("task_list");
        this.init();
    }

    init() {
        this.waypoints = [];
        this.index = 0; // Index of current waypoint
        this.start_index = 0;
        this.finish_index = 0;
    }

    current_wp() {
        return this.waypoints[this.index];
    }

    add_wp(latlng) {
        this.index = this.waypoints.length;
        console.log("task adding wp",this.index);
        let wp = new WP(this.planner, this.index, latlng);
        this.waypoints.push(wp);
        if (wp.index > 0) {
            this.add_line(this.waypoints[wp.index-1],wp);
        }
        this.display_task_list();
        return wp;
    }

    append_current_wp_to_task() {
        let next_index = this.waypoints.length;
        console.log("task append existing wp",next_index);
        let wp = this.current_wp().copy(next_index);
        this.index = next_index;
        this.waypoints.push(wp);
        this.add_line(this.waypoints[wp.index-1],wp);
        this.display_task_list();
        return wp;
    }

    add_line(wp1, wp2) {
        let latlngs = [ wp1.latlng, wp2.latlng ];
        wp2.task_line = L.polyline(latlngs, {color: 'red'});
        wp2.task_line.addTo(this.planner.map);
    }

    redraw() {
        for (let i=1; i<this.waypoints.length; i++) {
            this.waypoints[i].task_line.remove(this.planner.map);
            this.add_line(this.waypoints[i-1], this.waypoints[i]);
        }
    }

    display_task_list() {
        while (this.task_el.firstChild) {
            this.task_el.removeChild(this.task_el.lastChild);
        }
        for (let i=0; i<this.waypoints.length; i++) {
            this.display_task_waypoint(this.waypoints[i]);
        }
    }

    display_task_waypoint(wp) {
        let wp_div = document.createElement("div");
        wp_div.className = "task_list_wp";
        let parent = this;
        wp_div.onclick = function () { parent.set_current_wp(wp.index); };
        if (wp.index == this.index) {
            wp_div.style.backgroundColor = "yellow";
        }
        wp_div.innerHTML = wp.index + " " + wp.get_name() + " " + wp.alt_m;
        this.task_el.appendChild(wp_div);
    }

    delete_wp(index) {
        console.log("delete_wp",index);
        let wp = this.waypoints[index];
        // remove line TO this waypoint
        if (index>0) {
            wp.task_line.remove(this.planner.map);
        }
        // remove line FROM this waypoint
        if (index<this.waypoints.length-1) {
            this.waypoints[index+1].task_line.remove(this.planner.map);
        }
        wp.marker.remove(this.planner.map);
        this.waypoints.splice(this.index,1);
        // Reset index values in waypoints
        for (let i=0; i<this.waypoints.length; i++) {
            this.waypoints[i].index = i;
        }
        // If we just deleted the last waypoint, we need to set current to new last WP
        if (this.index >= this.waypoints.length) {
            this.index = this.waypoints.length - 1;
        }
    }

    remove_wp(index) {
        this.delete_wp(index);
        this.redraw();
        this.display_task_list();
        if (this.waypoints.length > 0) {
            this.current_wp().display_menu();
        } else {
            this.planner.map.closePopup();
        }

    }

    set_current_wp(index) {
        console.log("Set current WP index",index);
        this.index = index;
        this.current_wp().display_menu();
        this.display_task_list();
    }

    reset() {
        console.log("task.reset()");
        while (this.waypoints.length > 0) {
            this.delete_wp(this.waypoints.length - 1);
        }
        this.init();
        this.planner.map.closePopup();
        this.display_task_list();
    }

}
