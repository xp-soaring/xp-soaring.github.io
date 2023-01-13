// ******************************************************************************
// ***********   File_GPX class            **************************************
// ******************************************************************************

/* Interface;
        constructor(tracklog)
        load(file_str, filename)
        file_type                   // "gpx"
*/

/* For B21_TrackLog, FileGPX uses
        .filename
        .name
        .logpoints
        .using_airspeed
        .plane_pilot e.g. "DG808S RUSSIA (ANRI)" from SimFlightPath
*/

class B21_File_GPX {

    constructor(tracklog) {
        this.tracklog = tracklog;
        this.file_type = "gpx";
        this.creator = null; // "Little Navmap" | "SimFlightPath 1.8"
    }

    //DEBUG reloading same GPX file should reset any task_fixup
    load(file_str, filename) {

        this.tracklog.filename = filename;

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(file_str, "text/xml");
        let gpxs = xmlDoc.getElementsByTagName("gpx");
        if (gpxs == null || gpxs.length == 0) {
            console.log("Bad GPX: failed to find 'gpx' element");
            return;
        }
        let gpx = gpxs[0];
        this.creator = gpx.getAttribute("creator");
        console.log("Creator",this.creator);

        let metadatas = gpx.getElementsByTagName("metadata");
        if (metadatas != null && metadatas.length != 0) {
            let descs = metadatas[0].getElementsByTagName("desc");
            if (descs != null & descs.length != 0) {
                let desc = descs[0].textContent;
                console.log("GPX load desc="+desc);
                let desc_index = desc.indexOf("✈"); // e.g. "✈ DG808S RUSSIA (ANRI)"
                if (desc_index >= 0) {
                    let plane_pilot = desc.slice(desc_index+2);
                    console.log("GPX load plane/pilot="+plane_pilot);
                    this.tracklog.plane_pilot = plane_pilot;

                    this.tracklog.tail_number = this.get_tail_number(desc);

                    this.tracklog.plane_icao = this.get_plane_icao(desc);

                }
            }
        }
        this.load_trks(gpx);
    }

    get_tail_number(in_str) {
        let i0 = in_str.lastIndexOf("(");
        if (i0 == -1) {
            return null;
        }
        let i1 = in_str.indexOf(")",i0+2);
        if (i1 == -1) {
            return null;
        }
        return in_str.substring(i0+1,i1);
    }

    get_plane_icao(in_str) {
        return "NO GPX PLANE ICAO"
    }

    // GPX file could have multiple <trk> elements, we only load the first
    load_trks(gpx) {
        let trks = gpx.getElementsByTagName("trk");
        if (trks == null || trks.length == 0) {
            console.log("Bad GPX: does not contain any 'trk' entries.");
            return;
        }

        //DEBUG only checking first "trk" element
        let trk = trks[0];

        this.load_trk(trk);
    }

    // GPX <trk> element could have multiple <trkseg> elements, we load all and concatenate them
    load_trk(trk) {
        let names = trk.getElementsByTagName("name");
        if (names != null && names.length > 0) {
            this.tracklog.name = names[0].childNodes[0].nodeValue;
        }
        let trksegs = trk.getElementsByTagName("trkseg");
        if (trksegs == null || trksegs.length == 0) {
            console.log("Bad GPX.trks[0].trksegs");
            return;
        }
        console.log(`GPX Loaded ${trksegs.length} 'trkseg' elements from GPX file.`);
        for (let i = 0; i < trksegs.length; i++) {
            let trkseg = trksegs[i];
            this.load_trkseg(i,trkseg);

        }
        console.log(`GPX load_gpx loaded ${this.tracklog.logpoints.length} logpoints`);
    }

    // Each GPX <trkseg> element contains the actual <trkpt> tracklog points
    load_trkseg(i,trkseg) {
        console.log(`GPX Loading 'trkseg[${i}]' entry from GPX file.`);
        let trkpts = trkseg.getElementsByTagName("trkpt");
        if (trkpts == null || trkpts.length == 0) {
            return;
        }
        let decoded_pt;
        for (let i = 0; i < trkpts.length; i++) {
            let trkpt = trkpts[i];
            if (i==1) { console.log("trkpt[1]:",trkpt); }
            decoded_pt = {};
            // lat
            decoded_pt["lat"] = parseFloat(trkpt.getAttribute("lat"));
            // lng
            decoded_pt["lng"] = parseFloat(trkpt.getAttribute("lon"));
            // alt_m
            let alts = trkpt.getElementsByTagName("ele");
            if (alts != null && alts.length != 0) {
                decoded_pt["alt_m"] = parseFloat(alts[0].childNodes[0].nodeValue);
            }
            // time_iso, ts
            let times = trkpt.getElementsByTagName("time");
            if (times != null && times.length != 0) {
                let time_iso = times[0].childNodes[0].nodeValue;
                decoded_pt["time_iso"] = time_iso;
                decoded_pt["ts"] = (new Date(time_iso)).getTime() / 1000; // logpoint.ts is in seconds from some day 0.
            }

            let airspeed_ms = null;
            let airspeeds = trkpt.getElementsByTagName("airspeed");
            if (airspeeds != null && airspeeds.length != 0) {
                airspeed_ms = parseFloat(airspeeds[0].childNodes[0].nodeValue);
            }
            if ( airspeed_ms != null && ! isNaN(airspeed_ms) ) {
                // We have found an "airspeed" value in the GPX (e.g. Alex's Albatross logger)
                // So will use that rather than ground speed calculate from the lat/long/time
                this.tracklog.using_airspeed = true;
                decoded_pt["speed_ms"] = airspeed_ms;
            } else {
                // speed m/s
                if (this.tracklog.logpoints.length > 0) {
                    let prev_pt = this.tracklog.logpoints[this.tracklog.logpoints.length - 1];
                    let prev_ts = prev_pt["ts"];
                    let time_delta_s = decoded_pt["ts"] - prev_ts;
                    let prev_speed_ms = prev_pt["speed_ms"];

                    let dist_m = Geo.get_distance_m(prev_pt, decoded_pt);
                    let speed_ms = dist_m / time_delta_s;
                    // Smoothing
                    const SMOOTH_S = this.creator == "Little Navmap" ? 10 : 1; // smoothing time constant
                    let weight = Math.min(1,time_delta_s / SMOOTH_S);
                    if (prev_speed_ms != null) {
                        decoded_pt["speed_ms"] = speed_ms * weight + prev_speed_ms * (1 - weight);
                    } else {
                        decoded_pt["speed_ms"] = speed_ms;
                    }
                }
            }

            // Store completed logpoint
            this.tracklog.logpoints.push(decoded_pt);
        }
    }

} // end class B21_File_GPX
