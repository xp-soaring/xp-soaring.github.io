// ******************************************************************************
// ***********   TrackLog class            **************************************
// ******************************************************************************

class B21_TrackLog {

    //DEBUG A TrackLog could have a 'task' property, which would be the task loaded from the GPX or IGC file
    constructor(index, planner, map) {
        let tracklog = this;
        tracklog.index = index; // Index of this tracklog in planner.tracklogs[]
        tracklog.planner = planner;
        tracklog.map = map;
        tracklog.map_bounds = null; // The Leaflet bounds of the line drawn on the map for this TrackLog
        tracklog.chart = null; // The reference to the highcharts chart.
        tracklog.current_plotline == null; // plotLine cursor for the currently selected plot point

        // Track Log file data
        tracklog.logpoints_index = null; // Currently selected logpoint

        // E.g. if the current task has a waypoint "MISSED", and user clicks "SELECT POINT" button, this will be non-null
        tracklog.select_point_info = null; // E.g. { "mode": "task_fixup", "waypoints_index": N }

        // Data from the GPX/IGC file
        tracklog.logpoints = []; // { lat: lng: alt_m: ts: time_iso: }
        tracklog.logpoints_file = []; // will store the ORIGINAL logpoints from gpx/igc file if we update e.g. for pauses
        tracklog.name = null;       // from the <trk>... <name> property in the GPX file
        tracklog.filename = null;   // from the dropped filename or URL
        tracklog.plane_pilot = null; // E.g. "DG808S RUSSIA (ANRI)"
        tracklog.using_airspeed = false; // set to true if we detect 'airspeed' properties in the GPX scoring_data
        tracklog.file_obj = null;  // Will contain a reference to a B21_File_GPX or B21_File_IGC object

        // Scoring data for this tracklog over task
        tracklog.scoring_data = null;

        // Skip pauses flag
        tracklog.skip_pause = false;

        // HTML elements updated by TrackLog
        tracklog.chart_el = document.createElement("div");
        tracklog.chart_el.className = "chart";
        tracklog.planner.charts_el.appendChild(tracklog.chart_el);

        tracklog.tracklog_info_name_el = document.getElementById("tracklog_info_name");
        tracklog.tracklog_info_task_el = document.getElementById("tracklog_info_task");

        tracklog.checked = true; // checkbox status = ticked when we first load tracklog
        // Set tracklog.color1, tracklog.color2 for the polylines (c1=long, c2=short) and aircraft_marker (c1=wings, c2=fuselage)
        const C1_COLORS = ['#333','#b30000','#D58C10','#46A844', '#178CE9', '#0000b3', '#b300b3'];//'#6a428a', '#C05FBC'];
        // Note we make c2 line length shorter than c1 length to increase pattern count
        const C2_COLORS = ['#FF4F4F','#FFFF4F','#FFB44F','#93FF4F','#4FFFF1','#f799ff','white'];

        tracklog.color1 = C1_COLORS[tracklog.index % C1_COLORS.length];
        if (tracklog.index < C1_COLORS.length) {
            tracklog.color2 =  tracklog.color1; // Start with solid colors
        } else {
            // Here tracklog.index >= C1_COLORS.length
            // After solid colors, we'll iterate through the c2 colors
            let c1_cycle = Math.floor(tracklog.index / C1_COLORS.length) - 1;
            let c2_offset = c1_cycle % C2_COLORS.length;
            tracklog.color2 = C2_COLORS[(tracklog.index % C1_COLORS.length + c2_offset) % C2_COLORS.length];
        }

        //console.log("tracklog colors",index,tracklog.color1, tracklog.color2);

        tracklog.line1_polyline = null; // line drawn for tracklog on map
        tracklog.line2_polyline = null; // Optional dashes for line

        tracklog.aircraft_marker = tracklog.create_marker();

        tracklog.alt_units_str = "m";
        tracklog.alt_scaler = 1;

        tracklog.speed_units_str = "kph";
        tracklog.speed_scaler = tracklog.planner.MS_TO_KPH;

        // Chart elements to hold chart POINT display text (i.e. time/alt/speed of current highlighted point)
        tracklog.chart_point_time = null;
        tracklog.chart_point_altitude = null;
        tracklog.chart_point_speed = null;

        // Chart elements to hold chart RANGE display text (i.e. time/alt/speed across current zoomed range)
        tracklog.chart_range_time = null;
        tracklog.chart_range_altitude = null;
        tracklog.chart_range_speed = null;
        tracklog.chart_range_distance = null;
        tracklog.chart_range_glide = null;

        tracklog.replay_ts_offset = 0; // The number of seconds to offset time for this tracklog during a replay, to sync starts.
    }

    load_gpx(file_str, filename) {
        let tracklog = this;
        try {
            tracklog.file_obj = new B21_File_GPX(tracklog);
            tracklog.file_obj.load(file_str, filename);
            tracklog.logpoints_file = tracklog.logpoints;

            if (tracklog.skip_pause) {
                console.log("B21_Tracklog.load_gpx loading tracklog with skip_pause = true");
                tracklog.skip_pause_logpoints();
            } else {
                tracklog.logpoints = tracklog.logpoints_file;
            }

            tracklog.aircraft_marker_update(tracklog);
            return true;
        } catch (e) {
            console.log(filename, "load_gpx exception", e);
        }

        return false;
    }

    load_igc(file_str, filename) {
        let tracklog = this;
        try {
            tracklog.file_obj = new B21_File_IGC(tracklog);
            tracklog.file_obj.load(file_str, filename);
            tracklog.logpoints_file = tracklog.logpoints;

            if (tracklog.skip_pause) {
                console.log("B21_Tracklog.load_igc loading tracklog with skip_pause = true");
                tracklog.skip_pause_logpoints();
            } else {
                tracklog.logpoints = tracklog.logpoints_file;
            }

            tracklog.aircraft_marker_update(tracklog);
            return true;
        } catch (e) {
            console.log(filename, "load_igc exception", e);
        }

        return false;
    }

    show() {
        let tracklog = this;
        console.log(`Tracklog[${tracklog.index}] ${tracklog.name} show()`);
        tracklog.checked = true;
        tracklog.chart_el.style.display = "block";
        tracklog.scroll_chart();


        tracklog.map.removeLayer(tracklog.line1_polyline);
        tracklog.map.removeLayer(tracklog.line2_polyline);

        tracklog.draw_map(); // will draw polyline on map and set tracklog.map_bounds

        if (! tracklog.map.getBounds().intersects(tracklog.map_bounds)) {
            tracklog.map.fitBounds(tracklog.map_bounds);
        }
        tracklog.aircraft_marker.addTo(tracklog.planner.map);
    }

    hide() {
        let tracklog = this;
        console.log(`Tracklog[${tracklog.index}] ${tracklog.name} hide()`);
        tracklog.checked = false;
        tracklog.chart_el.style.display = "none";
        tracklog.map.removeLayer(tracklog.line1_polyline);
        if (tracklog.line2_polyline != null) {
            tracklog.map.removeLayer(tracklog.line2_polyline);
        }
        tracklog.map.removeLayer(tracklog.aircraft_marker);
    }

    // Resize the chart to fit its container
    resize_chart() {
        let tracklog = this;
        if (tracklog.chart != null) {
            tracklog.chart.setSize(null,null);
        }
    }

    // Called by b21_task_planner when another tab is clicked
    tracklog_info_exit() {
        let tracklog = this;
        tracklog.unset_select_point_status(tracklog,null);
    }

    get_name() {
        let tracklog = this;
        return tracklog.name == null ? "" : tracklog.name;
    }

    get_filename() {
        let tracklog = this;
        return tracklog.filename == null ? "" : tracklog.filename;
    }

    // Return the JS seconds timestamp when this tracklog begins
    get_begin_ts() {
        let tracklog = this;
        return tracklog.logpoints[0].ts;
    }

    // Return the JS second timestamp when this tracklog did a good start (or return null)
    get_start_ts() {
        let tracklog = this;
        if (tracklog.scoring_data == null || tracklog.scoring_data["started_ok"] == null) {
            return null;
        }
        return tracklog.logpoints[tracklog.scoring_data["started_ok"]["logpoints_index"]]["ts"];
    }

    // Draw the polyline for this tracklog on the map
    draw_map() {
        let tracklog = this;
        const dash1_length = 12;
        const dash2_length = 6;

        let coords = tracklog.logpoints.map(p => [p.lat.toFixed(6), p.lng.toFixed(6)]);

        let line1_properties = {
            weight: 2,
            color: tracklog.color1,
            pane: "tracklogs_pane",
            lineCap: "butt"
        };

        // Draw line1 on map
        tracklog.line1_polyline = L.polyline(coords, line1_properties).addTo(tracklog.map);

        // Set the map bounds
        tracklog.map_bounds = tracklog.line1_polyline.getBounds();

        // Draw overlay dashed line for 2nd color if we've done all the solid dark colors
        if (tracklog.color2 != null) {
            let line2_properties = {
                weight: 2,
                color: tracklog.color2,
                pane: "tracklogs_pane",
                lineCap: "butt",
                dashArray: "6 12", //dash2_length + " " + dash1_length,
                dashOffset: "24" //dash1_length.toFixed(0)
            };
            tracklog.line2_polyline = L.polyline(coords, line2_properties).addTo(tracklog.map);
        }

    }

    // *****************************************************************
    // * Find the logpoint index given a timestamp
    // *****************************************************************

    // Return index of tracklog point with nearest timestamp (in seconds)
    // Works well when incrementing index forwards, but random point from zero should be binary split.
    ts_to_logpoints_index(start_index, ts) {
        let tracklog = this;
        if (start_index >= tracklog.logpoints.length - 1) {
            return tracklog.logpoints.length - 1;
        }
        let ts_delta = ts - tracklog.logpoints[start_index].ts;
        if (ts_delta <= 0) {
            return start_index;
        }

        let index = start_index;
        let prev_delta;
        while (ts_delta > 0 && ++index < tracklog.logpoints.length) {
            prev_delta = ts_delta;
            ts_delta = ts - tracklog.logpoints[index].ts;
        }

        // prev_delta > 0
        // ts_delta <= 0
        // If the previous point was nearer than the one at 'index', decrement index.
        if (prev_delta < -ts_delta) {
            index--;
        }

        if (index >= tracklog.logpoints.length) {
            return tracklog.logpoints.length - 1;
        }

        return index;
    }

    // *****************************************************************
    // * Set the tracklog status for given logpoints_index
    // *****************************************************************

    // User has clicked on the speed/alt chart so update tracklog.logpoints_index
    set_logpoints_index(logpoints_index) {
        let tracklog = this;

        let track_index = logpoints_index;

        // Update tracklog.logpoints_index
        if (track_index < 0) {
            track_index = 0;
        }
        if (track_index >= tracklog.logpoints.length) {
            track_index = tracklog.logpoints.length - 1;
        }
        tracklog.logpoints_index = track_index;

        let p1 = tracklog.logpoints[track_index];

        // Calculate bearing from this trackpoint to next
        let bearing = 0;
        let p2;
        if (track_index + 1 < tracklog.logpoints.length) {
            p2 = tracklog.logpoints[track_index + 1];
            bearing = Geo.get_bearing_deg(p1,p2);
        } else if (track_index + 1 == tracklog.logpoints.length & tracklog.logpoints.length > 2) {
            // If we are at the final trackpoint, we'll use the bearing from the previous trackpoint to this one
            p2 = tracklog.logpoints[track_index - 1];
            bearing = Geo.get_bearing_deg(p2,p1);
        }

        tracklog.aircraft_marker.setLatLng(new L.LatLng(p1.lat, p1.lng));
        tracklog.aircraft_marker.setRotationAngle(bearing);

        tracklog.draw_chart_line_for_logpoint(tracklog, track_index)

        tracklog.aircraft_marker_update(tracklog);

        tracklog.draw_chart_point_data(p1);

    }

    inc_current_logpoints_index() {
        let tracklog = this;
        tracklog.set_logpoints_index(tracklog.logpoints_index + 1);
    }

    dec_current_logpoints_index() {
        let tracklog = this;
        tracklog.set_logpoints_index(tracklog.logpoints_index - 1);
    }

    // ************************************************************************************
    // ********** Create and draw the Highcharts altitude/speed chart for this tracklog ***
    // ************************************************************************************

    // Use Highcharts to draw a time/altitude plot
    draw_chart() {
        let tracklog = this;
        console.log("B21_Tracklog.draw_chart()");

        if (tracklog.file_obj == null) {
            console.log("B21_Tracklog.draw_chart() skipping as file not loaded.");
            return;
        }

        B21_Utils.clear_div(tracklog.chart_el);

        // make string units value and scaler for Altitudes
        if (tracklog.planner.settings.altitude_units == "feet") {
            tracklog.alt_scaler = tracklog.planner.M_TO_FEET;
            tracklog.alt_units_str = "feet";
        }

        // make string units value and scaler for Speeds
        if (tracklog.planner.settings.speed_units == "knots") {
            tracklog.speed_scaler = tracklog.planner.MS_TO_KNOTS;
            tracklog.speed_units_str = "knots";
        }

        // Create chart data values
        let baro_points = tracklog.logpoints.map(p => [p.ts*1000, p.alt_m * tracklog.alt_scaler]);
        let speed_points = tracklog.logpoints.map(p => [p.ts*1000, p.speed_ms * tracklog.speed_scaler]);

        // Var to hold selection highlight rectangle
        let selection_rect;

        let title_length = tracklog.name == null ? tracklog.filename.length : tracklog.filename.length + tracklog.name.length;
        let title_join = title_length > 35 ? "<br/>" : " - ";
        let title_text = tracklog.name == null ? tracklog.filename : tracklog.name + title_join + tracklog.filename;

        // Draw chart
        tracklog.chart = new Highcharts.chart(tracklog.chart_el, {
            chart: {
                animation: false,
                //backgroundColor: "yellow",
                zoomType: 'x',
                events: {
                    selection: function(e) {
                        tracklog.chart_selected(tracklog, e);
                    },
                    click: function (e) {
                        // Convert timestamp to logpoints index, args (start_index, ts) where ts is JS seconds timestamp
                        let logpoints_index = tracklog.ts_to_logpoints_index(0, e.xAxis[0].value/1000); // Axis is JS Date values (ms)
                        console.log("chart clicked",logpoints_index);
                        tracklog.click_logpoints_index(logpoints_index);
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
                        return Highcharts.dateFormat('%H:%M', tracklog.value);
                    }
                }
            },
            yAxis: [{
                title: {
                    text: 'Altitude (' + tracklog.alt_units_str + ')'
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
                    text: (tracklog.using_airspeed ? "Airspeed" : "Ground Speed") + " (" + tracklog.speed_units_str + ")",
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
                visible: tracklog.planner.settings["show_speed_line_on_chart"] == "yes"
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
                    let str = tracklog.x+"<br/>";
                    let p = tracklog.logpoints[tracklog.point.index];
                    str += "Speed ("+tracklog.speed_units_str+"): "+ (p.speed_ms * tracklog.speed_scaler).toFixed(0)+"<br/>";
                    str += "Alt ("+tracklog.alt_units_str+"): "+(p.alt_m * tracklog.alt_scaler).toFixed(0);
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
                                tracklog.click_logpoints_index(e.point.index);
                            },
                            mouseOver: function(e) {
                                if (! tracklog.planner.replay_mode) {
                                    let track_index = e.target.index;
                                    tracklog.set_logpoints_index(track_index);
                                    //console.log("mouseover", tracklog.x, tracklog.y, e.target.index);
                                }
                            },
                            mouseOut: function(e) {
                                //console.log("mouseout", tracklog.x, tracklog.y, e.target.index);
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
                visible: tracklog.planner.settings["show_speed_line_on_chart"] == "yes"
            }],
            credits: {
                enabled: false
            }
        });

        selection_rect = tracklog.chart.renderer.rect(0, 0, 0, 0, 0).css({
            stroke: 'black',
            strokeWidth: '.5',
            fill: 'black',
            fillOpacity: '.1'
        }).add();

        // POINT data values top-left of chart
        let point_x_px = 67;
        tracklog.chart_point_time = tracklog.chart.renderer.label("Move mouse over chart to see point data here.", point_x_px, -5)
            .attr({ zIndex: 2 })
            .add();
        tracklog.chart_point_altitude = tracklog.chart.renderer.label("", point_x_px, 6).attr({zIndex: 2}).add();
        tracklog.chart_point_speed = tracklog.chart.renderer.label("", point_x_px, 17).attr({zIndex: 2}).add();

        // RANGE data values top-right of chart
        let range_x_px = tracklog.chart_el.offsetWidth - 160; // Position range numbers 110px from right edge of chart_el
        tracklog.chart_range_time = tracklog.chart.renderer.label("", range_x_px, -4).attr({zIndex: 2}).add();
        tracklog.chart_range_altitude = tracklog.chart.renderer.label("", range_x_px, 6).attr({zIndex: 2}).add();
        tracklog.chart_range_speed = tracklog.chart.renderer.label("", range_x_px, 16).attr({zIndex: 2}).add();
        tracklog.chart_range_distance = tracklog.chart.renderer.label("", range_x_px, 26).attr({zIndex: 2}).add();
        tracklog.chart_range_glide = tracklog.chart.renderer.label("", range_x_px - 160, -4)
            .attr({ zIndex: 2 })
            .css({
                "font-size": "16px"
            }).add();

        // Create colors boxes for assigned tracklog colors
        tracklog.chart.renderer.rect(10,2,54,10).attr({
            stroke: "#000",
            'stroke-width': 2,
            fill: tracklog.color1
        }).add();
        tracklog.chart.renderer.rect(30,2,16,10).attr({
            stroke: "#000",
            'stroke-width': 2,
            fill: tracklog.color2 == null ? tracklog.color1 : tracklog.color2
        }).add();

        // Scroll the 'charts' div so this chart is shown
        tracklog.scroll_chart();
    } // end draw_chart()

    // User has dragged mouse across chart and selected a range of this tracklog
    chart_selected(tracklog, e) {
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
            let index_min = tracklog.ts_to_logpoints_index(0,ts_min);
            let index_max = tracklog.ts_to_logpoints_index(index_min,ts_max);
            console.log("Chart select indexes",index_min, index_max);
            let p1 = tracklog.logpoints[index_min];
            let p2 = tracklog.logpoints[index_max];
            tracklog.draw_chart_range_data(p1,p2);
        } else {
            console.log("chart_selected no e.xAxis");
            tracklog.clear_chart_range_data();
        }
        return false;
    }

    // Write the points data numbers to top-left corner of the chart
    draw_chart_point_data(p1) {
        let tracklog = this;
        let time_str = (new Date(p1.ts*1000)).toUTCString().substring(5,25)+"Z";

        let speed_str = "Speed (" + tracklog.speed_units_str + "): " + ((p1.speed_ms == null ? 0 : p1.speed_ms) * tracklog.speed_scaler).toFixed(
            0) + "<br/>";

        let alt_str = "Alt (" + tracklog.alt_units_str + "): " + (p1.alt_m * tracklog.alt_scaler).toFixed(0);

        tracklog.chart_point_time.attr({
            text: time_str
        });
        tracklog.chart_point_altitude.attr({
            text: alt_str
        });
        tracklog.chart_point_speed.attr({
            text: speed_str
        });
    }

    // Write the range data numbers to top-right corner of chart
    draw_chart_range_data(p1,p2) {
        let tracklog = this;
        console.log("draw_chart_range_data", p1, p2);

        let time_delta_s = p2.ts - p1.ts

        let time_str = "&#916;time: "+B21_Utils.hh_mm_ss_from_ts_delta(time_delta_s);

        let height_delta_m = p2.alt_m - p1.alt_m;

        let alt_str = "&#916;height (" + tracklog.alt_units_str + "): " + ( height_delta_m * tracklog.alt_scaler).toFixed(0);

        let distance_m = Geo.get_distance_m(p1,p2);

        let dist_str = "Dist ";
        if (tracklog.planner.settings.distance_units == "km") {
            dist_str += "(km): " + (distance_m / 1000).toFixed(3);
        } else {
            dist_str += "(miles): " + (distance_m * tracklog.planner.M_TO_MILES).toFixed(3);
        }

        let ground_speed_ms = distance_m / time_delta_s;

        let speed_str = "Gnd speed (" + tracklog.speed_units_str + "): " + ((ground_speed_ms == null ? 0 : ground_speed_ms) * tracklog.speed_scaler).toFixed(
            0) + "<br/>";

        let glide_str;
        if (height_delta_m > 0) {
            let climb_ms = height_delta_m / time_delta_s;
            glide_str = "Climb ";
            if (tracklog.planner.settings.altitude_units == "m") {
                glide_str += "(m/s): " + climb_ms.toFixed(2);
            } else {
                glide_str += "(knots): " + (climb_ms * tracklog.planner.MS_TO_KNOTS).toFixed(1);
            }
        } else {
            let glide_ratio = distance_m / height_delta_m;

            glide_str = "Glide: " + (glide_ratio > 100 ? "100+" : (-distance_m / height_delta_m).toFixed(0))+":1";
        }

        tracklog.chart_range_time.attr({
            text: time_str
        });
        tracklog.chart_range_altitude.attr({
            text: alt_str
        });
        tracklog.chart_range_speed.attr({
            text: speed_str
        });
        tracklog.chart_range_distance.attr({
            text: dist_str
        });
        tracklog.chart_range_glide.attr({
            text: glide_str
        });
    }

    clear_chart_range_data() {
        let tracklog = this;
        tracklog.chart_range_time.attr({
            text: ""
        });
        tracklog.chart_range_altitude.attr({
            text: ""
        });
        tracklog.chart_range_speed.attr({
            text: ""
        });
        tracklog.chart_range_distance.attr({
            text: ""
        });
        tracklog.chart_range_glide.attr({
            text: ""
        });
    }

    // User has clicked on the chart
    click_logpoints_index(logpoints_index) {
        let tracklog = this;
        console.log("click_logpoints_index", logpoints_index, tracklog.aircraft_marker.getPopup().isOpen());
        tracklog.set_logpoints_index(logpoints_index);
        // If we're in task_fixup mode then manually set current logpoint as achieving current waypoint
        if (tracklog.select_point_info != null) {
            if (tracklog.select_point_info["mode"] == "task_fixup") {
                tracklog.task_fixup(tracklog, tracklog.select_point_info["wp_index"], logpoints_index);
                tracklog.chart.update({ chart: { backgroundColor: 'white' }})

            }
        } else {
            tracklog.aircraft_marker.togglePopup();
        //    tracklog.draw_chart_line_for_logpoint(tracklog, logpoints_index);
        }
    }

    // ******************************
    // SKIP PAUSE on/off
    // ******************************

    // Skip pause ON
    skip_pause_on() {
        let tracklog = this;
        console.log("B21_Tracklog.skip_pause_on");
        tracklog.skip_pause = true;
        tracklog.skip_pause_logpoints();
        tracklog.draw_chart();
    }

    // Skip pause OFF
    skip_pause_off() {
        let tracklog = this;
        console.log("B21_Tracklog.skip_pause_off");
        tracklog.skip_pause = false;
        tracklog.logpoints = tracklog.logpoints_file;
        tracklog.draw_chart();
    }

    skip_pause_logpoints() {
        let tracklog = this;
        console.log("B21_Tracklog.skip_pause_logpoints()");
        if (tracklog.logpoints_file.length < 100) {
            console.log("B21_Tracklog.skip_pause_logpoints() cancel too short");
            return;
        }

        let sample_period = 3;
        let prev_point = tracklog.logpoints_file[0];

        let time_adj_s = 0;

        let new_points = [];

        for (let i=0; i<tracklog.logpoints_file.length; i++) {
            let point = Object.assign({},tracklog.logpoints_file[i]); // SHALLOW COPY, ok for logpoint
            let sample_delta_s = point.ts - prev_point.ts;
            if (sample_delta_s > Math.max(15,sample_period * 3)) {
                // time delta between data points is enough for us to consider this as a possible 'pause'
                // Pause time  = sample_delta_s
                let distance_m = Geo.get_distance_m(prev_point, point);
                console.log("B21_Tracklog.skip_pause_logpoints() pause detected ",
                    point, prev_point,
                    "(" + sample_delta_s.toFixed(2) + " s) ("+ distance_m.toFixed(0) + " m)",
                    "(sample_period: "+sample_period.toFixed(1) + " s) (speed: "+prev_point.speed_ms.toFixed(1)+" ms)");
                if (distance_m < 400) { // If the plane has moved >400m between begin/end of pause, do not treat as pause (skipped data instead).
                    // We know the distance_m across the pause, so use an estimated speed to calculate the new time between pause data points
                    let pause_speed_ms = Math.max(25, Math.min(60, prev_point.speed_ms));
                    console.log("Using pause speed from prior point: "+pause_speed_ms.toFixed(1)+" ms");
                    let unpause_s = Math.max(sample_period, distance_m / pause_speed_ms); // The amount of time we will replace the pause with.
                    console.log("Using "+unpause_s+" s as time delta replacing pause.");
                    time_adj_s += unpause_s - sample_delta_s;
                    console.log("B21_Tracklog.skip_pause_logpoints() time adjust = "+ time_adj_s.toFixed(2) + " seconds");
                } else {
                    console.log("B21_Tracklog.skip_pause_logpoints() pause ignored, distance too high for valid pause.");
                }
            }

            sample_period = Math.min(12,sample_period * 0.9 + sample_delta_s * 0.1);

            if (time_adj_s != 0) {
                point.ts = point.ts + time_adj_s;
                let t = new Date(Date.UTC(1970,0,1));
                t.setUTCMilliseconds(point.ts*1000);
                point.time_iso = t.toISOString();
            }

            new_points.push(point);

            //ts = tracklog.logpoints_file[i].ts;
            prev_point = tracklog.logpoints_file[i];
        }

        tracklog.logpoints = new_points;
    }

    // ******************************
    // ICON DATA on/off
    // ******************************

    // Show the ICON DATA above the glider icon on the map
    show_icon_data() {
        let tracklog = this;
        tracklog.aircraft_marker.openPopup();
    }

    // Hide the ICON DATA above the glider icon on the map
    hide_icon_data() {
        let tracklog = this;
        tracklog.aircraft_marker.closePopup();
    }

    // ******************************
    // Tracklog chart cursor line
    // ******************************

    draw_chart_line_for_logpoint(tracklog, logpoints_index) {
        // Draw line on speed/alt chart
        let x_value = new Date(tracklog.logpoints[logpoints_index].time_iso);
        tracklog.chart.xAxis[0].removePlotLine("CURRENT");
        tracklog.chart.xAxis[0].addPlotLine({
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
        let tracklog = this;
        tracklog.chart_el.scrollIntoView();
    }

    // *****************************************************************************************
    // ********* Score this tracklog relative to the current task ******************************
    // *****************************************************************************************
    // Calculate the Task start/finish times etc. for this TrackLog
    // Updates tracklog.scoring_data
    // { started_ok: { logpoints_index: , wp_index: }
    //   finished_ok: { logpoints_index: , wp_index: , task_time_s: , task_speed_ms },
    //   waypoints[wp_index] = { "logpoints_index": i }
    // }
    //DEBUG scoring: add task_distance_m for completed task distance

    score_task() {
        let tracklog = this;

        console.log(`Scoring tracklog ${tracklog.index} ${tracklog.name} ${tracklog.filename}`);

        tracklog.scoring_data = { waypoints: []};

        let task = tracklog.planner.task;
        if (task == null || task.start_index == null || task.finish_index == null) {
            console.log("TrackLog score task: no good task");
            return;
        }

        let status = "PRE-START"; // "PRE-START", "STARTED", "WAYPOINTS", "FINISHED"

        let p1 = tracklog.logpoints[0];

        let wp_index = task.start_index + 1;

        // Is the start set in tracklog.task_fixup_info ?
        let start_fixed = tracklog.task_fixup_info != null && tracklog.task_fixup_info[""+task.start_index] != null;
        //console.log("score_task start_fixed=",start_fixed);
        let start_enabled = true; // will disable further starts if start is fixed

        for (let i = 1; i < tracklog.logpoints.length; i++) {
            let p2 = tracklog.logpoints[i];
            //console.log("TrackLog.score_task()[" + i + "] at " + p2.time_iso, status, p2);

            if (status == "PRE-START" || "STARTED") {
                if (start_fixed && start_enabled) {
                    start_enabled = false;
                    let logpoints_index = tracklog.task_fixup_info[""+task.start_index];
                    p1 = tracklog.logpoints[logpoints_index];
                    tracklog.score_start(logpoints_index, p1, task.start_index);
                    status = "STARTED";
                    i = logpoints_index + 1;
                    console.log("score_task skipping to logpoint",i);
                } else if (start_enabled && task.is_start(p1, p2)) {
                    tracklog.score_start(i-1,p1, task.start_index);
                    status = "STARTED";
                }
            }

            if ((status == "STARTED" || status == "WAYPOINTS") && wp_index != task.finish_index) {
                if (tracklog.task_fixup_info != null && tracklog.task_fixup_info[""+wp_index] != null) {
                    let logpoints_index = tracklog.task_fixup_info[""+wp_index];
                    p2 = tracklog.logpoints[logpoints_index];
                    tracklog.score_wp(logpoints_index, p2, wp_index);
                    status = "WAYPOINTS";
                    start_enabled = false;
                    wp_index++;
                    i = logpoints_index + 1;
                } else if (task.is_wp(wp_index, p1, p2)) {
                    tracklog.score_wp(i,p2,wp_index);
                    status = "WAYPOINTS";
                    start_enabled = false;
                    wp_index++;
                }
            } else if (wp_index == task.finish_index) {
                if (tracklog.task_fixup_info != null && tracklog.task_fixup_info[""+wp_index] != null) {
                    let logpoints_index = tracklog.task_fixup_info[""+wp_index];
                    p2 = tracklog.logpoints[logpoints_index];
                    tracklog.score_finish(logpoints_index, p2, wp_index);
                    status = "FINISHED";
                    break;
                } else if (task.is_finish(p1, p2)) {
                    tracklog.score_finish(i,p2,wp_index);
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
        let tracklog = this;
        // started_ok: { logpoints_index: , wp_index: }
        tracklog.scoring_data.started_ok = { logpoints_index: i, wp_index: wp_index} ;
        tracklog.scoring_data.start_index = i;
        tracklog.scoring_data.waypoints[tracklog.planner.task.start_index] = { "logpoints_index": i };
        let start_time_str = (new Date(p1.time_iso)).toTimeString().split(' ')[0];
        //console.log("TrackLog: started[" + i + "] at " + start_time_str);

        tracklog.chart.xAxis[0].addPlotLine({
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
        let tracklog = this;
        tracklog.scoring_data.waypoints[wp_index] = { "logpoints_index": i };
        let wp_time_str = (new Date(p2.time_iso)).toTimeString().split(' ')[0];
        //console.log("TrackLog: Completed WP[" + wp_index + "] logpoints[" + i + "] at " + wp_time_str);
        let wp_name = tracklog.planner.task.waypoints[wp_index].name;
        tracklog.chart.xAxis[0].addPlotLine({
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
        let tracklog = this;
        //finished_ok: { logpoints_index: , wp_index: , task_time_s: , task_speed_ms }
        tracklog.scoring_data.finished_ok = { logpoints_index: i, wp_index: wp_index };

        let start_logpoint = tracklog.logpoints[tracklog.scoring_data.started_ok["logpoints_index"]];
        let start_ts = start_logpoint["ts"];
        let finish_ts = p2["ts"];
        let task_time_s = finish_ts - start_ts;

        let distance_m = tracklog.planner.task.get_task_distance_m();
        let task_speed_ms = distance_m / task_time_s;

        tracklog.scoring_data.finished_ok["task_time_s"] = task_time_s;
        tracklog.scoring_data.finished_ok["task_speed_ms"] = task_speed_ms;

        tracklog.scoring_data.waypoints[wp_index] = { "logpoints_index": i };
        let finish_time_str = (new Date(p2.time_iso)).toTimeString().split(' ')[0];
        //console.log("TrackLog: Finish WP[" + wp_index + "] logpoints[" + i + "] at " + finish_time_str);
        tracklog.chart.xAxis[0].addPlotLine({
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
        let tracklog = this;
        let units_str = tracklog.planner.settings.altitude_units == "m" ? "m" : "feet";
        let units_factor = tracklog.planner.settings.altitude_units == "m" ? 1 : tracklog.planner.M_TO_FEET;
        return (alt_m * units_factor).toFixed(0) + "&nbsp;"+units_str;
    }

    is_finished() {
        let tracklog = this;
        return tracklog.scoring_data != null && tracklog.scoring_data["finished_ok"] != null;
    }

    // ************************************************************************************************
    // ************** Display task completion info for this tracklog on "Tracklog Info" tab ***********
    // ************************************************************************************************

    display_info() {
        console.log("TrackLog.display_info()");
        let tracklog = this;
        B21_Utils.clear_div(tracklog.tracklog_info_name_el);
        let name_str = tracklog.get_name();
        let filename_str = tracklog.get_filename();
        let name_width = tracklog.tracklog_info_name_el.offsetWidth;
        let filename_size = Math.max(...(filename_str.split(/[\s-]+/).map(el => el.length))); // find length of longest word in name
        console.log("tracklog.display_info name_size=",filename_size, "name_width=", name_width);
        if (filename_size > 36) {
            let divider = Math.round(Math.max(41,filename_size / 2));
            let fontsize = "14px"; //Math.max(9, Math.min( 16, name_width / 700 * 20)).toFixed(0)+"px";
            let front = filename_str.slice(0,divider);
            let back = filename_str.slice(divider);
            filename_str = front + " ... " + back;
            console.log("tracklog.display_info() adjusted filename_str="+filename_str);
            console.log("tracklog.display_info() adjusting font size:",fontsize);
            tracklog.tracklog_info_name_el.style = "font-size: "+fontsize; // scale font down from 16px
        }
        tracklog.tracklog_info_name_el.innerHTML = name_str + "<br/>" + filename_str;
        tracklog.unset_select_point_status(tracklog, null);
        tracklog.display_tracklog_info();
    }

    // Display info for this TrackLog around the Task
    display_tracklog_info() {
        let tracklog = this;
        console.log("TrackLog.display_tracklog_info()");
        tracklog.select_point_info = null; // reset 'select point' status
        let task = tracklog.planner.task;
        B21_Utils.clear_div(tracklog.tracklog_info_task_el);

        if (task.waypoints.length==0) {
            let no_task_el = document.createElement("div");
            no_task_el.innerHTML = "NO TASK LOADED";
            tracklog.tracklog_info_task_el.appendChild(no_task_el);
            return;
        }
        if (tracklog.scoring_data==null) {
            let no_scoring_el = document.createElement("div");
            no_scoring_el.innerHTML = "TRACKLOG NOT SCORED";
            tracklog.tracklog_info_task_el.appendChild(no_scoring_el);
            return;
        }

        // Write the tracklog task info to the left-panel
        let task_table_el = document.createElement("table");
        task_table_el.id = "tracklog_info_task_wps";
        tracklog.tracklog_info_task_el.appendChild(task_table_el);
        let wp_missed = false;
        for (let i=task.start_index; i<=task.finish_index; i++) {
            let wp_score_info = tracklog.scoring_data.waypoints[i];
            let wp = task.waypoints[i];
            if (wp_score_info!=null) {
                let logpoints_index = wp_score_info["logpoints_index"];
                let logpoint = tracklog.logpoints[logpoints_index];
                tracklog.display_tracklog_info_wp(task_table_el, wp, logpoint);
            } else {
                tracklog.display_tracklog_info_wp_missed(task_table_el, wp, wp_missed);
                wp_missed = true;
            }
        }

        // Write task completion summary
        if (tracklog.scoring_data["finished_ok"] != null) {
            let task_completion_el = document.createElement("div");
            task_completion_el.setAttribute("id", "tracklog_task_completion");
            tracklog.tracklog_info_task_el.appendChild(task_completion_el);

            //finished_ok: { logpoints_index: , wp_index: , task_time_s: , task_speed_ms }
            // Append task completion time
            let task_completion_time_el = document.createElement("div");
            task_completion_time_el.setAttribute("id", "tracklog_task_completion_time");
            task_completion_el.appendChild(task_completion_time_el);
            let task_time_s = tracklog.scoring_data.finished_ok["task_time_s"];
            let ss = ("0"+Math.floor(task_time_s % 60)).slice(-2);
            let mm = ("0"+Math.floor(task_time_s % 3600 / 60)).slice(-2);
            let hh = Math.floor(task_time_s / 3600);
            task_completion_time_el.innerHTML = "Task completed in "+hh+":"+mm+":"+ss;

            // Append task completion speed
            let task_completion_speed_el = document.createElement("div");
            task_completion_speed_el.setAttribute("id", "tracklog_task_completion_speed");
            task_completion_el.appendChild(task_completion_speed_el);
            let distance_m = task.get_task_distance_m();
            if (tracklog.planner.settings.distance_units == "miles") {
                let speed_mph = distance_m * tracklog.planner.M_TO_MILES / (task_time_s / 3600);
                task_completion_speed_el.innerHTML = `Task speed ${speed_mph.toFixed(2)} mph`;
            } else {
                let speed_kph = (distance_m / 1000) / (task_time_s / 3600);
                task_completion_speed_el.innerHTML = `Task speed ${speed_kph.toFixed(2)} kph`;
            }
        }
    }

    display_tracklog_info_wp(task_info_el, wp, logpoint) {
        let tracklog = this;
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
        alt_el.innerHTML = tracklog.altitude_str(logpoint.alt_m);
        info_el.appendChild(alt_el);

        task_info_el.appendChild(info_el);
    }

    // Add 'missed waypoint' row to tracklog info, 'wp_missed' true if EARLIER wp already missed
    display_tracklog_info_wp_missed(task_info_el, wp, wp_missed) {
        let tracklog = this;
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
            tracklog.unset_select_point_status(tracklog, button_el);
            button_el.addEventListener("click", (e) => { tracklog.pre_task_fixup(tracklog, e, wp.index); });
            missed_button_el.appendChild(button_el);
        }
        info_el.appendChild(missed_button_el);
        task_info_el.appendChild(info_el);
    }

    // ****************************************************************************************
    // Scoring WP fixup code, i.e. allow user to select a tracklog point for WP success
    // ****************************************************************************************

    // User has clicked "Set Point" button to fix up some missed waypoint on Tracklog Info
    pre_task_fixup(tracklog, e, wp_index) {
        console.log("pre_task_fixup for WP ", wp_index);
        if (tracklog.select_point_info == null) {
            tracklog.set_select_point_status(tracklog, e.target);
            tracklog.select_point_info = { "mode": "task_fixup", "wp_index": wp_index };
        } else {
            // Reset the task fixup process by redrawing the task info
            tracklog.display_tracklog_info();
        }
    }

    task_fixup(tracklog, wp_index, logpoints_index) {
        console.log("Task_fixup", wp_index, logpoints_index);
        let task = tracklog.planner.task;
        // Ensure the waypoint can't be fixed up to BEFORE a prior waypoint
        if (wp_index > 0 &&
            tracklog.scoring_data != null &&
            tracklog.scoring_data.waypoints[wp_index-1] != null &&
            logpoints_index <= tracklog.scoring_data.waypoints[wp_index-1]["logpoints_index"]
            ) {
            alert("Cannot fixup a WP completion BEFORE prior waypoint");
        } else {
            if (tracklog.task_fixup_info == null) {
                tracklog.task_fixup_info = {};
            }
            tracklog.task_fixup_info[""+wp_index] = logpoints_index;
        }
        tracklog.score_task();

        tracklog.display_tracklog_info();

        tracklog.planner.display_tracklogs(tracklog.planner);
    }

    set_select_point_status(tracklog, button_el) {
        let select_color = '#FCFFC5';
        button_el.innerHTML = "CLICK POINT ON BARO CHART";
        button_el.style.backgroundColor = select_color;
        button_el.title = "Click on the tracklog baro chart to select a point for this WP, or click this button again to cancel.";
        tracklog.chart.update({ chart: { backgroundColor: select_color }})
    }

    unset_select_point_status(tracklog, button_el) {
        if (button_el != null) {
            button_el.innerHTML = "CHOOSE POINT TO FIX";
            // Revert the color highlight in case they were previously set
            button_el.style.removeProperty("background-color");
            button_el.title = "You can change this WP to 'success' by choosing a point on the tracklog.";
        }
        tracklog.chart.update({ chart: { backgroundColor: 'white' }})
    }

    // **************************************************************************************
    // ************ Create the SVG glider aircraft_marker to show position on map   *********
    // **************************************************************************************

    create_marker() {
        let tracklog = this;
        let position = new L.latLng(0, 0);
        let c1 = "#fff";
        let c2 = "#fff";
        if (tracklog.index!=0) {
            c1 = tracklog.color1;
            c2 = tracklog.color2 == null ? tracklog.color1 : tracklog.color2;
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

        let aircraft_marker = L.marker([0,0], { icon: svgIcon, rotationOrigin: 'center'}); // extended using leaflet.rotationMarker

        let popup = L.popup({
            closeButton: true,
            className: "tracklog_popup",
            autoPan: false,
            autoClose: false
        }).setContent("no name set");

        aircraft_marker.bindPopup(popup);

        //aircraft_marker.on('mouseover', function(event) {
        //    aircraft_marker.openPopup();
        //});
        //aircraft_marker.on('mouseout', function(event) {
        //    aircraft_marker.closePopup();
        //});
        //aircraft_marker.on('click', (e) => {
        //    console.log("User icon click, popup open=",aircraft_marker.isPopupOpen(), aircraft_marker.getPopup().isOpen());
        //    aircraft_marker.openPopup();
        //});

        aircraft_marker.addTo(tracklog.planner.map);

        return aircraft_marker;
    }

    aircraft_marker_update(tracklog) {
        try {
            let name_str = tracklog.name;

            if (tracklog.logpoints_index != null) {
                let p1 = tracklog.logpoints[tracklog.logpoints_index];

                let speed_str = "" + ((p1.speed_ms == null ? 0 : p1.speed_ms) * tracklog.speed_scaler).toFixed(
                    0) + tracklog.speed_units_str ;

                let alt_str = "" + (p1.alt_m * tracklog.alt_scaler).toFixed(0) + tracklog.alt_units_str;

                let popup_str = alt_str + "<br/>"+ speed_str;

                tracklog.aircraft_marker.setPopupContent(popup_str);
            } else {
                tracklog.aircraft_marker.setPopupContent(name_str);
            }
            // Set text for the glider aircraft_marker popup
        } catch (e) {
            console.log("aircraft_marker_update exception",e);
        }
    }

    // *****************************************************************************************************
    // *****************************         Replay       **************************************************
    // *****************************************************************************************************

    // Will be called by b21_task_planner, given incremental timestamps
    replay_ts(ts) {
        let tracklog = this;
        //console.log(`tracklog[${tracklog.index}] replay_ts`, ts);
        let logpoints_index = tracklog.ts_to_logpoints_index(tracklog.logpoints_index,ts + tracklog.replay_ts_offset);
        tracklog.set_logpoints_index(logpoints_index);
    }

    replay_restart() {
        let tracklog = this;
        //console.log(`tracklog[${tracklog.index}] replay_restart()`);
        tracklog.set_logpoints_index(0);
    }

    // Called by b21_task_planner to offset the timing of this tracklog, to sync starts
    replay_update_offset(replay_start_ts) {
        let tracklog = this;
        if (replay_start_ts == null) {
            tracklog.replay_ts_offset = 0;
        } else {
            let start_ts = tracklog.get_start_ts();
            if (start_ts == null) {
                tracklog.replay_ts_offset = 0;
            } else {
                tracklog.replay_ts_offset = start_ts - replay_start_ts;
            }
        }
        //console.log("replay_update_offset for tracklog",tracklog.index,replay_start_ts, tracklog.replay_ts_offset);
    }

} // End class TrackLog
