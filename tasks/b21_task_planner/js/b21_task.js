// ******************************************************************************
// ***********   Task class                **************************************
// ******************************************************************************

class B21_Task {
    constructor(planner) {
        this.planner = planner; // Reference to B21TaskPlanner instance
        this.task_el = document.getElementById("task_info");
        this.init();
    }

    init() {
        this.name = null;
        this.waypoints = [];
        this.index = null; // Index of current waypoint
        this.start_index = null;
        this.finish_index = null;
        this.task_distance_m = 123456;

        // task bounds
        this.min_lat = 90;
        this.min_lng = 180;
        this.max_lat = -90;
        this.max_lng = -180;
    }

    // Initialize this task using a MSFS Flight Plan
    load_pln_str(pln_str, name) {
        console.log(">>>>>>task.load_pln_str", name);
        this.name = name.slice(0, name.lastIndexOf('.'));
        let msfs_pln = new B21_MSFS_PLN(this);
        // Have msfs_pln update this task
        msfs_pln.load_pln_str(pln_str);
        // Fix up the start and finish waypoints if the PLN didn't mark those.
        console.log(">>>>>>>loaded PLN, start_index=",this.start_index);
        if (this.start_index==null && this.waypoints.length > 0) {
            this.start_index = 0;
        }
        if (this.finish_index==null && this.waypoints.length > 1) {
            this.finish_index = this.waypoints.length - 1;
        }
        this.update_display();
    }

    // Initialize this task using an XCsoar TSK Flight Plan
    load_tsk_str(tsk_str, name) {
        console.log("task.load_tsk_str", name);
        this.name = name.slice(0, name.lastIndexOf('.'));
        let xcsoar_tsk = new B21_XCsoar_TSK(this);
        // Hav xcsoar_tsk update this task
        xcsoar_tsk.load_tsk_str(tsk_str);
        this.update_display();
    }

    // Save a MSFS FlightPlan
    save_file_pln() {
        let msfs_pln = new B21_MSFS_PLN(this);
        let filename = msfs_pln.get_title() + ".pln";
        let text = msfs_pln.get_text();

        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    // Save a XCsoar Task
    save_file_tsk() {
        let xcsoar_tsk = new B21_XCsoar_TSK(this);
        let filename = xcsoar_tsk.get_title() + ".tsk";
        let text = xcsoar_tsk.get_text();

        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    current_wp() {
        return this.waypoints[this.index];
    }

    get_task_distance_m() {
        let start_index = (this.start_index != null) ? this.start_index : 0;
        let finish_index = (this.finish_index != null && this.finish_index < this.waypoints.length) ? this.finish_index : this.waypoints
            .length - 1;
        let distance_m = 0;
        for (let i = start_index + 1; i <= finish_index; i++) {
            distance_m += this.waypoints[i].leg_distance_m;
        }
        return distance_m;
    }

    // Add a WP from a point clicked on the map
    add_point_wp(position) {
        //this.index = this.waypoints.length;
        let wp_index = this.index == null ? 0 : this.index + 1;
        console.log(">>>>>>>task adding point with index", wp_index);
        let wp = new B21_WP(this.planner);
        wp.new_point(wp_index, position);
        this.index = wp_index;
        //this.waypoints.push(wp);
        //INSERT this wp into waypoints at index
        this.waypoints.splice(this.index, 0, wp);
        if (wp.index > 0) {
            this.add_line(this.waypoints[wp.index - 1], wp);
        }
        return wp;
    }

    is_msfs_airport(type) {
        return type != null && type.includes("msfs") && type.includes("airport")
    }

    // User has clicked an airport symbol on the map
    add_new_poi(position, type, poi_info) {
        // poi_info = {ident,name,alt_m,runways}
        console.log("task.add_new_poi ", position, type, poi_info);
        let wp = this.add_point_wp(position);

        if (wp.index == 0 && !this.is_msfs_airport(type)) {
            alert("Hint: your first (and last) WP should be a MSFS airport (blue circle on map)");
        }

        wp.alt_m = poi_info["alt_m"];
        if (wp.alt_m == 0) {
            wp.request_alt_m();
        }
        if (this.is_msfs_airport(type) && (this.planner.settings.soaring_task == 0 || wp.index == 0 || wp.index == this.waypoints
                .length - 1)) {
            wp.name = poi_info["name"];
            wp.data_icao = poi_info["ident"];
            wp.icao = wp.data_icao;
            console.log("task.add_new_poi added with icao " + wp.icao);
        } else {
            if (this.is_msfs_airport(type)) {
                wp.name = poi_info["ident"] + " " + poi_info["name"];
            } else {
                wp.name = poi_info["name"];
            }
            wp.icao = null;
            wp.alt_m_updated = true;
        }
        if (poi_info["runways"] != null && poi_info["runways"] != "") {
            let runways_list = poi_info["runways"].split(" ");
            wp.runways = runways_list;
        }
        console.log("airport added, scrubbing earlier airports WP name/icao")
            // for SOARING tasks, scrub the icao code from earlier airports in task except departure airport
        if (this.planner.settings.soaring_task == 1) {
            this.scrub_intermediate_icao();
        }

        this.update_display();

        this.planner.map.closePopup();

        wp.display_menu();
    }

    scrub_intermediate_icao() {
        console.log("Scrubbing intermediate icao codes");
        for (let i = 1; i < this.waypoints.length - 1; i++) {
            let task_wp = this.waypoints[i];
            console.log("checking WP", i, task_wp.name);
            if (task_wp.icao != null) {
                console.log("Fixing airport WP", task_wp.name);
                task_wp.name = task_wp.icao + " " + task_wp.name;
                task_wp.icao = null;
                task_wp.alt_m_updated = true; // So planner will append +(alt_m) to encoded wp name
            }
        }
    }

    update_display() {
        this.update_bounds();
        this.update_waypoints();
        this.update_waypoint_icons();
        this.redraw();
        this.display_task_info();
    }

    duplicate_current_wp() {
        console.log("Duplicating current WP, icao=", this.current_wp().icao);
        let next_index = this.waypoints.length;
        console.log("task append existing wp", next_index);
        let wp = this.current_wp().copy(next_index);
        this.waypoints.push(wp);
        if (this.planner.settings.soaring_task == 1 && wp.icao != null) {
            this.scrub_intermediate_icao();
        }
        this.index = next_index;
        this.add_line(this.waypoints[wp.index - 1], wp);
        this.update_waypoints();
        this.update_waypoint_icons();
        this.display_task_info();
        return wp;
    }

    // Parse soaring-encoded WP name, e.g. *Mifflin+813|6000-1000x500 => Mifflin alt 613ft, max_alt=6000ft, min_alt=1000ft, radius=500m
    // The "x" (radius) must come after either "+" or "|", so +813x500 is ok.
    decode_wp_name(wp) {
        console.log("decoding", wp.index, wp.name);
        if (wp.name == null) {
            return;
        }
        // Handle START/FINISH
        if (wp.name.toLowerCase().startsWith("start")) {
            this.start_index = wp.index;
        } else if (wp.name.toLowerCase().startsWith("finish")) {
            this.finish_index = wp.index;
        } else if (wp.name.startsWith("*")) {
            if (this.start_index == null) {
                console.log("Setting " + wp.name + " as START");
                this.start_index = wp.index;
            } else {
                console.log("Setting " + wp.name + " as FINISH");
                this.finish_index = wp.index;
            }
            wp.name = wp.name.slice(1);
        }

        // Handle WP ELEVATION
        let wp_extra = "";
        let wp_plus = wp.name.split('+');
        if (wp_plus.length > 1) {
            wp_extra = wp_plus[wp_plus.length - 1];
            let alt_feet = parseFloat(wp_extra);
            if (!isNaN(alt_feet)) {
                wp.alt_m = alt_feet / this.planner.M_TO_FEET;
                wp.alt_m_updated = true;
            }
        }
        let wp_bar = wp.name.split("|");
        if (wp_bar.length > 1) {
            wp_extra = wp_bar[wp_bar.length - 1];
            let max_alt_feet = parseFloat(wp_extra);
            console.log("parsed max_alt_feet from", wp_extra);
            if (!isNaN(max_alt_feet)) {
                console.log("parse max_alt_feet", max_alt_feet);
                wp.max_alt_m = max_alt_feet / this.planner.M_TO_FEET;
            }
        }
        let wp_slash = wp_extra.split("/");
        if (wp_slash.length > 1) {
            let min_alt_feet = parseFloat(wp_slash[wp_slash.length - 1]);
            if (!isNaN(min_alt_feet)) {
                console.log("parse min_alt_feet", min_alt_feet);
                wp.min_alt_m = min_alt_feet / this.planner.M_TO_FEET;
            }
        }
        // Only look for an "x" in the
        console.log("wp_extra is", wp_extra);
        let wp_x = wp_extra.split("x");
        if (wp_x.length > 1) {
            let wp_width_m = parseFloat(wp_x[wp_x.length - 1]);
            if (!isNaN(wp_width_m)) {
                let wp_radius_m = wp_width_m / 2;
                console.log("parse wp_radius_m", wp_radius_m);
                wp.radius_m = wp_radius_m;
            }
        }
        // Trim wp.name to shortest before "+" or "|"
        wp.name = wp.name.split("+")[0].split("|")[0];
    }

    // Return WP name with appended soaring parameters e.g. *Mifflin+813|5000-1000x1000
    // *=start/finish, +=elevation(feet), |=max_alt(feet), -=min_alt(feet), x=radius(meters)
    get_encoded_name(wp) {
        let start = "";
        if (wp.index == this.start_index || wp.index == this.finish_index) {
            start = "*";
        }
        let encoded_name = start + wp.get_name();
        let extra = false;
        if (wp.alt_m_updated && wp.icao == null) {
            extra = true;
            encoded_name += "+" + (wp.alt_m * this.planner.M_TO_FEET).toFixed(0);
        }
        if (wp.max_alt_m != null) {
            extra = true;
            encoded_name += "|" + (wp.max_alt_m * this.planner.M_TO_FEET).toFixed(0);
        }
        if (wp.min_alt_m != null) {
            if (!extra) {
                encoded_name += "|";
                extra = true;
            }
            encoded_name += "/" + (wp.min_alt_m * this.planner.M_TO_FEET).toFixed(0);
        }
        if (wp.radius_m != null) {
            if (!extra) {
                encoded_name += "|";
                extra = true;
            }
            encoded_name += "x" + (wp.radius_m * 2).toFixed(0);
        }
        return encoded_name;
    }

    // Update the .leg_distance_m for each waypoint around task
    update_waypoints() {
        console.log("update_waypoints");
        for (let i = 0; i < this.waypoints.length; i++) {
            const wp = this.waypoints[i];
            wp.index = i;
            if (i > 0) {
                const prev_wp = this.waypoints[i - 1];
                wp.update(prev_wp);
            }
        }
    }

    update_waypoint_icons() {
        console.log("update_waypoint_icons");
        for (let i = 0; i < this.waypoints.length; i++) {
            this.waypoints[i].update_icon();
        }
    }

    update_elevations() {
        for (let i = 0; i < this.waypoints.length; i++) {
            let wp = this.waypoints[i];
            if (wp.data_icao == null) { // Only request elevations for non-airports
                wp.request_alt_m();
            }
        }
    }

    // Calculate the SW & NE corners of the task, so map can be zoomed to fit.
    update_bounds() {
        // task bounds
        this.min_lat = 90;
        this.min_lng = 180;
        this.max_lat = -90;
        this.max_lng = -180;
        for (let i = 0; i < this.waypoints.length; i++) {
            let position = this.waypoints[i].position;
            //console.log("update_bounds",i,position.lat, position.lng);
            if (position.lat < this.min_lat) {
                this.min_lat = position.lat;
            }
            if (position.lat > this.max_lat) {
                this.max_lat = position.lat;
            }
            if (position.lng < this.min_lng) {
                this.min_lng = position.lng;
            }
            if (position.lng > this.max_lng) {
                this.max_lng = position.lng;
            }
        }
        console.log("new map bounds ", this.min_lat, this.min_lng, this.max_lat, this.max_lng);
    }

    // Add a straight line between wp1 and wp2
    add_line(wp1, wp2) {
        this.remove_line(wp2);
        let latlngs = [wp1.position, wp2.position];
        wp2.task_line = L.polyline(latlngs, {
            color: 'red'
        });
        wp2.task_line.addTo(this.planner.map);
    }

    remove_line(wp) {
        if (wp.task_line != null) {
            wp.task_line.remove(this.planner.map);
            wp.task_line = null;
        }
    }

    remove_marker(wp) {
        if (wp.marker != null) {
            wp.marker.remove(this.planner.map);
            wp.marker = null;
        }
    }

    add_sector(wp) {
        this.remove_sector(wp);
        if (wp.index == this.start_index) {
            // Sector = START LINE
            console.log("add_sector START", wp.radius_m);
            let radius_m = wp.radius_m == null ? 2500 : wp.radius_m;
            let direction_deg = 0;
            if (wp.index < this.waypoints.length - 1) {
                direction_deg = (this.waypoints[wp.index + 1].leg_bearing_deg + 180) % 360;
            }
            wp.sector = L.semiCircle(wp.position, {
                    radius: radius_m,
                    color: 'red'
                })
                .setDirection(direction_deg, 180);
        } else if (wp.index == this.finish_index) {
            // Sector = FINISH LINE
            console.log("add_sector FINISH", wp.radius_m);
            let radius_m = wp.radius_m == null ? 1000 : wp.radius_m;
            let direction_deg = 0;
            if (wp.index > 0) {
                direction_deg = wp.leg_bearing_deg;
            }
            wp.sector = L.semiCircle(wp.position, {
                    radius: radius_m,
                    color: 'red'
                })
                .setDirection(direction_deg, 180);
        } else {
            // Sector = WAYPOINT
            wp.sector = L.circle(wp.position, {
                radius: wp.radius_m,
                color: 'red',
                weight: 1
            });
        }
        wp.sector.addTo(this.planner.map);
    }

    remove_sector(wp) {
        if (wp.sector != null) {
            wp.sector.remove(this.planner.map);
            wp.sector = null;
        }
    }

    redraw() {
        console.log("Task.redraw()");
        for (let i = 0; i < this.waypoints.length; i++) {
            let wp = this.waypoints[i];
            // Set current WP marker to foreground
            if (i == this.index) {
                wp.marker.setZIndexOffset(1000);
            } else {
                wp.marker.setZIndexOffset(0);
            }
            // Draw task line
            if (wp.task_line != null) {
                this.remove_line(wp);
            }
            if (i > 0) {
                this.add_line(this.waypoints[i - 1], this.waypoints[i]);
            }
            // Draw WP circle, start, finish lines
            if (wp.sector != null) {
                this.remove_sector(wp);
            }
            if (wp.radius_m != null || wp.index == this.start_index || wp.index == this.finish_index) {
                this.add_sector(wp);
            }

        }
    }

    //DEBUG add total distance to task (recognise start/finish)
    display_task_info() {
        while (this.task_el.firstChild) {
            this.task_el.removeChild(this.task_el.lastChild);
        }
        let task_info_el = document.createElement("table");
        task_info_el.id = "task_info";

        let distance_units_str = "Km";
        if (this.planner.settings.distance_units == "miles") {
            distance_units_str = "Miles";
        }

        let altitude_units_str = "M";
        if (this.planner.settings.altitude_units == "feet") {
            altitude_units_str = "Feet";
        }

        // Column headings
        let headings_el = document.createElement("tr");
        let heading1 = document.createElement("th"); // WP #
        headings_el.appendChild(heading1);
        let heading2 = document.createElement("th"); // WP name
        headings_el.appendChild(heading2);
        let heading3 = document.createElement("th"); // WP alt
        heading3.innerHTML = altitude_units_str;
        headings_el.appendChild(heading3);
        let heading4 = document.createElement("th"); // leg bearing
        heading4.innerHTML = "deg(T)";
        headings_el.appendChild(heading4);
        let heading5 = document.createElement("th"); // leg distance
        heading5.innerHTML = distance_units_str;
        headings_el.appendChild(heading5);
        let heading6 = document.createElement("th"); // buttons
        headings_el.appendChild(heading6);

        task_info_el.appendChild(headings_el);

        // Add waypoints
        for (let i = 0; i < this.waypoints.length; i++) {
            this.display_task_waypoint(task_info_el, this.waypoints[i]);
        }
        this.task_el.appendChild(task_info_el);

        let distance_m = this.get_task_distance_m();
        let distance_str = (distance_m / 1000).toFixed(1);
        if (this.planner.settings.distance_units == "miles") {
            distance_str = (distance_m * this.planner.M_TO_MILES).toFixed(1);
        }

        let distance_el = document.createElement("div");
        distance_el.id = "task_info_distance";
        distance_el.innerHTML = "Task distance: " + distance_str + " " + distance_units_str;

        this.task_el.appendChild(distance_el);
    }

    display_task_waypoint(task_info_el, wp) {
        let wp_el = document.createElement("tr");
        wp_el.className = wp.index == this.index ? "task_info_wp_current" : "task_info_wp";
        let parent = this;

        // Build elevation string
        let alt_str = wp.alt_m.toFixed(0);
        if (this.planner.settings.altitude_units == "feet") {
            alt_str = (wp.alt_m * this.planner.M_TO_FEET).toFixed(0);
        }
        // Build distance string
        let dist_str = "";
        if (wp.index > 0) {
            if (this.planner.settings.distance_units == "miles") {
                dist_str = (wp.leg_distance_m * this.planner.M_TO_MILES).toFixed(1);
            } else {
                dist_str = (wp.leg_distance_m / 1000).toFixed(1);
            }
        }
        let wp_index_el = document.createElement("td"); // WP #
        wp_index_el.className = "task_info_wp_index";
        wp_index_el.onclick = function() {
            parent.set_current_wp(wp.index);
        };
        let index_note = "";
        if (wp.index == this.start_index) {
            index_note = "[St]";
        }
        if (wp.index == this.finish_index) {
            index_note = "[Fin]";
        }
        wp_index_el.innerHTML = index_note; //(wp.index+1)+"&nbsp;"+index_note;
        wp_el.appendChild(wp_index_el);

        let wp_name_el = document.createElement("td"); // WP name
        wp_name_el.className = "task_info_wp_name";
        wp_name_el.onclick = function() {
            parent.set_current_wp(wp.index);
        };
        wp_name_el.innerHTML = wp.get_name();
        wp_el.appendChild(wp_name_el);

        let wp_alt_el = document.createElement("td"); // WP alt
        wp_alt_el.onclick = function() {
            parent.set_current_wp(wp.index);
        };
        wp_alt_el.innerHTML = alt_str;
        wp_el.appendChild(wp_alt_el);

        let wp_bearing_el = document.createElement("td"); // leg bearing
        wp_bearing_el.onclick = function() {
            parent.set_current_wp(wp.index);
        };
        wp_bearing_el.className = "task_info_wp_bearing";
        wp_bearing_el.innerHTML = wp.get_leg_bearing();
        wp_el.appendChild(wp_bearing_el);

        let wp_dist_el = document.createElement("td"); // leg distance
        wp_dist_el.onclick = function() {
            parent.set_current_wp(wp.index);
        };
        wp_dist_el.innerHTML = dist_str;
        wp_el.appendChild(wp_dist_el);

        let wp_buttons_el = document.createElement("td"); // buttons
        this.task_info_wp_buttons(wp_buttons_el, wp);
        wp_el.appendChild(wp_buttons_el);

        task_info_el.appendChild(wp_el);

        // Add another row if this WP has limits set
        if (wp.max_alt_m != null || wp.min_alt_m != null || wp.radius_m != null) {
            let wp_limits_row_el = document.createElement("tr");
            let wp_limits_el = document.createElement("td");
            wp_limits_el.setAttribute("colspan", "6");
            wp_limits_el.className = "task_info_wp_limits";

            let alt_units_str = "m"
            let alt_scaler = 1;
            if (this.planner.settings.altitude_units == "feet") {
                alt_units_str = "ft";
                alt_scaler = this.planner.M_TO_FEET;
            }

            let limits_str = "";

            if (wp.max_alt_m != null) {
                limits_str += "Max alt: " + (wp.max_alt_m * alt_scaler).toFixed(0) + alt_units_str + ".";
            }

            if (wp.min_alt_m != null) {
                limits_str += " Min alt: " + (wp.min_alt_m * alt_scaler).toFixed(0) + alt_units_str + ".";
            }

            let radius_units_str = "m";
            let radius_scaler = 1;

            if (this.planner.settings.wp_radius_units == "feet") {
                radius_units_str = "ft";
                radius_scaler = this.planner.M_TO_FEET;
            }

            if (wp.radius_m != null) {
                limits_str += " Radius: " + (wp.radius_m * radius_scaler).toFixed(0) + radius_units_str + ".";
            }

            wp_limits_el.innerHTML = limits_str;
            wp_limits_row_el.appendChild(wp_limits_el);

            task_info_el.appendChild(wp_limits_el);
        }
    }

    task_info_wp_buttons(buttons_el, wp) {
        buttons_el.className = "task_info_wp_buttons";

        if (wp.index != 0) {
            let up_el = document.createElement("div");
            up_el.className = "task_info_wp_button_up";
            up_el.addEventListener("click", () => {
                this.move_wp_up(wp.index);
            });
            buttons_el.appendChild(up_el);
        }

        if (wp.index != this.waypoints.length - 1) {
            let down_el = document.createElement("div");
            down_el.className = "task_info_wp_button_down";
            down_el.addEventListener("click", () => {
                this.move_wp_down(wp.index);
            });
            buttons_el.appendChild(down_el);
        }

        let delete_el = document.createElement("div");
        delete_el.className = "task_info_wp_button_delete";
        delete_el.addEventListener("click", () => {
            this.remove_wp(wp.index);
        });
        buttons_el.appendChild(delete_el);

    }

    remove_wp_from_task(index) {
        console.log("remove_wp_from_task", index, this.waypoints[index].name, this.waypoints.length);
        let wp = this.waypoints[index];
        // remove line TO this waypoint
        if (index > 0) {
            this.remove_line(wp);
        }
        // remove line TO NEXT waypoint
        if (index < this.waypoints.length - 1) {
            this.remove_line(this.waypoints[index + 1]);
        }
        this.remove_marker(wp);
        this.remove_sector(wp);

        // If this WP is the first airport, and the next is also an airport, set the .icao value for the next WP
        if (index == 0 && this.waypoints.length > 1 && this.waypoints[index + 1].data_icao != null) {
            this.waypoints[index + 1].icao = this.waypoints[index + 1].data_icao;
        }

        // If this WP is the last airport, and the previous is also an airport, set the .icao value for the previous WP
        if (index == this.waypoints.length - 1 && this.waypoints.length > 1 && this.waypoints[index - 1].data_icao != null) {
            this.waypoints[index - 1].icao = this.waypoints[index - 1].data_icao;
        }

        // Remove this waypoint from waypoints list
        this.waypoints.splice(index, 1);
        console.log("remove_wp_from_task waypoints.length=" + this.waypoints.length);
        // Reset index values in waypoints
        for (let i = 0; i < this.waypoints.length; i++) {
            this.waypoints[i].index = i;
        }
        // If we just deleted the last waypoint, we need to set current to new last WP
        if (index >= this.waypoints.length) {
            this.index = this.waypoints.length - 1;
            console.log("remove_wp_from_task last wp", index, this.index);
        }
    }

    remove_wp(index) {
        console.log("Task.remove_wp(" + index + ")");
        this.remove_wp_from_task(index);
        this.update_waypoints();
        this.update_waypoint_icons();
        this.redraw();
        this.display_task_info();
        if (this.waypoints.length > 0) {
            this.current_wp().display_menu();
        } else {
            this.planner.map.closePopup();
        }
    }

    move_wp_down(index) {
        console.log("Task.move_wp_down(" + index + ")");
        if (index >= this.waypoints.length - 1) { // Cannot move down if already last
            return;
        }
        let wp = this.waypoints[index];
        let next_wp = this.waypoints[index + 1]
        this.waypoints[index] = next_wp;
        this.waypoints[index + 1] = wp;
        this.update_waypoints();
        this.update_waypoint_icons();
        this.redraw();
        this.display_task_info();
        if (this.waypoints.length > 0) {
            this.current_wp().display_menu();
        } else {
            this.planner.map.closePopup();
        }
    }

    move_wp_up(index) {
        console.log("Task.move_wp_up(" + index + ")");
        if (index == 0) { // Cannot move up if already first
            return;
        }
        let wp = this.waypoints[index];
        let prev_wp = this.waypoints[index - 1]
        this.waypoints[index] = prev_wp;
        this.waypoints[index - 1] = wp;
        this.update_waypoints();
        this.update_waypoint_icons();
        this.redraw();
        this.display_task_info();
        if (this.waypoints.length > 0) {
            this.current_wp().display_menu();
        } else {
            this.planner.map.closePopup();
        }
    }

    set_current_wp(index) {
        console.log("Set current WP index", index);
        this.index = index;
        this.update_waypoint_icons();
        this.redraw();
        this.current_wp().display_menu();
        this.display_task_info();
    }

    reset() {
        console.log("task.reset()");
        let length = this.waypoints.length;
        console.log(this.toString());
        for (let i = length - 1; i >= 0; i--) {
            this.remove_wp_from_task(i);
            console.log(this.toString());
        }
        this.init();
        this.planner.map.closePopup();
        this.display_task_info();
    }

    // *******************************************
    // Tracklog Sector calculations
    // Using position as { "lat": , "lng", "alt_m" }
    // *******************************************

    // Return { "start": true|false, "ts": seconds timestamp of start }
    is_start(p1, p2) {
        if (this.start_index == null) {
            console.log("Task.is_start false start_index is null");
            return false;
        }
        if (this.start_index > this.waypoints.length - 2) {
            console.log("Task.is_start false no leg after start");
            return false;
        }

        let leg_bearing_deg = this.waypoints[this.start_index + 1].leg_bearing_deg;
        //console.log("Task.is_start() leg_bearing_deg="+leg_bearing_deg);
        return this.waypoints[this.start_index].is_start(p1, p2, leg_bearing_deg);
    }

    // Return { "finish": true|false, "ts": seconds timestamp of finish }
    is_finish(p1, p2) {
        if (this.finish_index == null) {
            return false;
        }
        return this.waypoints[this.finish_index].is_finish(p1, p2);
    }

    // Return { "wp": true|false, "ts": seconds timestamp of wp }
    is_wp(wp_index, p1, p2) {
        if (this.start_index == null || wp_index <= this.start_index ||
            this.finish_index == null || wp_index >= this.finish_index || wp_index >= this.waypoints.length) {
            return false;
        }
        return this.waypoints[wp_index].is_wp(p1, p2);
    }

    // *******************************************
    // General - convert class instance to string
    // *******************************************

    toString() {
        let str = "[";
        for (let i = 0; i < this.waypoints.length; i++) {
            str += (i == 0 ? "" : ",") + this.waypoints[i].toString();
        }
        str += "]";
        return str;
    }
} // end Task class
