// ******************************************************************************
// ***********   FlightPlan class          **************************************
// ******************************************************************************

// Constructs a .PLN file for output

class B21_FlightPlan {

    constructor(task) {

        this.task = task;

        this.check();

        let header_text = this.get_header_text();
        let wp_text = "";
        for (let i=0; i<task.waypoints.length; i++) {
            wp_text += this.get_wp_text(i);
        }
        let footer_text = this.get_footer_text();
        this.text = header_text + wp_text + footer_text;
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
