
"use strict"

class Main {
    constructor() {
        this.config = null;
        // Load base settings
        this.weather = new Weather(this);
        this.gliders = new Gliders(this);
        this.tasks = new Tasks(this);

        this.glider = null;
        this.task = null;

        this.init();
    }

    init() {
        console.log("main.init()");
        this.main_tasks_el = document.getElementById("main_tasks");
        this.fly_weather_el = document.getElementById("fly_weather");
        this.fly_message_el = document.getElementById("fly_message");

        this.get_config();

        this.set_glider('asw28');

        this.tasks.update_page(this.main_tasks_el);

        this.clock = new Date();
        this.clock.setHours(12,0,0);

        this.UPDATE_INTERVAL_MS = 100;  // when flying, update every 100 ms.
        this.UPDATE_SPEED = 20;         // run simulation at 20 times real speed

        this.timer = null; // We will use for setInterval timer

        this.launch_el = document.getElementById("launch");
        this.clock_el = document.getElementById("clock");
    }

    get_config(d) {
        //fetch("config.json")
        //.then((r) => r.json())
        //.then ((d) => this.handle_config(d));
        this.handle_config(KRASNOFF_CONFIG);
    }

    handle_config(config_obj) {
        console.log("main init config",config_obj);
        this.config = config_obj;
    }

    // ******************************************************
    // User chose glider
    // ******************************************************

    set_glider(glider_id) {
        console.log("main set_glider",glider_id);

        this.glider = new Glider(this.gliders.settings[glider_id]);
    }

    // ******************************************************
    // User chose task
    // ******************************************************

    set_task(e, task_id) {
        console.log("set_task",task_id);
        this.task = new Task(this.tasks.settings[task_id]);
        this.task.update_page(this.fly_message_el);
        this.weather.set_weather(this.task.settings.weather_id);
        this.weather.update_page(this.fly_weather_el);
    }

    // ******************************************************
    // Flight
    // ******************************************************

    launch() {
        let parent = this;
        console.log("launch");

        if (this.launch_el.value == "Launch" || this.launch_el.value == "Continue") {
            parent.timer = window.setInterval( () => { parent.update(parent); }, parent.UPDATE_INTERVAL_MS );
            this.launch_el.value = "Pause";
        } else if (this.launch_el.value == "Pause") {
            clearInterval(parent.timer);
            this.launch_el.value = "Continue";
        }
    }

    update(parent) {
        // Update clock time
        this.UPDATE_TIME_DELTA_MS = parent.UPDATE_INTERVAL_MS * parent.UPDATE_SPEED;
        parent.clock.setSeconds(parent.clock.getSeconds() +  this.UPDATE_TIME_DELTA_MS / 1000);

        parent.update_clock(parent);
    }

    update_clock(parent) {
        parent.clock_el.value = parent.clock.toLocaleTimeString();
    }

    // ******************************************************
    // Utils
    // ******************************************************

    clear_div(d) {
        while (d.firstChild) {
            d.removeChild(d.lastChild);
        }
    }


}
