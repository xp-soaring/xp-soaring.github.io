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

var not_started_msg1 = "<p align='center'><strong><font color='red'>Flying around pre-start! Max start height is ";
var not_started_msg2 = "</font></strong></p>";

// **********************************************************************************
// Glider definitions
// **********************************************************************************


// **********************************************************************************
// Soaring global variables
// **********************************************************************************

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

