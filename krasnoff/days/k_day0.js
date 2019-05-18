
var day0 = {
  task_length:      302,                               // DEFINE YOUR TASK LENGTH (in km) HERE
  tp:               new Array("Gransden","Didcot","Leicester"), // TURNPOINTS
  leg_length:       new Array(90,130,82),               // LEG LENGTHS IN KILOMETERS
  leg_wind:         new Array(0,5,-8),                    // LEG WINDS headwind (pos) / tailwind (neg)
  start_height_max: 4000,                         // maximum permitted start height in feet

 // THIS IS THE 'CONDITIONS' ARRAY. DON'T CHANGE IT UNLESS YOU'VE READ k_help.html

  events: new Array("general,time,12:50,message,Conditions look likely to improve",
                       "general,time,13:00,conditions,1", // stronger
                       "general,time,14:10,message,Oh oh! Looks like it's going blue",
                       "general,time,14:20,conditions,3", // blue
                       "general,time,14:50,conditions,5", // weak-blue
                       "general,distance,70,message,It looks over-convected around the TP",
                       "special,distance,80,100,conditions,2", // over-convected
                       "special,distance,130,190,conditions,6") // streeting


// conditions 0 = 'normal' Cu 4000 feet, (Median 3.6 knots at 9km)
//            1 = 'stronger' Cu 5000 feet (4.6knots at 6km)
//            2 = 'over-convected' 4000ft weaker more-spaced thermals
//            3 = 'blue' 4500ft more-spaced thermals
//            4 = 'weak' 3500ft weaker, more-spaced thermals
//            5 = 'weak-blue' 3500ft more-spaced thermals
//            6 = 'streeting' (4500 ft, a few thermals around 4.6 knots, many 1-3 knots, 1 km spacing)
}; // end day0
