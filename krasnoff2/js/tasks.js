"use strict"

class Tasks {

    constructor(main) {
        this.main = main;

        this.settings = {};

        this.settings["task0"] = {
            "task_id":           "task0",
            "name":             "Practice day.",
            "title":            "302km even triangle, good soaring weather",
            "weather_id":       "type-0",
            "task_length_km":   302,
            "tp_name":          ["Gransden","Didcot","Leicester"],
            "leg_length_km":    [90,130,82],
            "leg_wind_knots":   [0,5,-8],
            "start_height_max": 4000,

            "events": [
                "general,time,12:50,message,Conditions look likely to improve",
                "general,time,13:00,conditions,type-1",
                "general,time,14:10,message,Oh oh! Looks like it's going blue",
                "general,time,14:20,conditions,type-3",
                "general,time,14:50,conditions,type-5",
                "general,distance,70,message,It looks over-convected around the TP",
                "special,distance,80,100,conditions,type-2",
                "special,distance,130,190,conditions,type-6"
            ],
            "intro": `
            <p><strong><font color="green">
Welcome to Krasnoff County!  This is the first (and only) practice day!
</strong></font></p>
<p>There is <a href="k_help.html" target="top">help</a> available.</p>

<p>Today's practice task is a 302km triangle, with legs of 90km, 130km and 82km.</p>

<p>We are expecting reasonable conditions with average climbs of about 3.5 knots, with
lift improving after 13:00 but blue and weakening from 14:20. Overconvection is expected
around the first TP (i.e. at distance approx 80km).</p>

<p>The day is becoming breezy, with a nil wind on the first leg, an effective
5 knot headwind on the second leg, and an 8 knot tailwind on the final leg.</p>

<p>You can start the simulator running by clicking any 'cruise'
button.  After that, each time you are offered a climb, you can
select it by clicking the 'climb' button, or you can keep going on
track by selecting a 'cruise' button.</p>

<p>When you are at the top of a climb and have reached your preferred time
to start the task, click the 'start' button.</p>

<p>Note: The 'hunt' button improves your chances of finding a thermal,
but with little progress on track, and to make good progress choose an
appropriate cruise speed for the next expected climb, and don't get too low.
There is more help
and a detailed discussion of the simulator in <a href="k_help.html">the help file</a>.</p>
`
        };

        this.settings["task1"] = {
            "task_id":           "task1",
            "name":             "Day 1",
            "title":            "260km out-and-return, good soaring weather",
            "weather_id":       "type-2",
            "task_length_km":   260,
            "tp_name":          ["Gransden","Thorne"],
            "leg_length_km":    [130,130],
            "leg_wind_knots":   [5,-4],
            "start_height_max": 5000,

            "events": [
                "general,time,12:20,message,Conditions should improve soon",
                "general,time,12:30,conditions,type-1",
                "general,time,14:40,message,Conditions look like they'll weaken soon",
                "general,time,14:50,conditions,type-0",
                "general,time,15:10,conditions,type-4",
                "general,time,15:30,conditions,type-5"
            ],
            "intro": `
            <p><strong><font color="green">
Welcome to Day 1 of the Krasnoff County Regionals!
</strong></font> I hope you did well on the practice day.</p>

<p>Today's competition task is a 260km out-and-return, with two legs of 130km.</p>

<p>We are expecting strong conditions with average climbs of about 4.5 knots from 12:30, with
conditions weakening rapidly from 15:00.</p>

<p>The day has light winds, with a 5 knot headwind on the first leg, an expected
4 knot tailwind on the home leg.</p>

<p>To begin, enter your name or competition number in the 'pilot name' box, 'Hunt' for a thermal, and select 'Start Task' at the
top of a climb when you're ready to go. There is more help
and a detailed discussion of the simulator in <a href="k_help.html">the help file</a>.</p>
`
        };
    }

    // *******************************************************
    // Draw the task list on the home page
    // *******************************************************

    update_page(el) {
        this.main.clear_div(el);
        for (const task_id in this.settings) {
            this.add_page_task(el, this.settings[task_id]);
        }
    }

    add_page_task(el, task_obj) {
        console.log("main add_page_task",task_obj.task_id);
        let task_div = document.createElement("div");
        task_div.className = "main_task_div";

        let task_title = document.createElement("div");
        task_title.className = "main_task_title";
        task_title.textContent = task_obj.name + ": "+ task_obj.title;
        task_title.addEventListener( "click", (e) => {
            this.main.set_task(e, task_obj.task_id);
        });

        task_div.appendChild(task_title);
        el.appendChild(task_div);
    }

}

class Task {
    constructor(task_obj) {
        this.settings = task_obj;
        console.log("new task",task_obj);
    }

    update_page(el) {
        el.innerHTML = this.settings.intro;
    }
}
