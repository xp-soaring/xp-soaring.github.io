
"use strict"

class B21_Utils {

    static clear_div(d) {
        while (d.firstChild) {
            d.removeChild(d.lastChild);
        }
    }

    static hh_mm_ss_from_iso(time_iso) {
        return (new Date(time_iso)).toTimeString().split(' ')[0];
    }

    static hh_mm_ss_from_ts_delta(delta_s) {
        let hours = Math.floor(delta_s / 3600);
        let mins = Math.floor((delta_s - hours * 3600) / 60);
        let secs = Math.floor(delta_s % 60);

        let hh = "";
        if (hours >= 10) {
            hh = ""+hours+":";
        } else if (hours > 0) {
            hh = "0"+hours+":";
        }

        let mm = ("0"+mins).slice(-2)+":";

        let ss = ("0"+secs).slice(-2);

        return hh+mm+ss;
    }

    static file_suffix(filename) {
        return filename.toLowerCase().split('.').pop();
    }
}
