// ******************************************************************************
// ***********   B21_MSFS_PLN class          **************************************
// ******************************************************************************

// Constructs a .PLN file for output

class B21_MSFS_PLN {

    constructor(task) {

        this.task = task;
    }

    load_pln_str(pln_str) {
        console.log("load_pln_str");
        const parser = new DOMParser();
        const dom = parser.parseFromString(pln_str, "application/xml");
        let flight_plan_el = dom.getElementsByTagName("FlightPlan.FlightPlan")[0];
        let title = dom.getElementsByTagName("Title")[0].childNodes[0].nodeValue;
        // ***************************
        // Departure
        let departure = {};
        departure.id = dom.getElementsByTagName("DepartureID")[0].childNodes[0].nodeValue;
        // ***************************
        // Destination
        let destination = {};
        departure.id = dom.getElementsByTagName("DestinationID")[0].childNodes[0].nodeValue;
        // ***************************
        // Waypoints
        let dom_waypoints = dom.getElementsByTagName("ATCWaypoint"); //XMLNodeList
        for (let i = 0; i < dom_waypoints.length; i++) {
            this.add_pln_wp(dom_waypoints[i]);
        }
    }

    // Add a WP from a PLN waypoint entry
    add_pln_wp(dom_wp) {
        //this.index = this.waypoints.length;
        let wp_index = this.task.index == null ? 0 : this.task.index + 1;
        console.log(">>>>>>>b21_msfs_pln.add_pln_wp adding pln wp with index", wp_index);
        let wp;
        try {
            // An exception will be generated if this WP should be ignored, e.g. TIMECRUIS
            wp = new B21_WP(this.task.planner);
            this.update_wp_pln(wp, wp_index, dom_wp);
        } catch (e) {
            console.log("add_pln_wp skipping:", e);
            return;
        }
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

    update_wp_pln(wp, index, dom_wp) {
        let name = dom_wp.getAttribute("id");
        console.log("New WP from dom:", name);
        if (this.task.planner.settings.soaring_task == 1 &&
            (name == "TIMECRUIS" || name == "TIMECLIMB" || name == "TIMEVERT")) {
            // Skip this waypoint, & tell the caller (Task) via an exception
            throw "SKIP_WAYPOINT";
        }
        console.log("New WP from dom OK:", name);
        // <WorldPosition>N40° 40' 38.62",W77° 37' 36.71",+000813.00</WorldPosition>
        let world_position = dom_wp.getElementsByTagName("WorldPosition")[0].childNodes[0].nodeValue;
        let world_pos_elements = world_position.split(","); // lat, lng, alt
        let lat_elements = world_pos_elements[0].split(" ");
        let lat = parseInt(lat_elements[0].slice(1)) + parseFloat(lat_elements[1]) / 60 + parseFloat(lat_elements[2]) / 3600;
        lat = lat_elements[0][0] == "N" ? lat : -1 * lat;
        let lng_elements = world_pos_elements[1].split(" ");
        let lng = parseInt(lng_elements[0].slice(1)) + parseFloat(lng_elements[1]) / 60 + parseFloat(lng_elements[2]) / 3600;
        lng = lng_elements[0][0] == "E" ? lng : -1 * lng;

        let icao_codes = dom_wp.getElementsByTagName("ICAOIdent");
        let runways = dom_wp.getElementsByTagName("RunwayNumberFP");

        console.log(world_position);

        // Set position
        wp.new_point(index, new L.latLng(lat, lng));

        // Set WP name
        wp.name = name;

        // Set WP alt_m
        wp.alt_m = parseFloat(world_pos_elements[2]) / this.task.planner.M_TO_FEET;

        // Set WP data_icao, icao
        if (icao_codes.length > 0) {
            wp.data_icao = icao_codes[0].childNodes[0].nodeValue;
            wp.icao = wp.data_icao;
            console.log("Set icao to " + wp.icao);
        }

        // Set WP runway
        if (runways.length > 0) {
            let runway_nodes = runways[0].childNodes;
            if (runway_nodes.length > 0) {
                wp.runway = runways[0].childNodes[0].nodeValue;
            }
        }
    }

    check() {
        if (this.task==null) {
            throw "Cannot create FlightPlan with no task";
        }

        if (this.task.waypoints.length<2) {
            throw "Cannot create FlightPlan with less than 2 waypoints";
        }

        if (this.task.waypoints[0].icao==null || this.task.waypoints[this.task.waypoints.length-1].icao==null) {
            throw "Cannot create Flightplan unless first and last waypoints have ICAO";
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
        this.check();

        let header_text = this.get_header_text();
        let wp_text = "";
        for (let i=0; i<this.task.waypoints.length; i++) {
            wp_text += this.get_wp_text(i);
        }
        let footer_text = this.get_footer_text();

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

    // Return the XML string for the 'header' part of the PLN file
    get_header_text() {
        let header_text = this.get_header_template();
        let first_wp = this.task.waypoints[0];
        let last_wp = this.task.waypoints[this.task.waypoints.length-1];
        let title = this.clean(this.get_title());
        header_text = header_text.replace("#TITLE#", title);
        header_text = header_text.replace("#DESCR#", title);

        header_text = header_text.replace("#DEPARTURE_ID#", this.clean(first_wp.icao));
        header_text = header_text.replace("#DEPARTURE_LLA#", this.get_world_position(first_wp));
        if (first_wp.runway==null) {
            header_text = header_text.replace("<DeparturePosition>#DEPARTURE_POSITION#</DeparturePosition>","");
        } else {
            header_text = header_text.replace("#DEPARTURE_POSITION#", first_wp.runway);
        }
        header_text = header_text.replace("#DEPARTURE_NAME#", this.clean(first_wp.get_name()));

        header_text = header_text.replace("#DESTINATION_ID#", this.clean(last_wp.icao));
        header_text = header_text.replace("#DESTINATION_LLA#", this.get_world_position(last_wp));
        header_text = header_text.replace("#DESTINATION_NAME#", this.clean(last_wp.get_name()));

        return header_text;
    }

    // Return the XML string for each waypoint (either "User" or "Airport" depending on wp.icao==null)
    get_wp_text(index) {
        let wp = this.task.waypoints[index];
        let encoded_name = this.clean(this.task.get_encoded_name(wp));
        let wp_text = "";
        if (wp.icao==null) {
            let wp_template = this.get_wp_user_template();
            wp_text = wp_template.replace("#ATCWAYPOINT_ID#",encoded_name);
            wp_text = wp_text.replace("#WORLD_POSITION#",this.get_world_position(wp));
        } else {
            let wp_template = this.get_wp_airport_template();
            wp_text = wp_template.replace("#ATCWAYPOINT_ID#",encoded_name);
            wp_text = wp_text.replace("#ICAO_IDENT#", this.clean(wp.icao));
            wp_text = wp_text.replace("#WORLD_POSITION#",this.get_world_position(wp));
            if (wp.runway==null) {
                wp_text = wp_text.replace("<RunwayNumberFP>#RUNWAY_NUMBER_FP#</RunwayNumberFP>","");
            } else {
                wp_text = wp_text.replace("#RUNWAY_NUMBER_FP#", wp.runway);
            }
        }
        return wp_text;
    }

    // Return XML string for the end of the PLN file
    get_footer_text() {
        let footer_text = this.get_footer_template();
        return footer_text;
    }

    get_world_position(wp) {
        let position = wp.position;
        let alt_m = wp.alt_m;

        // e.g. `N51° 33' 50.34",E0° 21' 17.76",+000019.18`;
        let world_position = "";
        let NS = position.lat >= 0 ? "N" : "S";
        world_position += NS;
        let lat_deg = Math.trunc(Math.abs(position.lat));
        world_position += lat_deg + "° ";
        let lat_frac = Math.abs(position.lat) - Math.abs(lat_deg);
        let lat_mins = Math.trunc(lat_frac * 60);
        world_position += lat_mins +"' ";
        let lat_secs = ((lat_frac * 60 - lat_mins) * 60).toFixed(2);
        world_position += lat_secs + '",';

        let EW = position.lng >= 0 ? "E" : "W";
        world_position += EW;
        let lng_deg = Math.trunc(Math.abs(position.lng));
        world_position += lng_deg + "° ";
        let lng_frac = Math.abs(position.lng) - Math.abs(lng_deg);
        let lng_mins = Math.trunc(lng_frac * 60);
        world_position += lng_mins +"' ";
        let lng_secs = ((lng_frac * 60 - lng_mins) * 60).toFixed(2);
        world_position += lng_secs + '",';

        let alt_feet = alt_m * this.task.planner.M_TO_FEET;
        let alt_str = (alt_feet>0 ? "+" : "-")+("000000"+alt_feet.toFixed(2)).slice(-9);
        world_position += alt_str;

        return world_position;
    }

    get_header_template() {
        return `<?xml version="1.0" encoding="UTF-8"?>

<SimBase.Document Type="AceXML" version="1,0">
    <Descr>AceXML Document</Descr>
    <FlightPlan.FlightPlan>
        <Title>#TITLE#</Title>
        <FPType>VFR</FPType>
        <CruisingAlt>1500.000</CruisingAlt>
        <DepartureID>#DEPARTURE_ID#</DepartureID>
        <DepartureLLA>#DEPARTURE_LLA#</DepartureLLA>
        <DestinationID>#DESTINATION_ID#</DestinationID>
        <DestinationLLA>#DESTINATION_LLA#</DestinationLLA>
        <Descr>#DESCR#</Descr>
        <DeparturePosition>#DEPARTURE_POSITION#</DeparturePosition>
        <DepartureName>#DEPARTURE_NAME#</DepartureName>
        <DestinationName>#DESTINATION_NAME#</DestinationName>
        <AppVersion>
            <AppVersionMajor>11</AppVersionMajor>
            <AppVersionBuild>282174</AppVersionBuild>
        </AppVersion>
`;
    }

    get_wp_airport_template() {
        return `
        <ATCWaypoint id="#ATCWAYPOINT_ID#">
            <ATCWaypointType>Airport</ATCWaypointType>
            <WorldPosition>#WORLD_POSITION#</WorldPosition>
            <RunwayNumberFP>#RUNWAY_NUMBER_FP#</RunwayNumberFP>
            <ICAO>
                <ICAOIdent>#ICAO_IDENT#</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
`;
    }

    get_wp_user_template() {
        return `
        <ATCWaypoint id="#ATCWAYPOINT_ID#">
            <ATCWaypointType>User</ATCWaypointType>
            <WorldPosition>#WORLD_POSITION#</WorldPosition>
        </ATCWaypoint>
`;
    }

    get_wp_intersection_template() {
        return `
        <ATCWaypoint id="#ATCWAYPOINT_ID#">
            <ATCWaypointType>Intersection</ATCWaypointType>
            <WorldPosition>#WORLD_POSITION#</WorldPosition>
            <ICAO>
                <ICAOIdent>#ICAO_IDENT#</ICAOIdent>
            </ICAO>
        </ATCWaypoint>
`;
    }

    get_footer_template() {
        return `
    </FlightPlan.FlightPlan>
</SimBase.Document>
`;
    }
} // end FlightPlan class
