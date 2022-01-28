// ******************************************************************************
// ***********   B21_XCsoar_TSK class          **********************************
// ******************************************************************************

// Constructs an xcsoar .TSK file for output

class B21_XCsoar_TSK {

    constructor(task) {

        this.task = task;

        this.check();

        // Default values for finish min alt, and start max alt. Will update if set in Start/Finish waypoints
        this.finish_min_m = 0;
        this.start_max_m = 0;

        let header_text = this.get_header_text();
        let wp_text = "";
        for (let i=0; i<task.waypoints.length; i++) {
            wp_text += this.get_wp_text(i);
        }
        let footer_text = this.get_footer_text();
        // Now fix up start/finish height limits picked up while iterating waypoints
        header_text = header_text.replace("#FINISH_MIN#",this.finish_min_m.toFixed(0));
        header_text = header_text.replace("#START_MAX#",this.start_max_m.toFixed(0));
        this.text = header_text + wp_text + footer_text;
    }

    check() {
        if (this.task==null) {
            throw "Cannot create TSK file with no task";
        }

        if (this.task.waypoints.length<2) {
            throw "Cannot create TSK file with less than 2 waypoints";
        }

        if (this.task.waypoints[0].icao==null || this.task.waypoints[this.task.waypoints.length-1].icao==null) {
            throw "Cannot create TSK file unless first and last waypoints have ICAO";
        }

        if (this.task.start_index==0) {
            throw "Cannot set the departure airport as the task START waypoint. See Help - General Hint (1).";
        }

        if (this.task.finish_index==this.task.waypoints.length-1) {
            throw "Cannot set the destination airport as the task FINISH waypoint. See Help - General Hint (1).";
        }
    }

    clean(str) {
        return str.replaceAll('"',"");
    }

    get_text() {
        return this.text;
    }

    get_title() {
        let first_wp = this.task.waypoints[0];
        let last_wp = this.task.waypoints[this.task.waypoints.length-1];
        let from = first_wp.icao != null ? first_wp.icao : first_wp.get_name();
        let to = last_wp.icao != null ? last_wp.icao : last_wp.get_name();

        return from + " to " + to;
    }

    // Return the XML string for the 'header' part of the PLN file
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
        wp_text = wp_text.replace("#ALTITUDE#", wp.alt_m.toFixed(0) );
        wp_text = wp_text.replace("#COMMENT#", "");
        wp_text = wp_text.replace("#ID#", index.toFixed(0));
        wp_text = wp_text.replace("#NAME#", wp.name);
        wp_text = wp_text.replace("#LATITUDE#", wp.position.lat.toFixed(7));
        wp_text = wp_text.replace("#LONGITUDE#", wp.position.lng.toFixed(7));
        console.log("B21_XCsoar_TSK wp_text is ",wp_text);
        return wp_text;
    }

    // Return XML string for the end of the PLN file
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
