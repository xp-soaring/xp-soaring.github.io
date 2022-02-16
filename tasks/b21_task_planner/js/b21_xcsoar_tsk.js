// ******************************************************************************
// ***********   B21_XCsoar_TSK class          **********************************
// ******************************************************************************

// Constructs an xcsoar .TSK file for output

class B21_XCsoar_TSK {

    constructor(task) {

        this.task = task;
    }

    load_tsk_str(tsk_str) {
        console.log("load_tsk_str", tsk_str);
        const parser = new DOMParser();
        const dom = parser.parseFromString(tsk_str, "application/xml");
        let task_el = dom.getElementsByTagName("Task")[0];

        if (task_el.hasAttribute('name')) {
            this.task.name = task_el.getAttribute('name');
        }
        console.log("load_task_str name ='"+this.task.name+"'");

        if (task_el.hasAttribute('finish_min_height_ref')) {
            this.finish_min_height_ref = task_el.getAttribute('finish_min_height_ref');
            console.log('finish_min_height_ref', this.finish_min_height_ref);
        }

        if (task_el.hasAttribute('finish_min_height')) {
            this.finish_min_height = parseFloat(task_el.getAttribute('finish_min_height'));
            console.log('finish_min_height', this.finish_min_height);
        }

        if (task_el.hasAttribute('start_max_height_ref')) {
            this.start_max_height_ref = task_el.getAttribute('start_max_height_ref');
            console.log('start_max_height_ref', this.start_max_height_ref);
        }

        if (task_el.hasAttribute('start_max_height')) {
            this.start_max_height = parseFloat(task_el.getAttribute('start_max_height'));
            console.log('start_max_height', this.start_max_height);
        }

        // ***************************
        // Waypoints
        let point_els = dom.getElementsByTagName("Point"); //XMLNodeList
        for (let i = 0; i < point_els.length; i++) {
            this.add_tsk_wp(point_els[i]);
        }
    }

    // Add a WP from a tsk waypoint entry
    add_tsk_wp(point_el) {
        //this.index = this.waypoints.length;
        let wp_index = this.task.index == null ? 0 : this.task.index + 1;
        console.log(">>>>>>>b21_xcsoar_tsk.add_tsk_wp adding tsk wp with index", wp_index);
        let wp = new B21_WP(this.task.planner);
        this.update_wp_tsk(wp, wp_index, point_el);

        // Update task current index
        this.task.index = wp_index;
        //this.waypoints.push(wp);
        //INSERT this wp into waypoints at index
        this.task.waypoints.splice(wp_index, 0, wp);
        if (wp_index > 0) {
            this.task.add_line(this.task.waypoints[wp_index - 1], wp);
        }
        this.task.decode_wp_name(wp);
    }

    update_wp_tsk(wp, index, point_el) {
        let point_type;
        if (point_el.hasAttribute('type')) {
            point_type = point_el.getAttribute("type");;
            console.log("New Point from TSK type:", point_type); // Start | Turn  | Finish
        }

        let wp_el = point_el.getElementsByTagName("Waypoint")[0];

        let name;
        if (wp_el.hasAttribute('name')) {
            name = wp_el.getAttribute("name");;
            console.log("New WP from TSK dom:", name);
        }

        let alt_m;
        if (wp_el.hasAttribute('altitude')) {
            alt_m = parseFloat(wp_el.getAttribute('altitude'));
            console.log('wp.alt_m', alt_m);
        }

        // Get lat/lng
        let loc_el = wp_el.getElementsByTagName("Location")[0];
        let lat = 0;
        let lng = 0;
        if (loc_el.hasAttribute('latitude')) {
            lat = parseFloat(loc_el.getAttribute('latitude'));
        } else {
            console.log("TSK file load no Location LATITUDE", point_el)
        }
        if (loc_el.hasAttribute('longitude')) {
            lng = parseFloat(loc_el.getAttribute('longitude'));
        } else {
            console.log("TSK file load no Location LONGITUDE", point_el)
        }

        // Set wp.position
        wp.new_point(index, new L.latLng(lat, lng));

        // Set wp.name
        wp.name = name;

        // Set wp.alt_m
        wp.alt_m = alt_m;

        // Set task.start_index and wp.max_alt_m
        if (point_type=="Start") {
            this.task.start_index = index;
            if (this.start_max_height != null) {
                if (this.start_max_height_ref=='AGL') {
                    wp.max_alt_m = this.start_max_height + alt_m;
                } else {
                    wp.max_alt_m = this.start_max_height;
                }
            }
        // Set task.finish_index and wp.min_alt_m
        } else if (point_type=="Finish") {
            this.task.finish_index = index;
            if (this.finish_min_height != null) {
                if (this.finish_min_height_ref=='AGL') {
                    wp.min_alt_m = this.start_max_height + alt_m;
                } else {
                    wp.min_alt_m = this.finish_min_height;
                }
            }
        }

        let zone_el = point_el.getElementsByTagName("ObservationZone")[0];

        // Set wp.radius_m for a Cylinder
        if (zone_el.hasAttribute('radius')) {
            wp.radius_m = parseFloat(zone_el.getAttribute('radius'));
            console.log('radius', wp.radius_m);
        }

        // Set wp.radius_m for a Line
        if (zone_el.hasAttribute('length')) {
            wp.radius_m = parseFloat(zone_el.getAttribute('length'));
            console.log('length', wp.radius_m);
        }

    }

    check() {
        if (this.task==null) {
            throw "Cannot create TSK file with no task";
        }

        if (this.task.waypoints.length<2) {
            throw "Cannot create TSK file with less than 2 waypoints";
        }
    }

    clean(str) {
        return str.replaceAll('"',"");
    }

    get_text() {
        this.check();

        // Default values for finish min alt, and start max alt. Will update if set in Start/Finish waypoints
        this.finish_min_m = 0;
        this.start_max_m = 0;

        let header_text = this.get_header_text();
        let wp_text = "";
        for (let i=0; i<this.task.waypoints.length; i++) {
            wp_text += this.get_wp_text(i);
        }
        let footer_text = this.get_footer_text();
        // Now fix up start/finish height limits picked up while iterating waypoints
        header_text = header_text.replace("#FINISH_MIN#",this.finish_min_m.toFixed(3));
        header_text = header_text.replace("#START_MAX#",this.start_max_m.toFixed(3));
        let text = header_text + wp_text + footer_text;
        return text;
    }

    get_title() {
        if (this.task.name != null) {
            return this.task.name;
        }
        let first_wp = this.task.waypoints[0];
        let last_wp = this.task.waypoints[this.task.waypoints.length-1];
        let from = first_wp.icao != null ? first_wp.icao : first_wp.get_name();
        let to = last_wp.icao != null ? last_wp.icao : last_wp.get_name();

        return from + " to " + to;
    }

    // Return the XML string for the 'header' part of the tsk file
    get_header_text() {
        let header_text = this.get_header_template();         // #FINISH_MIN# #START_MAX# #NAME#
        let title = this.clean(this.get_title());
        header_text = header_text.replace("#NAME#", title);

        return header_text;
    }

    // Return the XML string for each waypoint
    get_wp_text(index) {
        let wp = this.task.waypoints[index];
        console.log("B21_XCsoar_TSK get_wp_text", wp);
        //let encoded_name = this.clean(this.task.get_encoded_name(wp));
        let wp_text = "";
        let wp_template;
        if (wp.is_task_start()) {
            console.log("B21_XCsoar_TSK start is ",wp.name);
            // Fixup max start altitude if in this WP
            if (wp.max_alt_m != null) {
                this.start_max_m = wp.max_alt_m;
            }
            wp_template = this.get_point_start_template(); // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE# #LENGTH#
            wp_text = wp_template.replace("#LENGTH#",wp.get_radius().toFixed(0));
        } else if (wp.is_task_finish()) {
            console.log("B21_XCsoar_TSK finish is ",wp.name);
            // Fixup min finish altitude if in this WP
            if (wp.min_alt_m != null) {
                this.finish_min_m = wp.min_alt_m;
            }
            wp_template = this.get_point_finish_template(); // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE# #LENGTH#
            wp_text = wp_template.replace("#LENGTH#",wp.get_radius().toFixed(0));
        } else {
            wp_template = this.get_point_turn_template(); // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE# #RADIUS#
            wp_text = wp_template.replace("#RADIUS#",wp.get_radius().toFixed(0));
        }
        // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE#
        wp_text = wp_text.replace("#ALTITUDE#", wp.alt_m.toFixed(3) );
        wp_text = wp_text.replace("#COMMENT#", "");
        wp_text = wp_text.replace("#ID#", index.toFixed(0));
        wp_text = wp_text.replace("#NAME#", wp.name);
        wp_text = wp_text.replace("#LATITUDE#", wp.position.lat.toFixed(7));
        wp_text = wp_text.replace("#LONGITUDE#", wp.position.lng.toFixed(7));
        console.log("B21_XCsoar_TSK wp_text is ",wp_text);
        return wp_text;
    }

    // Return XML string for the end of the tsk file
    get_footer_text() {
        let footer_text = this.get_footer_template();
        return footer_text;
    }

    get_header_template() {
        // #FINISH_MIN# #START_MAX# #NAME#
        return `<Task fai_finish="0" finish_min_height_ref="MSL" finish_min_height="#FINISH_MIN#"
            start_max_height_ref="MSL" start_max_height="#START_MAX#" start_max_speed="0" start_requires_arm="0"
            aat_min_time="0" name="#NAME#" type="RT">
`;
    }

    get_point_start_template() {
        // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE# #LENGTH#
        return `
    <Point type="Start">
        <Waypoint altitude="#ALTITUDE#" comment="#COMMENT#" id="#ID#" name="#NAME#">
            <Location latitude="#LATITUDE#" longitude="#LONGITUDE#"/>
        </Waypoint>
        <ObservationZone length="#LENGTH#" type="Line"/>
    </Point>
`;
    }

    get_point_turn_template() {
        // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE# #RADIUS#
        return `
    <Point type="Turn">
        <Waypoint altitude="#ALTITUDE#" comment="#COMMENT#" id="#ID#" name="#NAME#">
            <Location latitude="#LATITUDE#" longitude="#LONGITUDE#"/>
        </Waypoint>
        <ObservationZone radius="#RADIUS#" type="Cylinder"/>
    </Point>
`;
    }

    get_point_finish_template() {
        // #ALTITUDE# #COMMENT# #ID# #NAME# #LATITUDE# #LONGITUDE# #LENGTH#
        return `
    <Point type="Finish">
        <Waypoint altitude="#ALTITUDE#" comment="#COMMENT#" id="#ID#" name="#NAME#">
            <Location latitude="#LATITUDE#" longitude="#LONGITUDE#"/>
        </Waypoint>
        <ObservationZone length="#LENGTH#" type="Line"/>
    </Point>
`;
    }

    get_footer_template() {
        return `
    </Task>
`;
    }
} // end B21_XCsoar_TSK class
