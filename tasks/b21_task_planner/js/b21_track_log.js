// ******************************************************************************
// ***********   TrackLog class            **************************************
// ******************************************************************************

class B21_TrackLog {

    constructor(planner) {
        this.planner = planner;
        this.logpoints = [];
        this.name = null;
        this.filename = null;
        this.barograph = false; // Is baro chart displayed
    }

    get_name() {
        return this.name==null ? "" : this.name;
    }

    load_gpx(file_str, filename) {

        this.filename = filename;

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(file_str, "text/xml");
        let gpx = xmlDoc.getElementsByTagName("gpx");
        if (gpx==null || gpx.length==0) {
            console.log("Bad GPX");
            return;
        }
        this.load_trks(gpx[0]);
    }

    load_trks(gpx) {
        let trks = gpx.getElementsByTagName("trk");
        if (trks==null || trks.length==0) {
            console.log("Bad GPX.trks");
            return;
        }

        //DEBUG only checking first "trk" element
        let trk = trks[0];

        this.load_trk(trk);
    }

    load_trk(trk) {
        let names = trk.getElementsByTagName("name");
        if (names!=null && names.length>0) {
            this.name = names[0].childNodes[0].nodeValue;
        }
        let trksegs = trk.getElementsByTagName("trkseg");
        if (trksegs==null || trksegs.length==0) {
            console.log("Bad GPX.trks[0].trksegs");
            return;
        }
        for (let i=0; i<trksegs.length; i++) {
            let trkseg = trksegs[i];
            this.load_trkseg(trkseg);

        }
        console.log(`TrackLog.load_gpx loaded ${this.logpoints.length} logpoints`);
    }

    load_trkseg(trkseg) {
        let trkpts = trkseg.getElementsByTagName("trkpt");
        if (trkpts==null || trkpts.length==0) {
            return;
        }
        let decoded_pt;
        for (let i=0; i<trkpts.length; i++) {
            let trkpt = trkpts[i];
            decoded_pt = {};
            // lat
            decoded_pt["lat"] = parseFloat(trkpt.getAttribute("lat"));
            // lng
            decoded_pt["lng"] = parseFloat(trkpt.getAttribute("lon"));
            // alt_m
            let alts = trkpt.getElementsByTagName("ele");
            if (alts!=null && alts.length!=0) {
                decoded_pt["alt_m"] = parseFloat(alts[0].childNodes[0].nodeValue);
            }
            // time_iso, ts
            let times = trkpt.getElementsByTagName("time");
            if (times!=null && times.length!=0) {
                let time_iso = times[0].childNodes[0].nodeValue;
                decoded_pt["time_iso"] = time_iso;
                decoded_pt["ts"] = (new Date(time_iso)).getTime()/1000;
            }

            // speed m/s
            if (this.logpoints.length > 0) {
                let prev_pt = this.logpoints[this.logpoints.length-1];
                let dist_m = Geo.get_distance_m(prev_pt, decoded_pt);
                decoded_pt["speed_ms"] = dist_m / (decoded_pt["ts"] - prev_pt["ts"]);
            }
            this.logpoints.push(decoded_pt);
        }
        return decoded_pt;
    }

    // Draw the polyline for this tracklog on the map
    draw(map) {
        let coords = this.logpoints.map(p => [p.lat.toFixed(6), p.lng.toFixed(6)]);

        this.polyline = L.polyline(coords, { weight: 4, color: 'darkred' }).addTo(map);
    }

    chart_selected(parent, e) {
        if (e.xAxis) {
            console.log("chart_selected ["+e.xAxis[0].min+".."+e.xAxis[0].max+"]",e);
        } else {
            console.log("chart_selected no e.xAxis");
        }
        return false;
    }

    // Use Highcharts to draw a time/altitude plot
    draw_baro() {
        let parent = this;
        let el = document.getElementById("barograph");
        // If this is the 1st time we're drawing the chart, adjust size of map
        if (!this.barograph) {
            let map_el = document.getElementById("map");
            map_el.style.height = "75%";
            el.style.display = "block";
            this.barograph = true;
            this.planner.map.invalidateSize();
        }

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
        let chart = new Highcharts.chart('barograph', {
            chart: { zoomType: 'x',
                    events: {
                        selection: function (e) {
                            // Update highlight rectangle
                            var xMin = chart.xAxis[0].translate((e.xAxis[0]||chart.xAxis[0]).min),
                                xMax = chart.xAxis[0].translate((e.xAxis[0]||chart.xAxis[0]).max),
                                yMin = chart.yAxis[0].translate((e.yAxis[0]||chart.yAxis[0]).min),
                                yMax = chart.yAxis[0].translate((e.yAxis[0]||chart.yAxis[0]).max);

                            selection_rect.attr({
                                x: xMin + chart.plotLeft,
                                y: chart.plotHeight + chart.plotTop - yMax,
                                width: xMax - xMin,
                                height: yMax - yMin
                            });

                            // Update app with regard to selection
                            return parent.chart_selected(parent, e);
                        }
                    }
            },
            title: { text: this.name==null ? this.filename : this.name +" ("+this.filename+")" },
            //subtitle: { text: document.ontouchstart === undefined ?
            //        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            //},
            xAxis: { type: 'datetime' },
            yAxis: [ {  title: { text: 'Altitude ('+alt_units_str+')' },
                        //min: 0,
                        //max: 12000,
                        //startOnTick: false,
                        //endOnTick: false,
                        tickInterval: 1000,
                        tickPixelInterval: 20
                    },
                     {  title: { text: 'Speed ('+speed_units_str+')' },
                        //startOnTick: false,
                        //endOnTick: false,
                        min: 0,
                        //max: 200,
                        tickInterval: 25,
                        opposite: true }
                 ],
            legend: { enabled: false },
            tooltip: { enabled: false },
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
                    events: {
                        click: function (e) {
                            console.log("graph click",e);
                            //alert('You just clicked the graph at '+e.point.index);
                        }
                    },
                    point: {
                        events: {
                            click: function (e) { console.log("point clicked ",e.point.index); },
                            mouseOver: function (e) {
                                let p = parent.logpoints[e.target.index];
                                let time_str = p.time_iso;
                                let speed_str = "Speed ("+speed_units_str+"): "+ (p.speed_ms * speed_scaler).toFixed(0)+"<br/>";
                                let alt_str = "Alt ("+alt_units_str+"): "+(p.alt_m * alt_scaler).toFixed(0);
                                point_time.attr({ text: time_str });
                                point_altitude.attr({ text: alt_str });
                                point_speed.attr({ text: speed_str });
                                parent.planner.baro_marker.setLatLng(new L.LatLng(p.lat, p.lng));
                                //console.log("mouseover", this.x, this.y, e.target.index);
                            },
                            mouseOut: function (e) {
                                //console.log("mouseout", this.x, this.y, e.target.index);
                            }
                        }
                    }
                },
                area: {
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: { radius: 2 },
                    lineWidth: 1,
                    states: { hover: { lineWidth: 1 } },
                    threshold: null
                },
                line: {
                    enableMouseTracking: false,
                    lineWidth: 1,
                    color: '#666666'
                }
            },
            series: [ { yAxis: 0, type: 'area', name: "Alt", data: baro_points },
                      { yAxis: 1, type: 'line', name: "Speed", data: speed_points }]
        });

        selection_rect = chart.renderer.rect(0,0,0,0,0).css({
                            stroke: 'black',
                            strokeWidth: '.5',
                            fill: 'black',
                            fillOpacity: '.1'
                        }).add();

        point_time = chart.renderer.label("Move mouse over chart to see data here.",10,10).add();
        point_altitude = chart.renderer.label("",10,25).add();
        point_speed = chart.renderer.label("",10,40).add();

    } // end draw_baro()

} // End class TrackLog
