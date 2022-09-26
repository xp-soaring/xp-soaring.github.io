
"use strict"

class Main {
    constructor() {
        this.config = null;
        this.tasks = [];
        this.glider = null;
    }

    init() {
        console.log("main.init()");
        this.main_tasks_el = document.getElementById("main_tasks");

        this.get_config();

        this.set_glider('asw28');
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
        this.load_tasks();
    }

    load_tasks() {
        console.log("main init load_tasks()");
        for (let i=0; i<this.config.tasks.length; i++) {
            let task_name = this.config.tasks[i];
            //fetch("tasks/"+config.tasks[i]+".json")
            //.then((r) => r.json())
            //.then ((d) => this.handle_task(task_name, d));
            this.handle_task(task_name, KRASNOFF_TASKS[task_name]);
        }
    }

    handle_task(task_name, task_obj) {
        console.log("main handle_task",task_name);
        this.tasks.push(task_obj);
        this.update_page_tasks();
    }

    update_page_tasks() {
        this.clear_div(this.main_tasks_el);
        for (let i=0; i<this.tasks.length; i++) {
            this.add_page_task(this.tasks[i]);
        }
    }

    add_page_task(task_obj) {
        console.log("main add_page_task",task_obj.task_id);
        let task_div = document.createElement("div");
        task_div.className = "main_task_div";

        let task_title = document.createElement("div");
        task_title.className = "main_task_title";
        task_title.textContent = task_obj.title;
        task_div.appendChild(task_title);
        this.main_tasks_el.appendChild(task_div);
    }

    set_glider(glider_id) {
        console.log("main set_glider",glider_id);
        //fetch("gliders/"+glider_id+".json")
        //.then((r) => r.json())
        //.then ((g) => this.handle_glider(glider_id, g));
        this.handle_glider(glider_id,KRASNOFF_GLIDERS[glider_id]);
    }

    handle_glider(glider_id, glider_obj) {
        console.log("handle_glider",glider_id);
        this.glider = new Glider(glider_obj);
    }

    clear_div(d) {
        while (d.firstChild) {
            d.removeChild(d.lastChild);
        }
    }

}
