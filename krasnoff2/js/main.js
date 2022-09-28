
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
    // Utils
    // ******************************************************

    clear_div(d) {
        while (d.firstChild) {
            d.removeChild(d.lastChild);
        }
    }


}
