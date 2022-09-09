// ******************************************************************************
// ***********   File_IGC class            **************************************
// ******************************************************************************

/* Interface;
        constructor(tracklog)
        load(file_str, filename)
        file_type                   // "igc"
*/

/* For B21_TrackLog, File_IGC uses
        .filename
        .name
        .logpoints  // { lat: lng: alt_m: ts: time_iso: speed_ms}
*/

class B21_File_IGC {

    //DEBUG load task from IGC file
    constructor(tracklog) {
        this.tracklog = tracklog;
        this.file_type = "igc";
    }

    // load(file_str, filename) reads records from the file_str, and adds
    //   tracklog records as they are read, updating the 'date' and 'name' fields
    //   as appropriate records are found.
    load(file_str, filename) {

        this.tracklog.filename = filename;

        let date = new Date(0); // Will set from HFDTE
        let name = null;
        let record_count = 0;
        let prev_time_s = 0;
        let prev_point = null;

        var lines = file_str.split('\n');
        for (var line_num=0; line_num < lines.length; line_num++) {
            let buf = lines[line_num];

            if (buf.length==0) continue;

            if (buf.charAt(0) == 'B') {
                //       hhmmss<-lat--><-lng--->A<alt><alt><extensions...>
                //      0      7       15       24
                // E.g. B1056534512951N00550585EA002190021901812

                // ts
                // time_s is time-of-day as seconds since midnight
                let time_s_str = buf.substring(1,7);
                if (time_s_str.length != 6 || time_s_str == "000000") {
                    //console.log("IGC skipping record_count ",record_count);
                    continue;
                }
                let time_s = this.time_s(time_s_str);
                if (time_s == prev_time_s) {
                    //console.log("IGC skipping record_count ",record_count);
                    continue; // If two consective B records with same time then skip
                }

                if (time_s < prev_time_s) {
                    // if time seems to have gone backwards, add a day
                    date.setDate(date.getDate()+1);
                    console.log("IGC date rolled over to next day",date);
                }
                prev_time_s = time_s; // update prev_time_s for the next iteration
                let ts = date.getTime() / 1000 + time_s; // timestamp in seconds (since 1970-01-01 00:00)

                // time_iso
                let time_iso = (new Date(ts * 1000)).toISOString()

                // lat
                let lat_str = buf.substring(7,15);
                if (lat_str.length != 8 || lat_str.startsWith("0000000")) {
                    //console.log("IGC skipping record_count ",record_count);
                    continue;
                }
                let lat = this.decimal_latlong(lat_str);
                if (lat != 0.0 && buf.charAt(24) == 'V') {
                    //console.log("IGC skipping B with V record_count: ",record_count);
                    continue;
                }

                // lng
                let lng_str = buf.substring(15,24);
                if (lng_str.length != 9 || lng_str.startsWith("00000000")) {
                    //console.log("IGC skipping record_count ",record_count);
                    continue;
                }
                let lng = this.decimal_latlong(lng_str);

                // alt_m
                let alt_m = parseFloat(buf.substring(25,30));

                // speed m/s
                let speed_ms;
                if (record_count > 1) {
                    let prev_ts = prev_point["ts"];
                    let time_delta_s = ts - prev_ts;
                    let prev_speed_ms = prev_point["speed_ms"];

                    let dist_m = Geo.get_distance_m(prev_point, { lat: lat, lng: lng });
                    let speed_ms_now = dist_m / time_delta_s;
                    // Smoothing
                    const SMOOTH_S = 10; // smoothing time constant
                    let weight = Math.min(1,time_delta_s / SMOOTH_S);
                    if (prev_speed_ms != null) {
                        speed_ms = speed_ms_now * weight + prev_speed_ms * (1 - weight);
                    } else {
                        speed_ms = speed_ms_now;
                    }
                }

                // cache for next iteration
                prev_point = { lat: lat, lng: lng, alt_m: alt_m, ts: ts, time_iso: time_iso, speed_ms: speed_ms };

                // Append this time/position data to tracklog.logpoints
                this.tracklog.logpoints.push(prev_point);

                record_count++;

            } else if (buf.startsWith("HFGID")) {
                        let name_pos = buf.indexOf(":");
                        if (name_pos > 4 && name_pos+1 < buf.length)
                        {
                            name = buf.substring(name_pos+1);
                            while (name.startsWith(" ")) name = name.substring(1);
                        }
                        console.log("Using Glider ID <"+name+"> from IGC file");

            } else if (buf.startsWith("HFCID")) {
                        let name_pos = buf.indexOf(":");
                        if (name_pos > 4 && name_pos+1 < buf.length)
                        {
                            name = buf.substring(name_pos+1);
                            while (name.startsWith(" ")) name = name.substring(1);
                        }
                        console.log("Using Comp ID <"+name+"> from IGC file");

            } else if (buf.startsWith("HFDTE")) {
                    // E.g. HFDTE230622
                    date = this.date(buf.substring(5));
                    console.log("Using HFDTE date",date);
            }

        }

        // if no HFGID or HFCID record then get name from filename
        if (name==null) {
            let i = filename.lastIndexOf("/");
            if (i==-1) i = filename.lastIndexOf("\\");
            let j = filename.lastIndexOf(".");
            if (j==-1) j = filename.length;
            name = filename.substring(i+1,j);
        }

        this.tracklog.name = name;
        console.log(`IGC file "${name}" loaded ${this.tracklog.logpoints.length} logpoints`);
    }

    // Convert string from B record to float decimal degrees lat/lng
    // E.g. 4512951N (45 deg, 12.951 min) or 00550585E (5 deg, 50.585 min)
    decimal_latlong(str)
    {
        let EWNS = str.slice(-1);
        let deg;
        let min;
        if (EWNS=="N" || EWNS=="S") {
            deg = parseInt(str.substring(0,2));
            min = parseInt(str.substring(2,7));
        } else {
            deg = parseInt(str.substring(0,3));
            min = parseInt(str.substring(3,8));
        }

        if ((EWNS == 'W') || (EWNS == 'S')) {
            return -(deg + (min / 60000));
        }
        return (deg + (min / 60000));
    }

    // Convert B record string into a time-of-day in seconds
    time_s(str) {
        return parseInt(str.substring(0,2)) * 3600 + parseInt(str.substring(2,4)) * 60 + parseInt(str.substring(4,6));
    }

    // Convert HFDTE string to JS UTC Date
    date(str) {
        //      ddmmyy
        // E.g. 230622
        return new Date( "20"+str.substring(4,6)+"-"+str.substring(2,4)+"-"+str.substring(0,2) );
    }

} // end class B21_File_IGC
