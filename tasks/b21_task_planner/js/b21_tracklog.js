// ******************************************************************************
// ***********   TrackLog class            **************************************
// ******************************************************************************

class B21_TrackLog {

    //DEBUG A TrackLog could have a 'task' property, which would be the task loaded from the GPX or IGC file
    constructor(index, planner, map) {
        this.index = index; // Index of this tracklog in planner.tracklogs[]
        this.planner = planner;
        this.map = map;
        this.map_bounds = null; // The Leaflet bounds of the line drawn on the map for this TrackLog
        this.chart = null; // The reference to the highcharts chart.
        this.current_plotline == null; // plotLine cursor for the currently selected plot point
        // Track Log file data
        this.logpoints = []; // { lat: lng: alt_m: ts: time_iso: }
        this.logpoints_index = null; // Currently selected logpoint

        // E.g. if the current task has a waypoint "MISSED", and user clicks "SELECT POINT" button, this will be non-null
        this.select_point_info = null; // E.g. { "mode": "task_fixup", "waypoints_index": N }

        // Identifying labels for the GPX file
        this.name = null;       // from the <trk>... <name> property in the GPX file
        this.filename = null;   // from the dropped filename or URL

        // Scoring data for this tracklog over task
        this.scoring_data = null;
        // HTML elements updated by TrackLog
        this.chart_el = document.createElement("div");
        this.chart_el.className = "chart";
        this.planner.charts_el.appendChild(this.chart_el);

        this.tracklog_info_name_el = document.getElementById("tracklog_info_name");
        this.tracklog_info_task_el = document.getElementById("tracklog_info_task");

        this.checked = true; // checkbox status = ticked when we first load tracklog
        this.using_airspeed = false; // set to true if we detect 'airspeed' properties in the GPX scoring_data

        this.file_obj = null;  // Will contain a reference to a B21_File_GPX or B21_File_IGC object

        // Set this.color1, this.color2 for the polylines (c1=long, c2=short) and icon (c1=wings, c2=fuselage)
        const C1_COLORS = ['#333','#b30000','#D58C10','#46A844', '#178CE9', '#0000b3', '#b300b3'];//'#6a428a', '#C05FBC'];
        // Note we make c2 line length shorter than c1 length to increase pattern count
        const C2_COLORS = ['#FF4F4F','#FFFF4F','#FFB44F','#93FF4F','#4FFFF1','#f799ff','white'];

        this.color1 = C1_COLORS[this.index % C1_COLORS.length];
        if (this.index < C1_COLORS.length) {
            this.color2 =  this.color1; // Start with solid colors
        } else {
            // Here this.index >= C1_COLORS.length
            // After solid colors, we'll iterate through the c2 colors
            let c1_cycle = Math.floor(this.index / C1_COLORS.length) - 1;
            let c2_offset = c1_cycle % C2_COLORS.length;
            this.color2 = C2_COLORS[(this.index % C1_COLORS.length + c2_offset) % C2_COLORS.length];
        }

        //console.log("tracklog colors",index,this.color1, this.color2);

        this.line1_polyline = null; // line drawn for tracklog on map
        this.line2_polyline = null; // Optional dashes for line

        this.icon = this.create_icon();

        this.alt_units_str = "m";
        this.alt_scaler = 1;

        this.speed_units_str = "kph";
        this.speed_scaler = this.planner.MS_TO_KPH;

        // Chart elements to hold chart POINT display text (i.e. time/alt/speed of current highlighted point)
        this.chart_point_time = null;
        this.chart_point_altitude = null;
        this.chart_point_speed = null;

        // Chart elements to hold chart RANGE display text (i.e. time/alt/speed across current zoomed range)
        this.chart_range_time = null;
        this.chart_range_altitude = null;
        this.chart_range_speed = null;
        this.chart_range_distance = null;
        this.chart_range_glide = null;

        this.replay_ts_offset = 0; // The number of seconds to offset time for this tracklog during a replay, to sync starts.
    }

    load_gpx(file_str, filename) {
        try {
            this.file_obj = new B21_File_GPX(this);
            this.file_obj.load(file_str, filename);
            // Set text for the glider icon popup
            this.icon.setPopupContent(this.name);
            return true;
        } catch (e) {
            console.log(filename, "load_gpx exception", e);
        }

        return false;
    }

    load_igc(file_str, filename) {
        try {
            this.file_obj = new B21_File_IGC(this);
            this.file_obj.load(file_str, filename);
            // Set text for the glider icon popup
            this.icon.setPopupContent(this.name);
            return true;
        } catch (e) {
            console.log(filename, "load_igc exception", e);
        }

        return false;
    }

    show() {
        console.log(`Tracklog[${this.index}] ${this.name} show()`);
        this.checked = true;
        this.chart_el.style.display = "block";
        this.scroll_chart();


        this.map.removeLayer(this.line1_polyline);
        this.map.removeLayer(this.line2_polyline);

        this.draw_map(); // will draw polyline on map and set this.map_bounds

        if (! this.map.getBounds().intersects(this.map_bounds)) {
            this.map.fitBounds(this.map_bounds);
        }
        this.icon.addTo(this.planner.map);
    }

    hide() {
        console.log(`Tracklog[${this.index}] ${this.name} hide()`);
        this.checked = false;
        this.chart_el.style.display = "none";
        this.map.removeLayer(this.line1_polyline);
        if (this.line2_polyline != null) {
            this.map.removeLayer(this.line2_polyline);
        }
        this.map.removeLayer(this.icon);
    }

    // Resize the chart to fit its container
    resize_chart() {
        if (this.chart != null) {
            this.chart.setSize(null,null);
        }
    }

    // Called by b21_task_planner when another tab is clicked
    tracklog_info_exit() {
        this.unset_select_point_status(this,null);
    }

    get_name() {
        return this.name == null ? "" : this.name;
    }

    get_filename() {
        return this.filename == null ? "" : this.filename;
    }

    // Return the JS seconds timestamp when this tracklog begins
    get_begin_ts() {
        return this.logpoints[0].ts;
    }

    // Return the JS second timestamp when this tracklog did a good start (or return null)
    get_start_ts() {
        if (this.scoring_data == null || this.scoring_data["started_ok"] == null) {
            return null;
        }
        return this.logpoints[this.scoring_data["started_ok"]["logpoints_index"]]["ts"];
    }

    // Draw the polyline for this tracklog on the map
    draw_map() {
        const dash1_length = 12;
        const dash2_length = 6;

        let coords = this.logpoints.map(p => [p.lat.toFixed(6), p.lng.toFixed(6)]);

        let line1_properties = {
            weight: 2,
            color: this.color1,
            pane: "tracklogs_pane",
            lineCap: "butt"
        };

        // Draw line1 on map
        this.line1_polyline = L.polyline(coords, line1_properties).addTo(this.map);

        // Set the map bounds
        this.map_bounds = this.line1_polyline.getBounds();

        // Draw overlay dashed line for 2nd color if we've done all the solid dark colors
        if (this.color2 != null) {
            let line2_properties = {
                weight: 2,
                color: this.color2,
                pane: "tracklogs_pane",
                lineCap: "butt",
                dashArray: "6 12", //dash2_length + " " + dash1_length,
                dashOffset: "24" //dash1_length.toFixed(0)
            };
            this.line2_polyline = L.polyline(coords, line2_properties).addTo(this.map);
        }

    }

    chart_selected(parent, e) {
        if (e.xAxis) {
            console.log("chart_selected [" + e.xAxis[0].min + ".." + e.xAxis[0].max + "]", e);
            // log the min and max of the primary, datetime x-axis
            console.log(
                Highcharts.dateFormat(
                    '%Y-%m-%d %H:%M:%S',
                    e.xAxis[0].min
                ),
                Highcharts.dateFormat(
                    '%Y-%m-%d %H:%M:%S',
                    e.xAxis[0].max
                )
            );
            // Get timestamps for range (note highcharts xaxis values are milliseconds)
            let ts_min = e.xAxis[0].min / 1000;
            let ts_max = e.xAxis[0].max / 1000;
            console.log("Chart select timestamps",ts_min, ts_max, "delta:", ts_max - ts_min);
            let index_min = parent.ts_to_logpoints_index(0,ts_min);
            let index_max = parent.ts_to_logpoints_index(index_min,ts_max);
            console.log("Chart select indexes",index_min, index_max);
            let p1 = parent.logpoints[index_min];
            let p2 = parent.logpoints[index_max];
            parent.draw_chart_range_data(p1,p2);
        } else {
            console.log("chart_selected no e.xAxis");
            parent.clear_chart_range_data();
        }
        return false;
    }

    // *****************************************************************
    // * Find the logpoint index given a timestamp
    // *****************************************************************

    // Return index of tracklog point with nearest timestamp (in seconds)
    // Works well when incrementing index forwards, but random point from zero should be binary split.
    ts_to_logpoints_index(start_index, ts) {
        if (start_index >= this.logpoints.length - 1) {
            return this.logpoints.length - 1;
        }
        let ts_delta = ts - this.logpoints[start_index].ts;
        if (ts_delta <= 0) {
            return start_index;
        }

        let index = start_index;
        let prev_delta;
        while (ts_delta > 0 && ++index < this.logpoints.length) {
            prev_delta = ts_delta;
            ts_delta = ts - this.logpoints[index].ts;
        }

        // prev_delta > 0
        // ts_delta <= 0
        // If the previous point was nearer than the one at 'index', decrement index.
        if (prev_delta < -ts_delta) {
            index--;
        }

        if (index >= this.logpoints.length) {
            return this.logpoints.length - 1;
        }

        return index;
    }

    // *****************************************************************
    // * Set the tracklog status for given logpoints_index
    // *****************************************************************

    // User has clicked on the speed/alt chart so update this.logpoints_index
    set_logpoints_index(logpoints_index) {
        let parent = this;

        let track_index = logpoints_index;

        // Update parent.logpoints_index
        if (track_index < 0) {
            track_index = 0;
        }
        if (track_index >= parent.logpoints.length) {
            track_index = parent.logpoints.length - 1;
        }
        parent.logpoints_index = track_index;

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

        parent.icon.setLatLng(new L.LatLng(p1.lat, p1.lng));
        parent.icon.setRotationAngle(bearing);

        parent.draw_chart_line_for_logpoint(parent, track_index)

        this.draw_chart_point_data(p1);

    }

    inc_current_logpoints_index() {
        this.set_logpoints_index(this.logpoints_index + 1);
    }

    dec_current_logpoints_index() {
        this.set_logpoints_index(this.logpoints_index - 1);
    }

    // ************************************************************************************
    // ********** Create and draw the Highcharts altitude/speed chart for this tracklog ***
    // ************************************************************************************

    // Use Highcharts to draw a time/altitude plot
    draw_chart() {
        let parent = this;

        B21_Utils.clear_div(this.chart_el);

        // make string units value and scaler for Altitudes
        if (this.planner.settings.altitude_units == "feet") {
            this.alt_scaler = this.planner.M_TO_FEET;
            this.alt_units_str = "feet";
        }

        // make string units value and scaler for Speeds
        if (this.planner.settings.speed_units == "knots") {
            this.speed_scaler = this.planner.MS_TO_KNOTS;
            this.speed_units_str = "knots";
        }

        // Create chart data values
        let baro_points = this.logpoints.map(p => [p.ts*1000, p.alt_m * this.alt_scaler]);
        let speed_points = this.logpoints.map(p => [p.ts*1000, p.speed_ms * this.speed_scaler]);

        // Var to hold selection highlight rectangle
        let selection_rect;

        let title_length = this.name == null ? this.filename.length : this.filename.length + this.name.length;
        let title_join = title_length > 35 ? "<br/>" : " - ";
        let title_text = this.name == null ? this.filename : this.name + title_join + this.filename;

        // Draw chart
        this.chart = new Highcharts.chart(this.chart_el, {
            chart: {
                animation: false,
                //backgroundColor: "yellow",
                zoomType: 'x',
                events: {
                    selection: function(e) {
                        parent.chart_selected(parent, e);
                    },
                    click: function (e) {
                        // Convert timestamp to logpoints index, args (start_index, ts) where ts is JS seconds timestamp
                        let logpoints_index = parent.ts_to_logpoints_index(0, e.xAxis[0].value/1000); // Axis is JS Date values (ms)
                        console.log("chart clicked",logpoints_index);
                        parent.click_logpoints_index(logpoints_index);
                    }
                }
            },
            title: {
                text: title_text,
                style: {
                    fontSize: "12px"
                }
            },
            //subtitle: { text: document.ontouchstart === undefined ?
            //        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            //},
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function() {
                        return Highcharts.dateFormat('%H:%M', this.value);
                    }
                }
            },
            yAxis: [{
                title: {
                    text: 'Altitude (' + this.alt_units_str + ')'
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
                    text: (this.using_airspeed ? "Airspeed" : "Ground Speed") + " (" + this.speed_units_str + ")",
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
                opposite: true,
                visible: this.planner.settings["show_speed_line_on_chart"] == "yes"
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
                    str += "Speed ("+this.speed_units_str+"): "+ (p.speed_ms * this.speed_scaler).toFixed(0)+"<br/>";
                    str += "Alt ("+this.alt_units_str+"): "+(p.alt_m * this.alt_scaler).toFixed(0);
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
                                parent.click_logpoints_index(e.point.index);
                            },
                            mouseOver: function(e) {
                                if (! parent.planner.replay_mode) {
                                    let track_index = e.target.index;
                                    parent.set_logpoints_index(track_index);
                                    //console.log("mouseover", this.x, this.y, e.target.index);
                                }
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
                //lineWidth: 3,
                data: baro_points
            }, {
                yAxis: 1,
                type: 'line',
                name: "Speed",
                color: '#FF2222',
                data: speed_points,
                enableMouseTracking: false,
                visible: this.planner.settings["show_speed_line_on_chart"] == "yes"
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

        // POINT data values top-left of chart
        let point_x_px = 67;
        this.chart_point_time = this.chart.renderer.label("Move mouse over chart to see point data here.", point_x_px, -5)
            .attr({ zIndex: 2 })
            .add();
        this.chart_point_altitude = this.chart.renderer.label("", point_x_px, 6).attr({zIndex: 2}).add();
        this.chart_point_speed = this.chart.renderer.label("", point_x_px, 17).attr({zIndex: 2}).add();

        // RANGE data values top-right of chart
        let range_x_px = this.chart_el.offsetWidth - 160; // Position range numbers 110px from right edge of chart_el
        this.chart_range_time = this.chart.renderer.label("", range_x_px, -4).attr({zIndex: 2}).add();
        this.chart_range_altitude = this.chart.renderer.label("", range_x_px, 6).attr({zIndex: 2}).add();
        this.chart_range_speed = this.chart.renderer.label("", range_x_px, 16).attr({zIndex: 2}).add();
        this.chart_range_distance = this.chart.renderer.label("", range_x_px, 26).attr({zIndex: 2}).add();
        this.chart_range_glide = this.chart.renderer.label("", range_x_px - 120, -4).attr({zIndex: 2}).add();

        // Create colors boxes for assigned tracklog colors
        this.chart.renderer.rect(10,2,54,10).attr({
            stroke: "#000",
            'stroke-width': 2,
            fill: this.color1
        }).add();
        this.chart.renderer.rect(30,2,16,10).attr({
            stroke: "#000",
            'stroke-width': 2,
            fill: this.color2 == null ? this.color1 : this.color2
        }).add();

        // Scroll the 'charts' div so this chart is shown
        this.scroll_chart();
    } // end draw_chart()

    // Write the points data numbers to top-left corner of the chart
    draw_chart_point_data(p1) {
        let time_str = (new Date(p1.ts*1000)).toUTCString().substring(5,25)+"Z";

        let speed_str = "Speed (" + this.speed_units_str + "): " + ((p1.speed_ms == null ? 0 : p1.speed_ms) * this.speed_scaler).toFixed(
            0) + "<br/>";

        let alt_str = "Alt (" + this.alt_units_str + "): " + (p1.alt_m * this.alt_scaler).toFixed(0);

        this.chart_point_time.attr({
            text: time_str
        });
        this.chart_point_altitude.attr({
            text: alt_str
        });
        this.chart_point_speed.attr({
            text: speed_str
        });
    }

    // Write the range data numbers to top-right corner of chart
    draw_chart_range_data(p1,p2) {
        console.log("draw_chart_range_data", p1, p2);

        let time_delta_s = p2.ts - p1.ts

        let time_str = "&#916;time: "+B21_Utils.hh_mm_ss_from_ts_delta(time_delta_s);

        let height_delta_m = p2.alt_m - p1.alt_m;

        let alt_str = "&#916;height (" + this.alt_units_str + "): " + ( height_delta_m * this.alt_scaler).toFixed(0);

        let distance_m = Geo.get_distance_m(p1,p2);

        let dist_str = "Dist ";
        if (this.planner.settings.distance_units == "km") {
            dist_str += "(km): " + (distance_m / 1000).toFixed(3);
        } else {
            dist_str += "(miles): " + (distance_m * this.planner.M_TO_MILES).toFixed(3);
        }

        let ground_speed_ms = distance_m / time_delta_s;

        let speed_str = "Gnd speed (" + this.speed_units_str + "): " + ((ground_speed_ms == null ? 0 : ground_speed_ms) * this.speed_scaler).toFixed(
            0) + "<br/>";

        let glide_str;
        if (height_delta_m > 0) {
            let climb_ms = height_delta_m / time_delta_s;
            glide_str = "Climb ";
            if (this.planner.settings.altitude_units == "m") {
                glide_str += "(m/s): " + climb_ms.toFixed(2);
            } else {
                glide_str += "(knots): " + (climb_ms * this.planner.MS_TO_KNOTS).toFixed(1);
            }
        } else {
            let glide_ratio = distance_m / height_delta_m;

            glide_str = "Glide: " + (glide_ratio > 100 ? "100+" : (-distance_m / height_delta_m).toFixed(0))+":1";
        }

        this.chart_range_time.attr({
            text: time_str
        });
        this.chart_range_altitude.attr({
            text: alt_str
        });
        this.chart_range_speed.attr({
            text: speed_str
        });
        this.chart_range_distance.attr({
            text: dist_str
        });
        this.chart_range_glide.attr({
            text: glide_str
        });
    }

    clear_chart_range_data() {
        this.chart_range_time.attr({
            text: ""
        });
        this.chart_range_altitude.attr({
            text: ""
        });
        this.chart_range_speed.attr({
            text: ""
        });
        this.chart_range_distance.attr({
            text: ""
        });
        this.chart_range_glide.attr({
            text: ""
        });
    }

    // User has clicked on the chart
    click_logpoints_index(logpoints_index) {
        let parent = this;
        parent.set_logpoints_index(logpoints_index);
        // If we're in task_fixup mode then manually set current logpoint as achieving current waypoint
        if (parent.select_point_info != null) {
            if (parent.select_point_info["mode"] == "task_fixup") {
                parent.task_fixup(parent, this.select_point_info["wp_index"], logpoints_index);
                parent.chart.update({ chart: { backgroundColor: 'white' }})

            }
        }// else {
        //    parent.draw_chart_line_for_logpoint(parent, logpoints_index);
        //}
    }

    draw_chart_line_for_logpoint(parent, logpoints_index) {
        // Draw line on speed/alt chart
        let x_value = new Date(parent.logpoints[logpoints_index].time_iso);
        parent.chart.xAxis[0].removePlotLine("CURRENT");
        parent.chart.xAxis[0].addPlotLine({
            id: "CURRENT",
            width: 1,
            value: x_value,
            color: 'blue',
            dashStyle: 'Solid',
            zIndex: 5
        });
    }

    // Scroll the 'charts' element until our chart is shown.
    scroll_chart() {
        this.chart_el.scrollIntoView();
    }

    // *****************************************************************************************
    // ********* Score this tracklog relative to the current task ******************************
    // *****************************************************************************************
    // Calculate the Task start/finish times etc. for this TrackLog
    // Updates this.scoring_data
    // { started_ok: { logpoints_index: , wp_index: }
    //   finished_ok: { logpoints_index: , wp_index: , task_time_s: , task_speed_ms },
    //   waypoints[wp_index] = { "logpoints_index": i }
    // }
    //DEBUG scoring: add task_distance_m for completed task distance

    score_task() {

        console.log(`Scoring tracklog ${this.index} ${this.name} ${this.filename}`);

        this.scoring_data = { waypoints: []};

        let task = this.planner.task;
        if (task == null || task.start_index == null || task.finish_index == null) {
            console.log("TrackLog score task: no good task");
            return;
        }

        let status = "PRE-START"; // "PRE-START", "STARTED", "WAYPOINTS", "FINISHED"

        let p1 = this.logpoints[0];

        let wp_index = task.start_index + 1;

        // Is the start set in this.task_fixup_info ?
        let start_fixed = this.task_fixup_info != null && this.task_fixup_info[""+task.start_index] != null;
        //console.log("score_task start_fixed=",start_fixed);
        let start_enabled = true; // will disable further starts if start is fixed

        for (let i = 1; i < this.logpoints.length; i++) {
            let p2 = this.logpoints[i];
            //console.log("TrackLog.score_task()[" + i + "] at " + p2.time_iso, status, p2);

            if (status == "PRE-START" || "STARTED") {
                if (start_fixed && start_enabled) {
                    start_enabled = false;
                    let logpoints_index = this.task_fixup_info[""+task.start_index];
                    p1 = this.logpoints[logpoints_index];
                    this.score_start(logpoints_index, p1, task.start_index);
                    status = "STARTED";
                    i = logpoints_index + 1;
                    console.log("score_task skipping to logpoint",i);
                } else if (start_enabled && task.is_start(p1, p2)) {
                    this.score_start(i-1,p1, task.start_index);
                    status = "STARTED";
                }
            }

            if ((status == "STARTED" || status == "WAYPOINTS") && wp_index != task.finish_index) {
                if (this.task_fixup_info != null && this.task_fixup_info[""+wp_index] != null) {
                    let logpoints_index = this.task_fixup_info[""+wp_index];
                    p2 = this.logpoints[logpoints_index];
                    this.score_wp(logpoints_index, p2, wp_index);
                    status = "WAYPOINTS";
                    start_enabled = false;
                    wp_index++;
                    i = logpoints_index + 1;
                } else if (task.is_wp(wp_index, p1, p2)) {
                    this.score_wp(i,p2,wp_index);
                    status = "WAYPOINTS";
                    start_enabled = false;
                    wp_index++;
                }
            } else if (wp_index == task.finish_index) {
                if (this.task_fixup_info != null && this.task_fixup_info[""+wp_index] != null) {
                    let logpoints_index = this.task_fixup_info[""+wp_index];
                    p2 = this.logpoints[logpoints_index];
                    this.score_finish(logpoints_index, p2, wp_index);
                    status = "FINISHED";
                    break;
                } else if (task.is_finish(p1, p2)) {
                    this.score_finish(i,p2,wp_index);
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

    score_start(i,p1, wp_index) {
        // started_ok: { logpoints_index: , wp_index: }
        this.scoring_data.started_ok = { logpoints_index: i, wp_index: wp_index} ;
        this.scoring_data.start_index = i;
        this.scoring_data.waypoints[this.planner.task.start_index] = { "logpoints_index": i };
        let start_time_str = (new Date(p1.time_iso)).toTimeString().split(' ')[0];
        //console.log("TrackLog: started[" + i + "] at " + start_time_str);

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
    }

    score_wp(i, p2, wp_index) {
        this.scoring_data.waypoints[wp_index] = { "logpoints_index": i };
        let wp_time_str = (new Date(p2.time_iso)).toTimeString().split(' ')[0];
        //console.log("TrackLog: Completed WP[" + wp_index + "] logpoints[" + i + "] at " + wp_time_str);
        let wp_name = this.planner.task.waypoints[wp_index].name;
        this.chart.xAxis[0].addPlotLine({
            id: "WP" + wp_index,
            width: 1,
            value: new Date(p2.time_iso),
            color: 'green',
            dashStyle: 'Solid',
            label: {
                text: wp_name
            },
            zIndex: 5
        });
    }

    score_finish(i, p2, wp_index) {
        //finished_ok: { logpoints_index: , wp_index: , task_time_s: , task_speed_ms }
        this.scoring_data.finished_ok = { logpoints_index: i, wp_index: wp_index };

        let start_logpoint = this.logpoints[this.scoring_data.started_ok["logpoints_index"]];
        let start_ts = start_logpoint["ts"];
        let finish_ts = p2["ts"];
        let task_time_s = finish_ts - start_ts;

        let distance_m = this.planner.task.get_task_distance_m();
        let task_speed_ms = distance_m / task_time_s;

        this.scoring_data.finished_ok["task_time_s"] = task_time_s;
        this.scoring_data.finished_ok["task_speed_ms"] = task_speed_ms;

        this.scoring_data.waypoints[wp_index] = { "logpoints_index": i };
        let finish_time_str = (new Date(p2.time_iso)).toTimeString().split(' ')[0];
        //console.log("TrackLog: Finish WP[" + wp_index + "] logpoints[" + i + "] at " + finish_time_str);
        this.chart.xAxis[0].addPlotLine({
            id: "FINISH",
            width: 2,
            value: new Date(p2.time_iso),
            color: 'green',
            dashStyle: 'Solid',
            label: {
                text: 'Finish'
            },
            zIndex: 5
        });
    }

    altitude_str(alt_m) {
        let units_str = this.planner.settings.altitude_units == "m" ? "m" : "feet";
        let units_factor = this.planner.settings.altitude_units == "m" ? 1 : this.planner.M_TO_FEET;
        return (alt_m * units_factor).toFixed(0) + "&nbsp;"+units_str;
    }

    is_finished() {
        return this.scoring_data != null && this.scoring_data["finished_ok"] != null;
    }

    // ************************************************************************************************
    // ************** Display task completion info for this tracklog on "Tracklog Info" tab ***********
    // ************************************************************************************************

    display_info() {
        console.log("TrackLog.display_info()");
        parent = this;
        B21_Utils.clear_div(parent.tracklog_info_name_el);
        let name_str = parent.get_name() + " <br/>" + parent.get_filename();;
        parent.tracklog_info_name_el.innerHTML =  name_str;
        let name_width = parent.tracklog_info_name_el.offsetWidth;
        let name_size = Math.max(...(name_str.split(/[\s-]+/).map(el => el.length))); // find length of longest word in name
        console.log("tracklog.display_info name_size=",name_size, "name_width=", name_width);
        if (name_size > 36) {
            let fontsize = Math.max(9, Math.min( 16, name_width / 700 * 20)).toFixed(0)+"px";
            console.log("tracklog.display_info() adjusting font size:",fontsize);
            parent.tracklog_info_name_el.style = "font-size: "+fontsize; // scale font down from 16px
        }
        parent.unset_select_point_status(parent, null);
        parent.display_tracklog_info();
    }

    // Display info for this TrackLog around the Task
    display_tracklog_info() {
        console.log("TrackLog.display_tracklog_info()");
        this.select_point_info = null; // reset 'select point' status
        let task = this.planner.task;
        B21_Utils.clear_div(this.tracklog_info_task_el);

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
        task_table_el.id = "tracklog_info_task_wps";
        this.tracklog_info_task_el.appendChild(task_table_el);
        let wp_missed = false;
        for (let i=task.start_index; i<=task.finish_index; i++) {
            let wp_score_info = this.scoring_data.waypoints[i];
            let wp = task.waypoints[i];
            if (wp_score_info!=null) {
                let logpoints_index = wp_score_info["logpoints_index"];
                let logpoint = this.logpoints[logpoints_index];
                this.display_tracklog_info_wp(task_table_el, wp, logpoint);
            } else {
                this.display_tracklog_info_wp_missed(task_table_el, wp, wp_missed);
                wp_missed = true;
            }
        }

        // Write task completion summary
        if (this.scoring_data["finished_ok"] != null) {
            let task_completion_el = document.createElement("div");
            task_completion_el.setAttribute("id", "tracklog_task_completion");
            this.tracklog_info_task_el.appendChild(task_completion_el);

            //finished_ok: { logpoints_index: , wp_index: , task_time_s: , task_speed_ms }
            // Append task completion time
            let task_completion_time_el = document.createElement("div");
            task_completion_time_el.setAttribute("id", "tracklog_task_completion_time");
            task_completion_el.appendChild(task_completion_time_el);
            let task_time_s = this.scoring_data.finished_ok["task_time_s"];
            let ss = ("0"+task_time_s % 60).slice(-2);
            let mm = ("0"+Math.floor(task_time_s % 3600 / 60)).slice(-2);
            let hh = Math.floor(task_time_s / 3600);
            task_completion_time_el.innerHTML = "Task completed in "+hh+":"+mm+":"+ss;

            // Append task completion speed
            let task_completion_speed_el = document.createElement("div");
            task_completion_speed_el.setAttribute("id", "tracklog_task_completion_speed");
            task_completion_el.appendChild(task_completion_speed_el);
            let distance_m = task.get_task_distance_m();
            if (this.planner.settings.distance_units == "miles") {
                let speed_mph = distance_m * this.planner.M_TO_MILES / (task_time_s / 3600);
                task_completion_speed_el.innerHTML = `Task speed ${speed_mph.toFixed(2)} mph`;
            } else {
                let speed_kph = (distance_m / 1000) / (task_time_s / 3600);
                task_completion_speed_el.innerHTML = `Task speed ${speed_kph.toFixed(2)} kph`;
            }
        }
    }

    display_tracklog_info_wp(task_info_el, wp, logpoint) {
        let info_el = document.createElement("tr");
        info_el.className = "tracklog_wp_info";
        // Name
        let name_el = document.createElement("td");
        name_el.className = "tracklog_wp_info_name";
        name_el.innerHTML = wp.get_name();
        info_el.appendChild(name_el);
        // Time
        let time_el = document.createElement("td");
        time_el.className = "tracklog_wp_info_time";
        time_el.innerHTML = B21_Utils.hh_mm_ss_from_iso(logpoint.time_iso);
        info_el.appendChild(time_el);
        // Altitude
        let alt_el = document.createElement("td");
        alt_el.className = "tracklog_wp_info_time";
        alt_el.innerHTML = this.altitude_str(logpoint.alt_m);
        info_el.appendChild(alt_el);

        task_info_el.appendChild(info_el);
    }

    // Add 'missed waypoint' row to tracklog info, 'wp_missed' true if EARLIER wp already missed
    display_tracklog_info_wp_missed(task_info_el, wp, wp_missed) {
        let parent = this;
        let info_el = document.createElement("tr");
        info_el.className = "tracklog_wp_info";
        // Name
        let name_el = document.createElement("td");
        name_el.className = "tracklog_wp_info_name";
        name_el.innerHTML = wp.get_name();
        info_el.appendChild(name_el);
        // Missed
        let missed_el = document.createElement("td");
        missed_el.className = "tracklog_wp_info_missed";
        missed_el.innerHTML = wp_missed ? "-----" : "MISSED";
        info_el.appendChild(missed_el);
        // Button
        let missed_button_el = document.createElement("td");
        missed_button_el.className = "tracklog_wp_info_missed_button";
        if (wp_missed) {
            missed_button_el.innerHTML = "";
        } else {
            let button_el = document.createElement("button");
            parent.unset_select_point_status(parent, button_el);
            button_el.addEventListener("click", (e) => { parent.pre_task_fixup(parent, e, wp.index); });
            missed_button_el.appendChild(button_el);
        }
        info_el.appendChild(missed_button_el);
        task_info_el.appendChild(info_el);
    }

    // ****************************************************************************************
    // Scoring WP fixup code, i.e. allow user to select a tracklog point for WP success
    // ****************************************************************************************

    // User has clicked "Set Point" button to fix up some missed waypoint on Tracklog Info
    pre_task_fixup(parent, e, wp_index) {
        console.log("pre_task_fixup for WP ", wp_index);
        if (this.select_point_info == null) {
            parent.set_select_point_status(parent, e.target);
            this.select_point_info = { "mode": "task_fixup", "wp_index": wp_index };
        } else {
            // Reset the task fixup process by redrawing the task info
            this.display_tracklog_info();
        }
    }

    task_fixup(parent, wp_index, logpoints_index) {
        console.log("Task_fixup", wp_index, logpoints_index);
        let task = parent.planner.task;
        // Ensure the waypoint can't be fixed up to BEFORE a prior waypoint
        if (wp_index > 0 &&
            parent.scoring_data != null &&
            parent.scoring_data.waypoints[wp_index-1] != null &&
            logpoints_index <= parent.scoring_data.waypoints[wp_index-1]["logpoints_index"]
            ) {
            alert("Cannot fixup a WP completion BEFORE prior waypoint");
        } else {
            if (parent.task_fixup_info == null) {
                parent.task_fixup_info = {};
            }
            parent.task_fixup_info[""+wp_index] = logpoints_index;
        }
        parent.score_task();

        parent.display_tracklog_info();

        parent.planner.display_tracklogs(parent.planner);
    }

    set_select_point_status(parent, button_el) {
        let select_color = '#FCFFC5';
        button_el.innerHTML = "CLICK POINT ON BARO CHART";
        button_el.style.backgroundColor = select_color;
        button_el.title = "Click on the tracklog baro chart to select a point for this WP, or click this button again to cancel.";
        parent.chart.update({ chart: { backgroundColor: select_color }})
    }

    unset_select_point_status(parent, button_el) {
        if (button_el != null) {
            button_el.innerHTML = "CHOOSE POINT TO FIX";
            // Revert the color highlight in case they were previously set
            button_el.style.removeProperty("background-color");
            button_el.title = "You can change this WP to 'success' by choosing a point on the tracklog.";
        }
        parent.chart.update({ chart: { backgroundColor: 'white' }})
    }

    // ***************************************************************************
    // ************ Create the SVG glider icon to show position on map   *********
    // ***************************************************************************

    create_icon() {
        let parent = this;
        let position = new L.latLng(0, 0);
        let c1 = "#fff";
        let c2 = "#fff";
        if (this.index!=0) {
            c1 = this.color1;
            c2 = this.color2 == null ? this.color1 : this.color2;
        }
        // Glider icon with separate wings & fuselage for coloring
        const svgIcon = L.divIcon({
            html: `
            <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
             <g id="Layer_1">
              <title>Layer 1</title>
              <path id="wings" d="M33 37 h 14 l 12 2 v 2 h -56 v -2 l 12 -2 z" stroke="#000" fill="`+c1+`"/>
              <path id="fuselage" d="M30 31 h 2 l 1 6 v4 l -1 20  h 5 v 2 h -12 v -2  h 5 l -1 -20 v -4 z" stroke="#000" fill="`+c2+`"/>
             </g>
            </svg>
            `,
            className: "",
            iconSize: [64,64],
            iconAnchor: [32,32]
        });

        let icon = L.marker([0,0], { icon: svgIcon, rotationOrigin: 'center'}); // extended using leaflet.rotationMarker

        icon.bindPopup("no name set");

        icon.on('mouseover', function(event) {
            icon.openPopup();
        });
        icon.on('mouseout', function(event) {
            icon.closePopup();
        });
        icon.on('click', (e) => {
            //icon.setRotationAngle(90);
            console.log("User icon click");
        });
        icon.addTo(this.planner.map);

        return icon;
    }

    // *****************************************************************************************************
    // *****************************         Replay       **************************************************
    // *****************************************************************************************************

    // Will be called by b21_task_planner, given incremental timestamps
    replay_ts(ts) {
        //console.log(`tracklog[${this.index}] replay_ts`, ts);
        let logpoints_index = this.ts_to_logpoints_index(this.logpoints_index,ts + this.replay_ts_offset);
        this.set_logpoints_index(logpoints_index);
    }

    replay_restart() {
        //console.log(`tracklog[${this.index}] replay_restart()`);
        this.set_logpoints_index(0);
    }

    // Called by b21_task_planner to offset the timing of this tracklog, to sync starts
    replay_update_offset(replay_start_ts) {
        if (replay_start_ts == null) {
            this.replay_ts_offset = 0;
        } else {
            let start_ts = this.get_start_ts();
            if (start_ts == null) {
                this.replay_ts_offset = 0;
            } else {
                this.replay_ts_offset = start_ts - replay_start_ts;
            }
        }
        //console.log("replay_update_offset for tracklog",this.index,replay_start_ts, this.replay_ts_offset);
    }

} // End class TrackLog
