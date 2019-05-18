// k_prog.js Version 2.10 7-nov-02

// This file contains all the code for the Krasnoff Soaring Simulator

// Credits:
//   Peter Krasnoff - designed a soaring game using 'climb' and 'cruise' cards, establishing
//                    the principles on which this computer version is based.
//   Ian Forster-Lewis - main author of this program
//   John W - McCready/Arrival Height/Speed to Fly flight computer programmer

// 5-nov-02: adding panel.jpg for animated instrument graphics

// 24-feb-02: when you change speed, code no longer creates new random distance to next thermal
//            implemented sort_results() so display of results list is sorted neatly
//            added code to prevent re-click of Start Task button and Climb button

// 26-jan-02: moved js code out of k_prog.html into k_prog.js
//            altered k_day0.html to call day_init() on load rather than top.krasnoff directly
//            changed pull-up calculation to factor in thermal width, speed of entry, min sink

// **********************************************************************************
// ALL THE CODE FOR THE SIMULATOR FOLLOWS BELOW:
// **********************************************************************************

var messages_div;

function init()
{
  messages_div = document.getElementById('messages');
  load_results();
  update_form1();
}
// **********************************************************************************
// Cookie functions
// **********************************************************************************

function getCookie (name)
  {
    var dcookie = document.cookie; 
    var cname = name + "=";
    var clen = dcookie.length;
		// alert("Cookie size = " + clen); // debug
    var cbegin = 0;
    while (cbegin < clen)
      {
        var vbegin = cbegin + cname.length;
        if (dcookie.substring(cbegin, vbegin) == cname)
          { 
            var vend = dcookie.indexOf (";", vbegin);
            if (vend == -1) vend = clen;
            return unescape(dcookie.substring(vbegin, vend));
          }
        cbegin = dcookie.indexOf(" ", cbegin) + 1;
        if (cbegin == 0) break;
      }
    return null;
  }

function setCookie (name, value)
  {
    var expdate = new Date();
    // Set expiration date to a year from now.
    expdate.setTime(expdate.getTime() +  (24 * 60 * 60 * 1000 * 365)); 
    document.cookie = name + "=" + escape (value) + "; expires=" + expdate.toGMTString();
  }

function delCookie (name)
  {
    var expireNow = new Date();
    document.cookie = name + "=" + "; expires=Thu, 01-Jan-70 00:00:01 GMT";
  } 

// End of cookie code adapted from Nick Heinle

var cookie_name = "krasnoff"; // name of cookie used to store results

// results arrays r_<value>[n] is result n

var num_results = 0;  // number of results stored in cookie
var max_results = 15; // store maximum of 15 results in cookie (cookie space limit)
    // COOKIE VALUES:
var r_timestamp = new Array; // timestamp of result entry
var r_day = new Array;       // competition day of this result
var r_glider = new Array;    // type of glider flown (0=asw-28 etc)
var r_pilot = new Array;     // id of pilot
var r_speed = new Array;     // speed achieved (km/h, 0 if landout)
var r_hspeed = new Array;    // handicapped speed achieved (km/h)
var r_distance = new Array;  // distance achieved (km)
var r_hdistance = new Array; // handicapped distance achieved

var results_tag = "<rs>";      // XML tags wrapped around results in cookie
var results_end_tag = "</rs>";
var result_tag = "<r>";
var result_end_tag = "</r>";
var timestamp_tag = "<t>";
var timestamp_end_tag = "</t>";
var day_tag = "<dy>";
var day_end_tag = "</dy>";
var glider_tag = "<g>";
var glider_end_tag = "</g>";
var pilot_tag = "<p>";
var pilot_end_tag = "</p>";
var speed_tag = "<s>";
var speed_end_tag = "</s>";
var hspeed_tag = "<hs>";
var hspeed_end_tag = "</hs>";
var distance_tag = "<d>";
var distance_end_tag = "</d>";
var hdistance_tag = "<hd>";
var hdistance_end_tag = "</hd>";

var xml_cursor = 0;
function strip_tags(source, start, open_tag, close_tag)
  {
    if (source=="") return "";
		if (start>=source.length) return ""
	  xml_cursor = start;
    var i = source.indexOf(open_tag, start);
		if (i==-1) return "";
		i = i + open_tag.length;
		var j = source.indexOf(close_tag,i);
		if (j==-1) return "";
		xml_cursor = j + close_tag.length;
		return source.substring(i,j);
	}

function load_results() // populates global results variables from cookie
  {
    var result;
    num_results = 0;
    var r_string = getCookie(cookie_name); // load entire results string
		if (r_string==null)
		  {
			  // alert("Current "+cookie_name+" cookie is null"); // debug
  			return;
			}
    var i = 0;                             // index into r_string
    result = strip_tags(r_string, 0, result_tag, result_end_tag);
    while (result.length > 0)
      {
        r_timestamp[num_results] = strip_tags(result, 0, timestamp_tag, timestamp_end_tag);
        r_day[num_results] = strip_tags(result, 0, day_tag, day_end_tag);
        r_glider[num_results] = strip_tags(result, 0, glider_tag, glider_end_tag);
        r_pilot[num_results] = strip_tags(result, 0, pilot_tag, pilot_end_tag);
        r_speed[num_results] = strip_tags(result, 0, speed_tag, speed_end_tag);
        r_hspeed[num_results] = strip_tags(result, 0, hspeed_tag, hspeed_end_tag);
        r_distance[num_results] = strip_tags(result, 0, distance_tag, distance_end_tag);
        r_hdistance[num_results] = strip_tags(result, 0, hdistance_tag, hdistance_end_tag);
        num_results++;
        i = i + result.length;
        result = strip_tags(r_string, i, result_tag, result_end_tag);        
      }
    if (num_results>0) current_pilot =  r_pilot[num_results-1]; // set current_pilot to most recent value in results cookie
    // alert(num_results+" results loaded"); // debug
  }

function show_results()
  {
     var message_text = "<html>";
     message_text += "<head><title>Results</title></head>";
     message_text += "<body><font face='Helvetica'>";
     message_text += "<h2>Krasnoff County Regionals: Results</h2>";
     message_text += "<table border='1'>";
		 message_text += show_heading();
		 for (var i = num_results-1;i>=0;i--)
		   {
			   message_text += show_result(i);
			 }
     message_text += "</table></font></body></html>";
     messages_div.innerHTML = message_text;
  }

function show_heading()
  {
    var message_text = '';
    message_text += "<tr bgcolor=\"lightgreen\">";
    message_text += "<th>Glider</th>";
    message_text += "<th>Date</th>";
    message_text += "<th>Day</th>";
    message_text += "<th>Pilot</th>";
    message_text += "<th>Speed</th>";
    message_text += "<th>Handicapped<br>speed</th>";
    message_text += "<th>Distance</th>";
    message_text += "<th>Handicapped<br>distance</th>";
    message_text += "</tr>";
    return message_text;	  
	}

function is_less(i,j) // used by sort_results()
  {
    if (r_glider[i]<r_glider[j]) return true
    else if (r_glider[i]==r_glider[j] && r_timestamp[i]<r_timestamp[j]) return true
    return false;
  }

function swap_results(i,j) // used by sort_results()
  {
    var s_timestamp = r_timestamp[i]; // timestamp of result entry
    var s_day = r_day[i];       // competition day of this result
    var s_glider = r_glider[i];    // type of glider flown (0=asw-28 etc)
    var s_pilot = r_pilot[i];     // id of pilot
    var s_speed = r_speed[i];     // speed achieved (km/h, 0 if landout)
    var s_hspeed = r_hspeed[i];    // handicapped speed achieved (km/h)
    var s_distance = r_distance[i];  // distance achieved (km)
    var s_hdistance = r_hdistance[i]; // handicapped distance achieved
    
    r_timestamp[i] = r_timestamp[j];
    r_day[i] = r_day[j];
    r_glider[i] = r_glider[j];
    r_pilot[i] = r_pilot[j];
    r_speed[i] = r_speed[j];
    r_hspeed[i] = r_hspeed[j];
    r_distance[i] = r_distance[j];
    r_hdistance[i] = r_hdistance[j];
    
    r_timestamp[j] = s_timestamp;
    r_day[j] = s_day;
    r_glider[j] = s_glider;
    r_pilot[j] = s_pilot;
    r_speed[j] = s_speed;
    r_hspeed[j] = s_hspeed;
    r_distance[j] = s_distance;
    r_hdistance[j] = s_hdistance;
  }
  
function sort_results() // bubble sort
  {
		for (var i = 0; i<num_results-1;i++)
		  {
		    for (var j = i+1; j<num_results;j++)
          {
            if (is_less(j,i)) swap_results(i,j);
          }
		 }  
  }
  
function show_result(i) // window, result_index
  {
    var message_text = '';
    var d = new Date(parseInt(r_timestamp[i]));
    var day = r_day[i];
    if (day==0) { day = "practice"; }
    var pilot = r_pilot[i];
    if (pilot=="") { pilot = "n/a"; }
    var row_color = "lightgreen";
    if (r_glider[i]==0) row_color = "#80ff00";
    else if (r_glider[i]==1) row_color = "#ffff00";
    else if (r_glider[i]==2) row_color = "#00ffff";
    message_text += "<tr bgcolor=" + row_color + ">";
    message_text += "<td>"+glider_desc[r_glider[i]]+"</td>";
    message_text += "<td>"+d.getYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+"</td>";
    message_text += "<td>"+day+"</td>";
    message_text += "<td>"+pilot+"</td>";
    if (r_speed[i]!=0)
      {
        message_text += "<td>"+r_speed[i]+" km/h</td>";
        message_text += "<td>"+r_hspeed[i]+" km/h</td>";
      }
    else
      {
        message_text += "<td>&nbsp;</td>";
        message_text += "<td>&nbsp;</td>";
      }
    if (r_distance[i]!=0)
      {
        message_text += "<td>"+r_distance[i]+" km</td>";
        message_text += "<td>"+r_hdistance[i]+" km</td>";
      }
    else
      {
        message_text += "<td>&nbsp;</td>";
        message_text += "<td>&nbsp;</td>";
      }
    message_text += "</tr>";	  
	}
	
function store_results()
  {
    // store results as XML string in cookie called 'cookie_name'
    // alert("Storing "+num_results+" results"); // debug
    var r_string = results_tag;
    var i = 0;
    while (i<num_results)
      {
        r_string = r_string + result_tag;
        r_string = r_string + timestamp_tag + r_timestamp[i] + timestamp_end_tag;
        r_string = r_string + day_tag + r_day[i] + day_end_tag;
        r_string = r_string + glider_tag + r_glider[i] + glider_end_tag;
        r_string = r_string + pilot_tag + r_pilot[i] + pilot_end_tag;
        r_string = r_string + speed_tag + r_speed[i] + speed_end_tag;
        r_string = r_string + hspeed_tag + r_hspeed[i] + hspeed_end_tag;
        r_string = r_string + distance_tag + r_distance[i] + distance_end_tag;
        r_string = r_string + hdistance_tag + r_hdistance[i] + hdistance_end_tag;
        r_string = r_string + result_end_tag;
				i++
      }
		r_string = r_string + results_end_tag; 
		// alert("results="+r_string); // debug
    setCookie(cookie_name, r_string);
  }

function set_result()
  {
	  var current_result = num_results;
	  if (num_results==max_results)
		  {
			  current_result = result_to_replace();
			}
	  else
		  num_results++;
    // alert("Setting  current result "+current_result); // debug
    var t = new Date();
    r_timestamp[current_result] = places(t.getTime(),0); // save all as string
    r_day[current_result] = places(current_day,0);
    r_glider[current_result] = places(current_glider,0);
    r_pilot[current_result] = current_pilot;
    r_speed[current_result] = places(current_speed,1); 
    r_hspeed[current_result] = places(current_hspeed,1);
    r_distance[current_result] = places(current_distance,1);
    r_hdistance[current_result] = places(current_hdistance,1);
    sort_results();
    store_results();
  }

function result_to_replace() // return index of oldest result in cookie
  {
	  if (num_results==0) return 0;
	  var replace_index = 0;
	  for (var i=1; i<num_results; i++)
		 {
		   if (r_timestamp[i]<r_timestamp[replace_index])
			   {
				   replace_index = i;
				 }
		 }
    // alert("result to replace is "+replace_index); // debug
	  return replace_index;
	}
	
// **********************************************************************************
// Formatting functions
// **********************************************************************************

function places(f, d) // return number f as a string, with d digits after decimal point
    {
       var q="";
       if (d == 0)
         return ""+( Math.round(f) );
       else if ( d == 1)
         p = (Math.round(f*10) / 10);
       else if ( d == 2)
         p = (Math.round(f*100) / 100);
       else if ( d == 3)
         p = (Math.round(f*1000) / 1000);
       if ((""+p).indexOf('.') == -1)
         q = p + ".0000";
       else
         q = p + "0000";
       return q.substring(0,q.indexOf('.')+d+1);
    }

function two_digits(i)
  {
    var cc = "00"+i;
    var r = cc.substring(cc.length-2);
    return r;
  }

function char_to_int(c)
  {
    if (c=='0') return 0;
    else if (c=='1') return 1;
    else if (c=='2') return 2;
    else if (c=='3') return 3;
    else if (c=='4') return 4;
    else if (c=='5') return 5;
    else if (c=='6') return 6;
    else if (c=='7') return 7;
    else if (c=='8') return 8;
    else if (c=='9') return 9;
    alert("Error: trying to convert <"+c+"> to a number - bad event in day file?");
    return -1;
  }

function str_to_int(s)
  {
    var i, num=0;
    for (i=0; i<s.length; i++)
      {
        num = (num*10)+char_to_int(s.charAt(i));
      }
    return num;
  }

function time_to_int(t)
  {
    var seconds=0, i;
    var hms = new Array;
    split(t,":");
    hms = splits; // hms[0..2] = hours, mins, secs
    for (i=0;i<hms.length; i++)
      {
        seconds = (seconds * 60) + str_to_int(hms[i]);
      }
    if (hms.length==1) seconds = seconds * 3600; // only hours given in t
    else if (hms.length==2) seconds = seconds * 60; // only hh:mm in t
    return seconds;
  }

function format_time(tt)
    {
      if (tt<0) t = tt+86400;
      else t = tt;
      h = Math.floor(t / 3600);
      m = Math.floor((t-(h*3600)) / 60);
      s = Math.floor(t - (h*3600) - (m*60));
      h = h % 24;
      hh = two_digits(h);
      mm = two_digits(m);
      ss = two_digits(s);
      return hh+":"+mm+":"+ss;
    }

var splits;

function split(s,c)  // divide string s by character c into array a
  {                  // replacement for JavaScript 1.1 s.split(",");
    var i=0, j, elem=0;
    splits = new Array;
    while (i<s.length)
      {
        j = s.indexOf(c,i);
        if (j<0) j = s.length;
        splits[elem] = s.substring(i,j);
        elem = elem + 1;
        i = j+1;
      }
  }

// **********************************************************************************
// Screen handling functions
// **********************************************************************************

function update_form1()
  {
    var i;
    calcAltReq();
    document.task_form.glider[0].checked = (current_glider == 0);
    document.task_form.glider[1].checked = (current_glider == 1);
    document.task_form.glider[2].checked = (current_glider == 2);
    document.form1.ballast[0].checked = (current_ballast == 0);
    document.form1.ballast[1].checked = (current_ballast == 1);
    document.form1.ballast[2].checked = (current_ballast == 2);
    document.form1.pilot.value = current_pilot;
    document.form1.time.value = format_time(current_time);
    document.form1.altitude.value = places(current_altitude,0) + " ft Alt";
    document.form1.distance.value = places(current_distance,1) + " km tot";
    if (task_started) 
      document.form1.task_time.value = format_time(current_time-start_time);
    else
      document.form1.task_time.value = format_time(0);
    if (current_time > start_time)
      document.form1.speed.value = places(current_distance * 3600 / (current_time - start_time), 1) + " km/h tot";
    else
      document.form1.speed.value = "0.0 km/h tot";

    document.form1.distance_to_next_tp.value = 
              places(leg_distance[current_leg]-current_distance,1) +" km to "+tp[current_leg+1];
    if (leg_wind[current_leg]<0)
      document.form1.headwind.value = "tailwind " + (0-leg_wind[current_leg])+" kt";
    else if (leg_wind[current_leg]>0)
      document.form1.headwind.value = "headwind " + leg_wind[current_leg]+" kt";
    else
      document.form1.headwind.value = "nil wind";

		// update john_w flight computer
		
    document.form1.mc.value = "Mc: "+places(current_mc, 1)+" kts";
    document.form1.stf.value = "StF: "+places(current_stf, 0)+" kts";
    document.form1.altReq.value = "Arr: "+places(current_altitude-current_altReq, 0)+" ft";

    if (climbing)
      panel_set_speed(48);
    else
      {
        if (cruise_rate==1) // hunting
          panel_set_speed(53);
        else
          panel_set_speed(speed[cruise_rate]);
      }
    if (cruising)
      panel_set_climb(-glider_sink[current_glider][current_ballast][cruise_rate]);
    else
      panel_set_climb(current_netto_climb-glider_sink[current_glider][current_ballast][0]);
    panel_set_altitude(current_altitude);
    //document.panel.update();
  }

function panel_set_speed(s)
  {
    var random_offset = (Math.random() - 0.5) * 0.05 * s;
    //document.panel.set_speed(s + random_offset);
  }

function panel_set_climb(c)
  {
    var random_offset = (Math.random() - 0.5) * 0.15 * c;
    //document.panel.set_climb(c + random_offset);
  }

function panel_set_altitude(a)
  {
    //document.panel.set_altitude(a);
  }
  
function load_description(s)
  {
    day_frame = document.getElementById("day_frame");
    current_description = "";
    day_frame.src = s;
  }

function set_description(s)
  {
    // console.log('set_description',s); //debug need to write to page
    // return;
    current_description = s;
    // top.description.document.open();

    var message_html = '';

    if (!task_started)
		  {
			  message_html += not_started_msg1;
			  message_html += start_height_max + " feet.";
			  message_html += not_started_msg2;
		  }
    message_html += desc[current_conditions];
    message_html += current_description;
    messages_div.innerHTML = message_html;
  }

function add_description(s)
  {
    set_description(current_description + s);
  }

// **********************************************************************************
// Soaring constants
// **********************************************************************************

var nmkm = 0.54;  // nautical miles per kilometer
var mikm = 0.6;  // miles per kilometer
var ftm = 3.28;   // feet per meter
var ftkm = 3280.84; // feet per kilometer

var time_step = 5;                // number of seconds of real time per simulator step
var simulator_rate = 250;         // number of milliseconds to simulate above 'time_step'
var dolphin_time = 10;            // number of seconds lift you get dolphining through a thermal at 60 knots
var climbing_penalty = 30;        // number of seconds penalty on entering a thermal

var speed = new Array;
    speed[0] = 0;   // thermalling
    speed[1] = 20;  // hunt cross-country speed = 20 knots i.e. you are wandering looking for lift
    speed[2] = 60;  // cruising speed rate 1 = 60 knots etc.
    speed[3] = 70;
    speed[4] = 80;
    speed[5] = 90;
    speed[6] = 100;
    speed[7] = 110;
    speed[8] = 120;

var not_started_msg1 = "<p align='center'><strong><font color='red'>Flying around pre-start! Max start height is ";
var not_started_msg2 = "</font></strong></p>";

// **********************************************************************************
// Glider definitions
// **********************************************************************************

var glider_desc = new Array;    // description of glider
var glider_handicap = new Array; // BGA glider handicap
var glider_sink = new Array;    // no ballast sink rates at speed[0](thermal), speed[1](hunt), speed[2] ... speed[7]

// Block describing glider type-0 (ASW-28 std 44:1) 

    glider_desc[0] = "ASW-28";
    glider_handicap[0] = 100;
    glider_sink[0] = new Array;
//      Sink rates for:     Thermal:
//                                  Hunt:
//                                    Cruise: 60   70   80   90  100  110 120
    glider_sink[0][0] = new Array(1.13,1.52,1.52,2.01,2.63,3.86,5.68,7.58,9.7); // sink rates no ballast
    glider_sink[0][1] = new Array(1.37,1.45,1.45,1.78,2.30,3.16,4.40,5.81,7.6); // sink rates half ballast
    glider_sink[0][2] = new Array(1.61,1.38,1.38,1.55,1.98,2.46,3.12,4.05,5.3); // sink rates full ballast

// Block describing glider type-1 (ASW-27) 

    glider_desc[1] = "ASW-27";
    glider_handicap[1] = 104;
    glider_sink[1] = new Array;
    glider_sink[1][0] = new Array(0.99,1.24,1.24,1.6,2.09,2.81,3.74,4.92,6.4); // sink rates no ballast
    glider_sink[1][1] = new Array(1.11,1.25,1.25,1.52,1.91,2.49,3.22,4.09,5.2); // sink rates half ballast
    glider_sink[1][2] = new Array(1.22,1.27,1.27,1.43,1.72,2.16,2.69,3.26,3.9); // sink rates full ballast

// Block describing glider type-2 (ASW-22) 

    glider_desc[2] = "ASW-22";
    glider_handicap[2] = 118;
    glider_sink[2] = new Array;
    glider_sink[2][0] = new Array(0.82,1.11,1.11,1.60,2.30,3.08,4.09,5.16,6.3); // sink rates no ballast
    glider_sink[2][1] = new Array(0.86,1.05,1.05,1.43,2.01,2.83,3.61,4.58,5.7); // sink rates half ballast
    glider_sink[2][2] = new Array(0.89,1.00,1.00,1.26,1.72,2.59,3.12,4.00,5.1); // sink rates full ballast

// **********************************************************************************
// Conditions definitions
// **********************************************************************************

var pre_desc = new Array;  // pre_desc[current_conditions] gives description of sky in distance
var desc = new Array;      // desc[current_conditions] gives text description of sky
var thermal = new Array;   // thermal[current_conditions][0..19] picks the next thermal strength
var thermal_width = new Array;   // thermal_width[current_conditions] is the fixed thermal width in feet
var distance = new Array;  // distance[current_conditions][0..19] pick the next run distance
var cloudbase = new Array; // cloudbase[current_conditions] give current cloudbase

// Block describing conditions type-0 (normal) Median 3.6 knots to 4000 ft, 9km 

    pre_desc[0] = "<p>Cumulus clouds can be seen in the distance.</p>";
    desc[0] = "<p>The sky is full of good-looking cumulus clouds. "+
              "Cloudbase is about 4000 feet</p>";

    cloudbase[0] = 3900; // 4000 foot cloudbase (allow 100 feet for overrun)
             // strength of next thermal in knots:
    thermal[0] = new Array(1.5,2.1,2.5,3.1,3.5,3.7,4.2,4.5,4.6,4.6,4.7,4.7,4.7,4.8,
                           4.8,4.9,5.4,5.5,5.8,6.2);
    thermal_width[0] = 1000; // width of thermal in feet for pullup calculation
             // distance to next thermal in kilometers:
    distance[0] = new Array(0.5,1.0,1.1,2.0,3,5,6,6,7,8,10,11,11,12,12,12,14,16,18,20);

// Block describing conditions type-1 (stronger) Median 4.6knots to 5000 ft, 6.3km

    pre_desc[1] = "<p>Cumulus clouds can be seen in the distance.</p>";
    desc[1] = "<p>The sky is full of good-looking closely spaced cumulus clouds. "+
              "Cloudbase is approximately 5000 feet</p>";

    cloudbase[1] = 4880; // 5000 foot cloudbase (allow 120 feet for overrun)
               // strength of next thermal in knots:
    thermal[1] = new Array(1.5,2.1,2.5,3.1,4.0,4.2,4.7,5.0,5.1,5.6,5.7,5.7,5.7,5.8,
                           5.8,5.9,6.4,6.5,6.8,7.2);
    thermal_width[1] = 1000; // width of thermal in feet for pullup calculation
               // distance to next thermal in kilometers
    distance[1] = new Array(0.5,1.0,1.1,1.4,2,3,4,4,4.5,6,6.6,7,7,8,8,8,9,10,12,14);

// Block describing conditions type-2 (over-convected)  Median 2.4knots to 4000ft, 13km

    pre_desc[2] = "<p>The sky in the distance looks over-convected.</p>";
    desc[2] = "<p>The sky has over-convected, with 6/8ths Cu and rapid cycling. "+
              "Cloudbase is around 4000 feet, and the climbs are harder to find.</p>";

    cloudbase[2] = 3700; // 3700 foot cloudbase
    thermal[2] = new Array(1.5,2.1,2.5,2.6,3.2,3.2,3.3,3.3,3.4,3.4,3.5,3.6,3.6,3.7,
                           3.8,3.8,3.9,4.0,5.0,5.5);
    thermal_width[2] = 1000; // width of thermal in feet for pullup calculation
    distance[2] = new Array(0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,18,18,18,20,22,27,30);

// Block describing conditions type-3 (blue) Median 3.6knots to 4500ft, 13km

    pre_desc[3] = "<p>The sky in the distance looks blue.</p>";
    desc[3] = "<p>The sky has gone completely blue."+
              "Cloudbase is around 4500 feet, and the climbs seem further apart.</p>";

    cloudbase[3] = 4500; // 4500 foot cloudbase
    thermal[3] = new Array(1.5,2.1,2.5,3.1,3.5,3.7,4.2,4.5,4.6,4.6,4.7,4.7,4.7,4.8,
                           4.8,4.9,5.4,5.5,5.8,6.2);
    thermal_width[3] = 1000; // width of thermal in feet for pullup calculation
    distance[3] = new Array(0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,18,18,18,20,22,27,30);

// Block describing conditions type-4 (weak) Median 1.8knots to 3500ft, 13km

    pre_desc[4] = "<p>The sky in the distance has weakening Cu's.</p>";
    desc[4] = "<p>The Cu's look scattered and weak."+
              "Cloudbase is around 3500 feet, and the climbs seem further apart.</p>";

    cloudbase[4] = 3500;
    thermal[4] = new Array(1.3,1.6,1.8,2.1,2.3,2.4,2.6,2.8,2.8,2.8,2.9,2.9,2.9,2.9,
                           2.9,3.0,3.2,3.3,3.4,3.6);
    thermal_width[4] = 1000; // width of thermal in feet for pullup calculation
    distance[4] = new Array(0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,17,17,17,18,18,20,21);

// Block describing conditions type-5 (weak-blue)  Median 1.8knots to 3500ft, 13km

    pre_desc[5] = "<p>The sky in the distance is blue.</p>";
    desc[5] = "<p>The sky has gone completely blue."+
              "Cloudbase is around 3500 feet, and the climbs seem further apart.</p>";

    cloudbase[5] = 3500;
    thermal[5] = new Array(1.3,1.6,1.8,2.1,2.3,2.4,2.6,2.8,2.8,2.8,2.9,2.9,2.9,2.9,
                           2.9,3.0,3.2,3.3,3.4,3.6);
    thermal_width[5] = 1000; // width of thermal in feet for pullup calculation
    distance[5] = new Array(0.7,1.5,1.8,3,6,9,9,12,12,12,15,16,16,18,18,18,20,22,27,30);

// Block describing conditions type-6 (streeting)  4500ft, some @4.6kt, others less @ 1km

    pre_desc[6] = "<p>There are clearly defined cloudstreets on track ahead.</p>";
    desc[6] = "<p>There are clearly defined cloudstreets on track at 4500 feet.</p>";

    cloudbase[6] = 4500;
    thermal[6] = new Array(1.7,2.1,2.5,2.8,3.2,3.4,3.6,3.7,3.8,3.9,4.0,4.1,4.2,5.8,
                           5.8,5.9,6.4,6.5,6.8,7.2);
    thermal_width[6] = 2000; // width of thermal in feet for pullup calculation
    distance[6] = new Array(0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2,2,2,2,3,3,4,5);

// **********************************************************************************
// Soaring global variables
// **********************************************************************************

var current_altitude = 2000;      // start off tow at 2000 feet
var current_time = 43200;         // 12:00:00
var current_distance = 0;         // distance around the task
var current_hdistance = 0;        // handicapped distance around the task
var current_ballast = 2;          // 0 = dry, 1 = half, 2 = full
var current_glider = 0;           // 0 = ASW-28 etc.
var current_day = 0;              // day number, events loaded from k_day<n>.html
var current_pilot = "";           // pilot name or code used to distinguish stored results
var current_speed = 0;            // cross-country speed
var current_hspeed = 0;           // handicapped cross-country speed

var current_mc = 0;               // macready
var current_stf = 0;              // speed to fly
var current_altReq = 0;           // altitude required to reach a goal
var quadA = 0.085;                // polar quadratic factor A
var quadC = 372;                  // polar quadratic factor C

var start_height_max = 4000;      // height limit for start
var start_time = 43200;           // 12:00:00 time in seconds since midnight
var prestart_distance = 0;        // distance variable for pre-start flying
var current_altitude_max = 4000;  // current cloudbase (max climb) in feet
var current_netto_climb = 0.2;          // current climb rate in knots
var next_thermal_distance;        // distance to next thermal in kilometers
var start_cruise_distance = 0;    // distance so far from last cruise button selected
var start_cruise_altitude = 0;    // altitude so far from last cruise button selected
var start_dolphin_distance = 0;   // distance so far at start of cruise (first cruise button)
var start_dolphin_altitude = 0;   // altitude so far at start of cruise (first cruise button)
var cruise_rate = 0;
var climbing = false;             // flag set to show current mode is 'climbing'
var cruising = false;             // flag to show current mode is 'cruising'
var start_climb_time;             // time thermal was entered
var start_climb_altitude;         // altitude at which thermal was entered
var pull_up_height = 0;           // altitude gain achieved in pull-up on entering thermal
var current_description="";       // current value of description field;

var current_conditions = 0;       // defines block of thermal strengths and inter-thermal
                                  // distances to be used.
var pending_conditions;           // conditions pending during special event
var in_special = 0;               // number of nested special events currently running

var task_length = 300;            // task length in kilometers
var num_legs = 3;
var tp = new Array;
    tp[0] = "Gransden";  // name of each TP
    tp[1] = "Didcot";
    tp[2] = "Leicester North";
    tp[3] = "Gransden";
var leg_distance = new Array;
    leg_distance[0] = 85;  // length of each leg in km
    leg_distance[1] = 120;
    leg_distance[2] = 95;
var leg_wind = new Array;
    leg_wind[0] = 10;     // head (pos) / tail (neg) wind on each leg in knots
    leg_wind[1] = 0;
    leg_wind[2] = -8;     // e.g. 8 knot tailwind for final glide
var current_leg = 0;
var task_started = false;   // boolean set by start_task();

// event arrays

var event_type = new Array; // "general" or "special"
    event_fn = new Array;   // "time" or "distance"
    event_arg = new Array;
    event_action = new Array;     // action: "conditions"
    event_action_arg = new Array; // argument for action
    event_completed = new Array;  // boolean true if event already triggered
    num_events = 0;

// **********************************************************************************
// Setup/configuration functions
// **********************************************************************************

function show_task()
  {
     var task_window = window.open("k_day"+current_day+".html","task","resizable=yes,scrollbars=yes,WIDTH=800,HEIGHT=600");
  }

	
function set_glider(n)
  {
    if (task_started)
      { alert("You can't change your glider after a start!"); }
    else
      { current_glider = n; }
    setPolarQuad();
    update_form1();
  }

function set_pilot()
  {
    current_pilot = document.form1.pilot.value;
  }

function set_day(d)
  {
    current_day = d;
    setPolarQuad();
    // var last_performance = getCookie("krasnoff"+current_day); // debug - still to do - find last performance
    // if (last_performance != null)
    //   {
    //     var d1 = last_performance.indexOf("-");
    //     var d2 = last_performance.indexOf("-", d1+1);

    //     var s1 = last_performance.lastIndexOf("-");

    //     var last_date = last_performance.substring(d1+1, d2);
    //     var last_speed = last_performance.substr(s1+1);
    //     alert("Your last performance on " + last_date + " was " + last_speed);
    //   }
    document.form1.start.value = "Start Task"
    load_description("days/k_day"+d+".html");
    day_loaded(day0); //debug
  }

function day_loaded(day) // called by onLoad method of loaded day page
  {
    load_task(day);
    load_events(day);
    task_started = false;
    current_time = 43200;
    current_distance = 0;
    current_altitude = 2000;
    current_altitude_max = cloudbase[0];
    current_ballast = 2;
    climbing = false;
    cruising = false;
    current_conditions = 0;
    current_leg = 0;
    prestart_distance = 0;
    in_special = 0;
    load_results();
    update_form1();
  }

function load_task(day)  // load task from day page
  {
    var i;
		start_height_max = day.start_height_max;
    task_length = day.task_length;
    num_legs = day.leg_length.length;  // number of legs in task
    for (i=0; i<num_legs; i++)
      {
        if (i==0) leg_distance[0] = day.leg_length[0];
        else leg_distance[i] = leg_distance[i-1]+day.leg_length[i];
        leg_wind[i] = day.leg_wind[i];
        tp[i] = day.tp[i];
      }
		tp[i]=tp[0];
  }

function load_events(day)  // load events from day page
  {
    var i; // loop counter
    var events = new Array;
    num_events = 0;
    for (i=0; i<day.events.length; i++)
      {
        split(day.events[i],",");
        events = splits;
        if (events[0]=="general")
          {
            load_general(events);
          }
        else if (events[0]=="special")
          {
            load_special(events);
          }
        else { alert("Unrecognised event type <"+events[0]+"> in day file."); }
      }
  }

function load_general(e)
  {
    event_type[num_events] = "general";
    event_fn[num_events] = e[1];
    if (e[1]=="time")
      {
        event_arg[num_events] = time_to_int(e[2]);
      }
    else if (e[1]=="distance")
      {
        event_arg[num_events] = str_to_int(e[2]);
      }
    else { alert("Unrecognised general event type in day file <"+e[1]+">"); return; }
    event_action[num_events] = e[3];
    event_action_arg[num_events] = e[4];
    event_completed[num_events] = false;
    num_events++;
  }

function load_special(e)
  {
    event_type[num_events] = "special_on"; // convert day file event into two events on/off
    event_type[num_events+1] = "special_off";
    event_fn[num_events] = e[1];
    event_fn[num_events+1] = e[1];
    if (e[1]=="time")
      {
        event_arg[num_events] = time_to_int(e[2]);
        event_arg[num_events+1] = time_to_int(e[3]);
      }
    else if (e[1]=="distance")
      {
        event_arg[num_events] = str_to_int(e[2]);
        event_arg[num_events+1] = str_to_int(e[3]);
      }
    else { alert("Unrecognised special event type in day file <"+e[1]+">"); return; }
    event_action[num_events] = e[4];
    event_action[num_events+1] = e[4];
    event_action_arg[num_events] = e[5];
    event_action_arg[num_events+1] = e[5];
    event_completed[num_events] = false;
    event_completed[num_events+1] = false;
    num_events = num_events+2;
  }

// **********************************************************************************
// Flight functions
// **********************************************************************************

function set_ballast(n)
  {
    if (current_ballast<n)
      { alert("You can't increase ballast in-flight."); }
    else
      { current_ballast = n; }
    setPolarQuad();
    update_form1();
  }

function setPolarQuad()
{
//  alert("current_glider:"+current_glider+" current_ballast:"+current_ballast);
  var v1 = speed[3];
  var v2 = speed[5];
  var v3 = speed[7];
//  alert("v1:"+v1+" v2:"+v2+" v3:"+v3);
  var w1 = glider_sink[current_glider][current_ballast][3]*100;
  var w2 = glider_sink[current_glider][current_ballast][5]*100;
  var w3 = glider_sink[current_glider][current_ballast][7]*100;
//  alert("w1:"+w1+" w2:"+w2+" w3:"+w3);
  quadA = ((v2-v3)*(w1-w3)+(v3-v1)*(w2-w3)) /
         ((v1*v1)*(v2-v3)+(v2*v2)*(v3-v1)+(v3*v3)*(v1-v2));
  var quadB = (w2-w3-quadA*(v2*v2-v3*v3))/(v2-v3);
  quadC = w3 - quadA*v3*v3 - quadB * v3;
//  alert("quadA:"+quadA+" quadB:"+quadB+" quadC:"+quadC);
}


function interp(x1, x2, y1, y2, x)
{
  var slope = (y2-y1)/(x2-x1);
//  alert("slope:"+slope);
  return y2-slope*(x2-x);
}

function lookupPolarSink(stf)
{
  var iii;
  for (iii = 0; iii < speed.length && stf > speed[iii]; iii++)
    ;
//  alert("iii:"+iii);  // debug
  if (iii == speed.length)
    iii--;
  var sinkRate;
  var sink1 = glider_sink[current_glider][current_ballast][iii-1];
  var sink2 = glider_sink[current_glider][current_ballast][iii];
//  alert("sink1:"+sink1+" sink2:"+sink2);
//  alert("speed1:"+speed[iii-1]+" speed2:"+speed[iii]+" stf:"+stf);
  sinkRate = interp(speed[iii-1], speed[iii], sink1, sink2, stf);
//  alert("sinkRate:"+sinkRate);  // debug
  return sinkRate;
}


function calcAltReq()
{
  calcStf();
  var sinkRate = lookupPolarSink(current_stf);
  var ld = (current_stf-leg_wind[current_leg]) / sinkRate;
  var distGoal = leg_distance[current_leg] - current_distance;
//  alert("ld:"+ld+" current_distance:"+current_distance+" distGoal:"+distGoal);
  current_altReq = distGoal * ftkm / ld;
//  alert("altReq:"+current_altReq);
}

function calcStf()
{
//  alert("quadA:"+quadA+" quadC:"+quadC);
  if ((quadC+current_mc*100)/quadA < 0)
    current_stf = speed[2]; // bugfix: current_stf calculation bad if on backslope of polar
  else
    current_stf = Math.sqrt((quadC+current_mc*100)/quadA);
  if (current_stf < speed[2])
    current_stf = speed[2];
}


function set_mc(mc)
{
  current_mc = current_mc + mc;
  if (current_mc < 0)
     current_mc = 0;
//  calcAltReq();
  update_form1();
}

function set_conditions(i)
  {
    if (in_special>0) // if currently in a special event then stack new general conditions
      {
        pending_conditions = i;
      }
    else
      {     
        current_conditions = i;
        current_altitude_max = cloudbase[current_conditions];
      }
  }

function get_next_thermal()
  {
    return thermal[current_conditions][Math.floor(Math.random()*20)];
  }

function get_next_distance()
  {
    return distance[current_conditions][Math.floor(Math.random()*20)];
  }

function set_climb_description()
  {
    set_description("<p><strong><font color='green'>"+
                    "Climbing at "+places(current_netto_climb-glider_sink[current_glider][current_ballast][0],1)+" knots ...</font></strong>."+
                    " (Netto: "+ places(current_netto_climb,1) +")</p>" +
                    "<p>Hit a 'Cruise' key to continue.</p>");
  }
  
function start_climb()
  {
    if (climbing)
      {
        alert("Already climbing! Stay in climb to cloudbase or click a cruise button to continue.");
        return;
      }
	  if ((current_altitude>cloudbase[current_conditions]) && (Math.floor(Math.random()*4)==1))
		  {
			  alert("Mayday! Mayday! Mid-air collision in cloud with unidentified aircraft!");
				land_out();
			  return;
			}
    if (cruising) return; 
    start_climb_time = current_time;
    start_climb_altitude = current_altitude;
    set_climb_description()
    current_time = current_time + climbing_penalty; // immediately add penalty time for centering
    climbing = true;
    continue_climb();
  }

function continue_climb()
  {
    if (!climbing) return;                   // if 'climbing' flag has been reset then do nothing

    current_time = current_time + time_step;

    current_altitude = current_altitude + ((current_netto_climb-glider_sink[current_glider][current_ballast][0]) * 100 * time_step / 60);

    if (task_started) current_distance = current_distance -
                         (leg_wind[current_leg]/ nmkm) * time_step / 3600;

    update_form1();
    if (current_altitude < current_altitude_max)
      {
        set_climb_description();
        setTimeout("continue_climb()", simulator_rate);
      }
    else
      {
        test_events();
        set_description("<p><strong><font color=\"green\">Reached cloudbase!</font></strong><\p>");
        show_climb_summary();
        add_description("<p>Hit a 'Cruise' button to continue...</p>");
      }
  }

function show_climb_summary()
  {
    add_description("<p>You climbed to "+ places(current_altitude,0) + " feet.</p>"+
                    "<p>You thermalled for "+format_time(current_time-start_climb_time)+
                    ", climbing "+places(current_altitude-start_climb_altitude+pull_up_height,0)+" feet, "+
                    "at a true average climb rate of "+
                    "<strong><font color=\"green\">"+
                    places((current_altitude-start_climb_altitude+pull_up_height)/(current_time-start_climb_time+dolphin_time)*60/100,1)+
                    " knots.</font></strong></p>");
  }

function start_cruise(rate)
  {
    cruise_rate = rate;
    if (cruising)
      {
        if (rate==1) // if hunting
          {
            next_thermal_distance = get_next_distance();
            start_cruise_distance = current_distance;
            start_cruise_altitude = current_distance;
       		  // alert("hunting start cruise: "+start_cruise_distance+" km,"+start_cruise_altitude+" feet."); // debug
            next_thermal_distance = next_thermal_distance / 6;
            add_description("<p><strong><font color=\"green\">"+
                            "Changed direction off-track... hunting desperately for a thermal... "+
                            "</font></strong>"+
                            "(in maybe "+Math.round(next_thermal_distance)+" km)</p>");
          }
        else
          add_description("<p>Changed cruise to "+speed[rate]+" knots...</p>");
        return;
      }
    if (cruising==false || rate==1) // if not currently cruising, then get new random distance to next thermal
      {
        cruising = true;
        next_thermal_distance = get_next_distance();
        if (rate==1) next_thermal_distance = next_thermal_distance / 6; // Hunting means finding thermals much closer
      }
    start_cruise_distance = current_distance;
    start_cruise_altitude = current_altitude;
		// alert("start cruise: "+start_cruise_distance+" km,"+start_cruise_altitude+" feet."); // debug
    prestart_distance = 0; // distance variable for before a start called
    if (climbing)
      {
        climbing = false;                       // stop any climb in process
        start_dolphin_distance = current_distance;
        start_dolphin_altitude = current_altitude;
  	  	// alert("start dolphin: "+start_dolphin_distance+" km,"+start_dolphin_altitude+" feet."); // debug
        set_description("<p><strong><font color=\"green\">Leaving the climb!</font></strong><\p>");
        show_climb_summary();
      }
    else
       {
         set_description("<p>Continuing cruise...</p>");
       }
    if (rate==1) // if hunting
      {
        add_description("<p><strong><font color=\"green\">"+
                        "Hunting around for a thermal..."+
                        "</font></strong>"+
                        // "(debug: for "+Math.round(next_thermal_distance)+" km)"+
                        "</p>");
      }
    else
      add_description("<p><strong><font color=\"green\">Cruising at "+speed[rate]+" knots");
                      // "</font></strong> for (debug)"+ Math.round(next_thermal_distance)+" km ...</p>");
    continue_cruise();
  }

function continue_cruise()
  {
    current_time = current_time + time_step;

    if (task_started) current_distance = current_distance + 
                 ((speed[cruise_rate]-leg_wind[current_leg])/ nmkm) * time_step / 3600;
    else prestart_distance = prestart_distance +  (speed[cruise_rate] / nmkm) * time_step / 3600;

    current_altitude = current_altitude - glider_sink[current_glider][current_ballast][cruise_rate] * 100 * time_step / 60;

    if ((current_leg<num_legs-1) && (current_distance>leg_distance[current_leg])) current_leg++;

    if (current_altitude<0 && current_distance<task_length)
      {
        land_out();
        return;
      }
    if (current_distance>=task_length)
      {
        good_finish();
        return;
      }
    update_form1();    
    if (task_started && current_distance < start_cruise_distance + next_thermal_distance)
      setTimeout("continue_cruise()", simulator_rate);
    else if (!task_started && prestart_distance < next_thermal_distance)
      setTimeout("continue_cruise()", simulator_rate);
    else
      {
        cruising = false;
        hunting = false;
        entering_thermal();
      }
  }

function pull_up()
  {
    // set pull_up_height and return the amount of height gained on entering the thermal
    //  -- this is not the gain from trading speed for height, as that nets out on exit
    //     it is only the straight-line lift prior to steady circling.
	
    var pull_up_speed;
    if (speed[cruise_rate]<60)
      {
        pull_up_speed = 60;
      }
    else
      {
        pull_up_speed = (speed[cruise_rate]+60)/2;
      }
    dolphin_time = thermal_width[current_conditions]/(pull_up_speed*100/60);
    pull_up_height = dolphin_time / 60 * (current_netto_climb-glider_sink[current_glider][current_ballast][0]) * 100;
    current_altitude = current_altitude + pull_up_height;
    current_time = current_time + dolphin_time;
    if (task_started) current_distance = current_distance + thermal_width[current_conditions]/ftkm;
  }
	
function entering_thermal()
  {
    test_events();
    current_netto_climb = get_next_thermal();
    pull_up();
    update_form1();
		var dolphin_distance = current_distance - start_dolphin_distance;
		var dolphin_altitude = current_altitude - start_dolphin_altitude;
		var cruise_distance = current_distance - start_cruise_distance;
		var cruise_altitude = current_altitude - start_cruise_altitude;
    set_description("<p><strong><font color=\"green\">Entering a thermal with TE lift of "+
                    places(current_netto_climb-glider_sink[current_glider][current_ballast][0],1)+" knots ...</font></strong>."+
                    " (Netto: "+
                    places(current_netto_climb,1)+")</p>"+
                    "<p>You cruised for a total of "+places(dolphin_distance,1)+" km "+
										"at "+ places(0-dolphin_distance * ftkm / dolphin_altitude,0)+":1 "+
                    "(the last cruise was "+places(cruise_distance,1)+" km "+
										"at "+ places(0-cruise_distance * ftkm / cruise_altitude,0)+":1).</p>"+
                    "<p>You have pulled-up "+places(pull_up_height,0)+" feet.</p>"+
                    "<p>Select 'Climb' or a 'Cruise' button to continue.</p>");
  }

function test_events()
  {
    var i;
    for (i=0; i<num_events; i++)
      {
        if (!event_completed[i])
          if (event_type[i]=="general") test_general_event(i);
          else if (event_type[i]=="special_on") test_special_on_event(i);
          else if (event_type[i]=="special_off") test_special_off_event(i);
      }
  }

function test_general_event(i)
  {
    if (event_fn[i]=="time")
      {
        if (current_time<event_arg[i]) return;
        action_event(i);
      }
    else if (event_fn[i]=="distance")
      {
        if (current_distance<event_arg[i]) return;
        action_event(i);
      }
  }

function test_special_on_event(i)
  {
    if (event_fn[i]=="time")
      {
        if (current_time<event_arg[i]) return;
        action_special_on_event(i);
      }
    else if (event_fn[i]=="distance")
      {
        if (current_distance<event_arg[i]) return;
        action_special_on_event(i);
      }
  }

function test_special_off_event(i)
  {
    if (event_fn[i]=="time")
      {
        if (current_time<event_arg[i]) return;
        action_special_off_event(i);
      }
    else if (event_fn[i]=="distance")
      {
        if (current_distance<event_arg[i]) return;
        action_special_off_event(i);
      }
  }

function action_event(i)
  {
    event_completed[i] = true;
    if (event_action[i]=="conditions")
      set_conditions(str_to_int(event_action_arg[i]));
    else if (event_action[i]=="message")
      { alert(event_action_arg[i]);}
  }

function action_special_on_event(i)
  {
    event_completed[i] = true;
    in_special++;
    if (event_action[i]=="conditions")
      {
        if (in_special==1)          // entering first special conditions
          {
            // alert("debug: in_special=1, setting pending conditions to "+current_conditions);
            pending_conditions = current_conditions;
          }
        current_conditions = str_to_int(event_action_arg[i]);
        // alert("debug: on: setting current_conditions to "+current_conditions);
        current_altitude_max = cloudbase[current_conditions];
      }
  }

function action_special_off_event(i)
  {
    event_completed[i] = true;
    in_special--;
    if (event_action[i]=="conditions")
      {
        if (in_special==0)          // leaving last special conditions so restore general
          {
            // alert("debug: in_special=0, resetting  current_conditions to "+pending_conditions);
            current_conditions = pending_conditions;
            current_altitude_max = cloudbase[current_conditions];
          }
      }
  }

function start_task()
  {
    if (task_started)
      { 
        alert("Already on task! To restart a day click the Day: button at top");
        return;
      }
	  if (current_altitude>start_height_max)
		  {
			  alert("Bad Start! Above today's start height limit of "+start_height_max+" feet.");
				return;
			}
    task_started = true;
    document.form1.start.value = "<on task>"
    start_time = current_time;
    set_description("<p><strong><font color=\"green\">"+
                    "Called a START at "+format_time(current_time)+
										" at "+places(current_altitude,0)+" feet"+
                    "!  Good luck...</font></strong></p>"+
                    "<p>Select a 'cruise' speed to continue.</p>");
  }

function land_out()
  {
    current_speed = 0;
    current_hspeed = 0;
    set_description("<p><strong><font color=\"green\">You have LANDED OUT!</font></strong><\p>"+
                    "<p>You achieved a distance of <strong><font color=\"green\">"+
                    places(current_distance,1)+"km</font></strong></p>");
    current_hdistance = current_distance * 100 / glider_handicap[current_glider];
    set_result();
		show_results();
  }

function good_finish()
  {
    current_speed = current_distance * 3600 / (current_time - start_time);
    current_hspeed = current_speed * 100 / glider_handicap[current_glider];
    current_distance = 0;
    current_hdistance = 0;
    set_description("<p><strong><font color=\"green\">GOOD FINISH!</font></strong><\p>"+
                    "<p>You achieved a speed of <strong><font color=\"green\">"+
                    places(current_speed,1) +
                    " (handicapped " + places(current_hspeed,1) + ") " +
                    "km/h</font></strong></p>");
    set_result(); // store result in cookie
		show_results();
  }

