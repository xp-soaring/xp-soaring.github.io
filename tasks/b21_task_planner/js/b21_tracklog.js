// ******************************************************************************
// ***********   TrackLog class            **************************************
// ******************************************************************************

class B21_TrackLog {

    constructor(index, planner, map) {
        this.index = index; // Index of this tracklog in planner.tracklogs[]
        this.planner = planner;
        this.map = map;
        this.polyline = null; // The line drawn on the map for this TrackLog
        this.chart = null; // The reference to the highcharts chart.
        this.current_plotline == null; // plotLine cursor for the currently selected plot point
        // Track Log file data
        this.logpoints = []; // { lat: lng: alt_m: ts: time_iso: }
        this.name = null;
        this.filename = null;
        // Scoring data for this tracklog over task
        this.scoring_data = null;
        // HTML elements updated by TrackLog
        this.chart_el = document.getElementById("chart");
        this.tracklog_info_header_el = document.getElementById("tracklog_info_header");
        this.tracklog_info_task_el = document.getElementById("tracklog_info_task");
        this.tracklog_info_selected_el = document.getElementById("tracklog_info_selected");

        this.current_logpoint_index = null; // Currently selected logpoint

        this.baro_marker = this.planner.create_baro_marker();
    }

    get_name() {
        return this.name == null ? "" : this.name;
    }

    get_filename() {
        return this.filename == null ? "" : this.filename;
    }

    load_gpx(file_str, filename) {

        this.filename = filename;

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(file_str, "text/xml");
        let gpx = xmlDoc.getElementsByTagName("gpx");
        if (gpx == null || gpx.length == 0) {
            console.log("Bad GPX");
            return;
        }
        this.load_trks(gpx[0]);
    }

    load_trks(gpx) {
        let trks = gpx.getElementsByTagName("trk");
        if (trks == null || trks.length == 0) {
            console.log("Bad GPX.trks");
            return;
        }

        //DEBUG only checking first "trk" element
        let trk = trks[0];

        this.load_trk(trk);
    }

    load_trk(trk) {
        let names = trk.getElementsByTagName("name");
        if (names != null && names.length > 0) {
            this.name = names[0].childNodes[0].nodeValue;
        }
        let trksegs = trk.getElementsByTagName("trkseg");
        if (trksegs == null || trksegs.length == 0) {
            console.log("Bad GPX.trks[0].trksegs");
            return;
        }
        for (let i = 0; i < trksegs.length; i++) {
            let trkseg = trksegs[i];
            this.load_trkseg(trkseg);

        }
        console.log(`TrackLog.load_gpx loaded ${this.logpoints.length} logpoints`);
    }

    load_trkseg(trkseg) {
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
                decoded_pt["ts"] = (new Date(time_iso)).getTime() / 1000;
            }

            let airspeed_ms = null;
            let airspeeds = trkpt.getElementsByTagName("airspeed");
            if (airspeeds != null && airspeeds.length != 0) {
                airspeed_ms = parseFloat(airspeeds[0].childNodes[0].nodeValue);
            }
            if ( airspeed_ms != null && ! isNaN(airspeed_ms) ) {
                decoded_pt["speed_ms"] = airspeed_ms;
            } else {
                // speed m/s
                if (this.logpoints.length > 0) {
                    let prev_pt = this.logpoints[this.logpoints.length - 1];
                    let prev_ts = prev_pt["ts"];
                    let time_delta_s = decoded_pt["ts"] - prev_ts;
                    let prev_speed_ms = prev_pt["speed_ms"];

                    let dist_m = Geo.get_distance_m(prev_pt, decoded_pt);
                    let speed_ms = dist_m / time_delta_s;
                    // Smoothing
                    const SMOOTH_S = 10; // smoothing time constant
                    let weight = Math.min(1,time_delta_s / SMOOTH_S);
                    if (prev_speed_ms != null) {
                        decoded_pt["speed_ms"] = speed_ms * weight + prev_speed_ms * (1 - weight);
                    } else {
                        decoded_pt["speed_ms"] = speed_ms;
                    }
                }
            }
            if (i==1) { console.log("logpoint[1] airspeed_ms=",airspeed_ms, trkpt, decoded_pt); }
            // Store completed logpoint
            this.logpoints.push(decoded_pt);
        }
        return decoded_pt;
    }

    // Draw the polyline for this tracklog on the map
    draw_map() {
        let coords = this.logpoints.map(p => [p.lat.toFixed(6), p.lng.toFixed(6)]);

        this.polyline = L.polyline(coords, {
            weight: 2,
            color: 'darkred',
            pane: 'tracklogs_pane'
        }).addTo(this.map);
    }

    chart_selected(parent, e) {
        if (e.xAxis) {
            console.log("chart_selected [" + e.xAxis[0].min + ".." + e.xAxis[0].max + "]", e);
        } else {
            console.log("chart_selected no e.xAxis");
        }
        return false;
    }

    // Find index of tracklog point with nearest timestamp (in seconds)
    ts_to_logpoint_index(ts) {
        let min_delta = null;
        let index = null;
        for (let i=0; i<this.logpoints.length; i++) { // We could do this much more efficiently with a binary split
            let delta = Math.abs(this.logpoints[i].ts - ts);
            if (min_delta == null || delta < min_delta) {
                min_delta = delta;
                index = i;
            }
        }
        return index;
    }

    set_current_logpoint_index(i) {
        this.current_logpoint_index = i;
        if (this.current_logpoint_index < 0) {
            this.current_logpoint_index = 0;
        }
        if (this.current_logpoint_index >= this.logpoints.length) {
            this.current_logpoint_index = this.logpoints.length - 1;
        }
        let x_value = new Date(this.logpoints[this.current_logpoint_index].time_iso);
        this.chart.xAxis[0].removePlotLine("CURRENT");
        this.chart.xAxis[0].addPlotLine({
            id: "CURRENT",
            width: 2,
            value: x_value,
            color: 'blue',
            dashStyle: 'Solid',
            zIndex: 5
        });
    }

    inc_current_logpoint_index() {
        this.set_current_logpoint_index(this.current_logpoint_index + 1);
    }

    dec_current_logpoint_index() {
        this.set_current_logpoint_index(this.current_logpoint_index - 1);
    }

    // Use Highcharts to draw a time/altitude plot
    draw_chart() {
            let parent = this;

            this.clear_div(this.chart_el);

            // make string units value and scaler for Altitudes
            let alt_scaler = 1;
            let alt_units_str = "m";
            if (this.planner.settings.altitude_units == "feet") {
                alt_scaler = this.planner.M_TO_FEET;
                alt_units_str = "feet";
            }

            // make string units value and scaler for Speeds
            let speed_scaler = this.planner.MS_TO_KPH;
            let speed_units_str = "kph";
            if (this.planner.settings.speed_units == "knots") {
                speed_scaler = this.planner.MS_TO_KNOTS;
                speed_units_str = "knots";
            }

            // Create chart data values
            let baro_points = this.logpoints.map(p => [new Date(p.time_iso), p.alt_m * alt_scaler]);
            let speed_points = this.logpoints.map(p => [new Date(p.time_iso), p.speed_ms * speed_scaler]);

            // Var to hold selection highlight rectangle
            let selection_rect;

            // Vars to hold point data text
            let point_time;
            let point_altitude;
            let point_speed;

            // Draw chart
            this.chart = new Highcharts.chart(this.chart_el, {
                chart: {
                    zoomType: 'x',
                    /* events: {
                        selection: function(e) {
                            // Update highlight rectangle
                            var xMin = parent.chart.xAxis[0].translate((e.xAxis[0] || parent.chart.xAxis[0]).min),
                                xMax = parent.chart.xAxis[0].translate((e.xAxis[0] || parent.chart.xAxis[0]).max),
                                yMin = parent.chart.yAxis[0].translate((e.yAxis[0] || parent.chart.yAxis[0]).min),
                                yMax = parent.chart.yAxis[0].translate((e.yAxis[0] || parent.chart.yAxis[0]).max);

                            selection_rect.attr({
                                x: xMin + parent.chart.plotLeft,
                                y: parent.chart.plotHeight + parent.chart.plotTop - yMax,
                                width: xMax - xMin,
                                height: yMax - yMin
                            });

                            // Update app with regard to selection
                            return parent.chart_selected(parent, e);
                        },
                        click: function (e) {
                            console.log("chart clicked",e);
                            let logpoint_index = parent.ts_to_logpoint_index(e.xAxis[0].value/1000);
                            parent.set_current_logpoint_index(logpoint_index);
                        }
                    } */
                },
                title: {
                    text: this.name == null ? this.filename : this.name + " (" + this.filename + ")"
                },
                subtitle: { text: document.ontouchstart === undefined ?
                        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
                },
                xAxis: {
                    type: 'datetime'
                },
                yAxis: [{
                    title: {
                        text: 'Altitude (' + alt_units_str + ')'
                    },
                    lineColor: '#666633',
                    lineWidth: 2,
                    //min: 0,
                    //max: 12000,
                    startOnTick: true,
                    endOnTick: true,
                    //tickInterval: 1000,
                    //tickPixelInterval: 40
                }, {
                    title: {
                        text: 'Speed (' + speed_units_str + ')',
                        style: {
                            color: '#FF2222'
                        }
                    },
                    labels: {
                        style: {
                            color: '#FF2222'
                        }
                    },
                    startOnTick: true,
                    endOnTick: true,
                    lineColor: '#FF2222',
                    lineWidth: 2,
                    //min: 0,
                    //max: 200,
                    //tickInterval: 20,
                    alignTicks: true,
                    opposite: true
                }],
                legend: {
                    enabled: false
                },
                tooltip: {
                    enabled: false
                },
                /*
                    backgroundColor: '#FCFFC5',
                    borderColor: 'black',
                    borderRadius: 10,
                    borderWidth: 3,
                    formatter: function () {
                        let str = this.x+"<br/>";
                        let p = parent.logpoints[this.point.index];
                        str += "Speed ("+speed_units_str+"): "+ (p.speed_ms * speed_scaler).toFixed(0)+"<br/>";
                        str += "Alt ("+alt_units_str+"): "+(p.alt_m * alt_scaler).toFixed(0);
                         return str;
                    }
                }, */
                plotOptions: {
                    series: {
                        animation: false,
                        cursor: 'pointer',
                        //events: {
                            //click: function(e) {
                            //    console.log("series click", e);
                            //    return true;
                            //    //alert('You just clicked the graph at '+e.point.index);
                            //}
                        //},
                        point: {
                            events: {
                                click: function(e) {
                                    console.log("point click", e.point.index);
                                    parent.set_current_logpoint_index(e.point.index);
                                },
                                mouseOver: function(e) {
                                    let track_index = e.target.index;
                                    let p1 = parent.logpoints[track_index];

                                    // Calculate bearing from this trackpoint to next
                                    let bearing = 0;
                                    let p2;
                                    if (track_index + 1 < parent.logpoints.length) {
                                        p2 = parent.logpoints[track_index + 1];
                                        bearing = Geo.get_bearing_deg(p1,p2);
                                    } else if (track_index + 1 == parent.logpoints.length & parent.logpoints.length > 2) {
                                        // If we are at the final trackpoint, we'll use the bearing from the previous trackpoint to this one
                                        p2 = parent.logpoints[track_index - 1];
                                        bearing = Geo.get_bearing_deg(p2,p1);
                                    }

                                    let time_str = p1.time_iso; //parent.hh_mm_ss(p.time_iso);
                                    let speed_str = "Speed (" + speed_units_str + "): " + (p1.speed_ms * speed_scaler).toFixed(
                                        0) + "<br/>";
                                    let alt_str = "Alt (" + alt_units_str + "): " + (p1.alt_m * alt_scaler).toFixed(0);
                                    point_time.attr({
                                        text: time_str
                                    });
                                    point_altitude.attr({
                                        text: alt_str
                                    });
                                    point_speed.attr({
                                        text: speed_str
                                    });
                                    parent.baro_marker.setLatLng(new L.LatLng(p1.lat, p1.lng));
                                    parent.baro_marker.setRotationAngle(bearing);
                                    //console.log("mouseover", this.x, this.y, e.target.index);
                                },
                                mouseOut: function(e) {
                                    //console.log("mouseout", this.x, this.y, e.target.index);
                                }
                            }
                        }
                    },
                    line: {
                        enableMouseTracking: true,
                        lineWidth: 1,
                        color: '#666666'
                    }
                },
                series: [{
                    yAxis: 0,
                    type: 'line',
                    color: '#666633',
                    name: "Alt",
                    data: baro_points
                }, {
                    yAxis: 1,
                    type: 'line',
                    name: "Speed",
                    color: '#FF2222',
                    data: speed_points
                }],
                credits: {
                    enabled: false
                }
            });

            selection_rect = this.chart.renderer.rect(0, 0, 0, 0, 0).css({
                stroke: 'black',
                strokeWidth: '.5',
                fill: 'black',
                fillOpacity: '.1'
            }).add();

            point_time = this.chart.renderer.label("Move mouse over chart to see data here.", 10, 10).add();
            point_altitude = this.chart.renderer.label("", 10, 25).add();
            point_speed = this.chart.renderer.label("", 10, 40).add();
        } // end draw_baro()

    hh_mm_ss(time_iso) {
        return (new Date(time_iso)).toTimeString().split(' ')[0];
    }

    // Calculate the Task start/finish times etc. for this TrackLog
    // Updates this.scoring_data
    // { started_ok: true,
    //   finished_ok: true,
    //   waypoints[wp_index] = { "logpoint_index": i }
    // }
    score_task() {

        this.scoring_data = { waypoints: []};

        let task = this.planner.task;
        if (task == null || task.start_index == null || task.finish_index == null) {
            console.log("TrackLog score task: no good task");
            return;
        }

        let status = "PRE-START"; // "PRE-START", "STARTED", "WAYPOINTS", "FINISHED"

        let p1 = this.logpoints[0];

        let wp_index = task.start_index + 1;

        for (let i = 1; i < this.logpoints.length; i++) {
            let p2 = this.logpoints[i];
            let time_str = this.hh_mm_ss(p2.time_iso);
            //console.log("TrackLog.score_task()[" + i + "] at " + time_str, p2, status);

            if (status == "PRE-START" || "STARTED") {
                if (task.is_start(p1, p2)) {
                    this.scoring_data.started_ok = true;
                    this.scoring_data.waypoints[task.start_index] = { "logpoint_index": i-1 };
                    let start_time_str = (new Date(p1.time_iso)).toTimeString().split(' ')[0];
                    console.log("TrackLog: started[" + (i-1) + "] at " + start_time_str);

                    this.chart.xAxis[0].addPlotLine({
                        id: "START",
                        width: 2,
                        value: new Date(p1.time_iso),
                        color: 'green',
                        dashStyle: 'Solid',
                        label: {
                            text: 'Start'
                        },
                        zIndex: 5
                    });
                    status = "STARTED";
                }
            }

            if ((status == "STARTED" || status == "WAYPOINTS") && wp_index != task.finish_index) {
                if (task.is_wp(wp_index, p1, p2)) {
                    this.scoring_data.waypoints[wp_index] = { "logpoint_index": i };
                    let wp_time_str = (new Date(p2.time_iso)).toTimeString().split(' ')[0];
                    console.log("TrackLog: WP[" + wp_index + "] logpoints[" + i + "] at " + wp_time_str);
                    let wp_name = task.waypoints[wp_index].name;
                    this.chart.xAxis[0].addPlotLine({
                        id: "WP" + wp_index,
                        width: 1,
                        value: new Date(p1.time_iso),
                        color: 'green',
                        dashStyle: 'Solid',
                        label: {
                            text: wp_name
                        },
                        zIndex: 5
                    });
                    status = "WAYPOINTS";
                    wp_index += 1;
                }
            } else {
                if (task.is_finish(p1, p2)) {
                    this.scoring_data.finished_ok = true;
                    this.scoring_data.waypoints[wp_index] = { "logpoint_index": i };
                    let finish_time_str = (new Date(p2.time_iso)).toTimeString().split(' ')[0];
                    console.log("TrackLog: Finish WP[" + wp_index + "] logpoints[" + i + "] at " + finish_time_str);
                    this.chart.xAxis[0].addPlotLine({
                        id: "FINISH",
                        width: 2,
                        value: new Date(p1.time_iso),
                        color: 'green',
                        dashStyle: 'Solid',
                        label: {
                            text: 'Finish'
                        },
                        zIndex: 5
                    });
                    status = "FINISHED";
                    break;
                }
            }
            p1 = p2;
        }
        if (status != "FINISHED") {
            console.log("Task not finished, status=" + status + ", wp_index=" + wp_index);
        }
    }

    altitude_str(alt_m) {
        let units_str = this.planner.settings.altitude_units == "m" ? "m" : "feet";
        let units_factor = this.planner.settings.altitude_units == "m" ? 1 : this.planner.M_TO_FEET;
        return (alt_m * units_factor).toFixed(0) + "&nbsp;"+units_str;
    }

    clear_div(d) {
        while (d.firstChild) {
            d.removeChild(d.lastChild);
        }
    }

    display() {
        draw_chart();
    }

    //DEBUG write TrackLog.display_info
    display_info() {
        this.clear_div(this.tracklog_info_header_el);
        let name_el = document.createElement("div");
        name_el.className = "tracklog_name";
        name_el.innerHTML = this.get_name() + "<br/>" + this.get_filename();
        this.tracklog_info_header_el.appendChild(name_el);
        this.display_task_info();
        this.display_segment_info();
        this.display_point_info();
    }

    // Display info for this TrackLog around the Task
    display_task_info() {
        let task = this.planner.task;
        this.clear_div(this.tracklog_info_task_el);
        let header_el = document.createElement("div");
        header_el.className = "tracklog_info_header";
        header_el.innerHTML = "Tracklog Task Info:";
        this.tracklog_info_task_el.appendChild(header_el);

        //DEBUG set className for tracklog task info messages
        if (task.waypoints.length==0) {
            let no_task_el = document.createElement("div");
            no_task_el.innerHTML = "NO TASK LOADED";
            this.tracklog_info_task_el.appendChild(no_task_el);
            return;
        }
        if (this.scoring_data==null) {
            let no_scoring_el = document.createElement("div");
            no_scoring_el.innerHTML = "TRACKLOG NOT SCORED";
            this.tracklog_info_task_el.appendChild(no_scoring_el);
            return;
        }

        // Write the tracklog task info to the left-panel
        let task_table_el = document.createElement("table");
        this.tracklog_info_task_el.appendChild(task_table_el);
        for (let i=task.start_index; i<=task.finish_index; i++) {
            let wp_score_info = this.scoring_data.waypoints[i];
            let wp = task.waypoints[i];
            if (wp_score_info!=null) {
                let logpoint_index = wp_score_info["logpoint_index"];
                let logpoint = this.logpoints[logpoint_index];
                this.display_task_info_wp(task_table_el, wp, logpoint);
            } else {
                this.display_task_info_wp_missed(task_table_el, wp);
            }
        }

        // Write task completion summary
        if (this.scoring_data.finished_ok) {
            let task_completion_el = document.createElement("div");
            task_completion_el.setAttribute("id", "tracklog_task_completion");
            this.tracklog_info_task_el.appendChild(task_completion_el);

            // Append task completion time
            let task_completion_time_el = document.createElement("div");
            task_completion_time_el.setAttribute("id", "tracklog_task_completion_time");
            task_completion_el.appendChild(task_completion_time_el);
            let start_logpoint = this.logpoints[this.scoring_data.waypoints[task.start_index]["logpoint_index"]];
            let start_ts = start_logpoint["ts"];
            let finish_logpoint = this.logpoints[this.scoring_data.waypoints[task.finish_index]["logpoint_index"]];
            let finish_ts = finish_logpoint["ts"];
            let task_time_s = finish_ts - start_ts;
            let ss = ("0"+task_time_s % 60).slice(-2);
            let mm = ("0"+Math.floor(task_time_s % 3600 / 60)).slice(-2);
            let hh = Math.floor(task_time_s / 3600);
            task_completion_time_el.innerHTML = "Task completed in "+hh+":"+mm+":"+ss;

            // Append task completion speed
            let task_completion_speed_el = document.createElement("div");
            task_completion_speed_el.setAttribute("id", "tracklog_task_completion_speed");
            task_completion_el.appendChild(task_completion_speed_el);
            let distance_m = task.get_task_distance_m();
            let speed_ms = distance_m / task_time_s;
            if (this.planner.settings.distance_units == "miles") {
                let speed_mph = distance_m * this.planner.M_TO_MILES / (task_time_s / 3600);
                task_completion_speed_el.innerHTML = `Task speed ${speed_mph.toFixed(2)} mph`;
            } else {
                let speed_kph = (distance_m / 1000) / (task_time_s / 3600);
                task_completion_speed_el.innerHTML = `Task speed ${speed_kph.toFixed(2)} kph`;
            }

        }
    }

    display_task_info_wp(task_info_el, wp, logpoint) {
        let info_el = document.createElement("tr");
        info_el.className = "tracklog_wp_info";
        let name_el = document.createElement("td");
        name_el.className = "tracklog_wp_info_name";
        name_el.innerHTML = wp.get_name()+" "+
            this.hh_mm_ss(logpoint.time_iso) + " " +
            this.altitude_str(logpoint.alt_m);
        info_el.appendChild(name_el);
        task_info_el.appendChild(info_el);
    }

    display_task_info_wp_missed(task_info_el, wp) {
        let info_el = document.createElement("tr");
        info_el.className = "tracklog_wp_info";
        let name_el = document.createElement("td");
        name_el.className = "tracklog_wp_info_name";
        name_el.innerHTML = wp.get_name()+" MISSED.";
        info_el.appendChild(name_el);
        task_info_el.appendChild(info_el);
    }

    // Display info for the TrackLog segment selected on the chart
    display_segment_info() {
        this.clear_div(this.tracklog_info_selected_el);
        this.tracklog_info_selected_el.innerHTML = "TRACKLOG SEGMENT INFO";
    }

    // Display info for the current TrackLog point selected on the chart
    display_point_info() {
        this.clear_div(this.tracklog_info_selected_el);
        if (this.current_logpoint_index == null) {
            return;
        }
        this.tracklog_info_selected_el.innerHTML = "TRACKLOG POINT INFO";
    }

} // End class TrackLog
