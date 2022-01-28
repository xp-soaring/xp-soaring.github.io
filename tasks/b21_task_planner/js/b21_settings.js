// Loads settings from localstorage

class B21_Settings {

    // ********************************************************************************************
    // *********  Settings                                 ****************************************
    // ********************************************************************************************

    constructor(planner) {

        this.planner = planner;
        
        this.settings = {};

        this.settings_values = {
            soaring_task: 1, // 1 or 0 = true/false whether to embed the B21/ALBATROSS soaring params
            altitude_units: ["feet", "m"],
            speed_units: ["kph", "knots"],
            distance_units: ["km", "miles"],
            wp_radius_units: ["m", "feet"],
            wp_radius_m: 500,
            wp_min_alt_m: 330,
            wp_max_alt_m: 2000,
            base_layer_name: "Streetmap"
        };

        this.settings_el = document.getElementById("settings");
        this.settings_el.style.display = "none";
        this.settings_displayed = false;

        this.load_settings();

        this.build_settings_html();
    }

    toggle() {
        console.log("toggle settings from", this.settings_displayed);
        if (this.settings_displayed) {
            this.close_settings();
        } else {
            this.settings_el.style.display = "block";
            this.settings_displayed = true;
        }
    }

    close_settings() {
        this.settings_el.style.display = "none";
        this.settings_displayed = false;
    }

    build_settings_html() {
        while (this.settings_el.firstChild) {
            this.settings_el.removeChild(this.settings_el.lastChild);
        }
        let heading_el = document.createElement("div");
        heading_el.id = "settings_heading";

        let heading_text_el = document.createElement("div");
        heading_text_el.id = "settings_heading_text";
        heading_text_el.innerHTML = "Settings";
        heading_el.appendChild(heading_text_el);

        let close_el = document.createElement("button");
        close_el.addEventListener("click", (e) => this.close_settings());
        close_el.innerHTML = "Close Settings";
        heading_el.appendChild(close_el);

        this.settings_el.appendChild(heading_el);

        for (const var_name in this.settings_values) {
            if (typeof this.settings_values[var_name] == "object") {
                this.build_setting_html(var_name);
            }
        }

    }

    build_setting_html(var_name) {
        let parent = this;
        let setting_el = document.createElement("div");
        setting_el.className = "setting";
        let setting_name_el = document.createElement("div");
        setting_name_el.className = "setting_name";
        setting_name_el.innerHTML = this.var_name_to_title(var_name);
        setting_el.appendChild(setting_name_el);
        if (typeof this.settings_values[var_name] == "object") {
            let setting_options_el = document.createElement("div");
            setting_options_el.className = "setting_options";
            for (let i = 0; i < this.settings_values[var_name].length; i++) {
                let option_name = this.settings_values[var_name][i];
                let setting_option_el = document.createElement("div");
                setting_option_el.id = "setting_" + var_name + "_" + option_name;
                setting_option_el.className = "setting_option";
                setting_option_el.addEventListener("click", (e) => {
                    parent.unset(var_name);
                    parent.select(e.target);
                    parent.set(var_name, option_name);
                    parent.planner.task.display_task_info();
                });
                setting_option_el.innerHTML = "Option: " + option_name;
                if (this[var_name] == option_name) {
                    this.select(setting_option_el);
                }
                setting_options_el.appendChild(setting_option_el);
            }
            setting_el.appendChild(setting_options_el);
        }
        this.settings_el.appendChild(setting_el);
    }

    var_name_to_title(var_name) {
        let parts = var_name.split("_");
        let title = "";
        for (let i = 0; i < parts.length; i++) {
            title += (i > 0 ? " " : "") + parts[i][0].toUpperCase() + parts[i].slice(1);
        }
        return title;
    }

    select(el) {
        el.style.backgroundColor = "lightgreen";
    }

    unselect(el) {
        el.style.backgroundColor = "white";
    }

    unset(var_name) {
        for (let i = 0; i < this.settings_values[var_name].length; i++) {
            let option_name = this.settings_values[var_name][i];
            let id = "setting_" + var_name + "_" + option_name;
            this.unselect(document.getElementById(id));
        }
    }

    set(var_name, value) {
        this[var_name] = value;
        window.localStorage.setItem('b21_task_planner_' + var_name, "" + value);
    }

    load_setting(var_name) {
        let value = window.localStorage.getItem('b21_task_planner_' + var_name);
        let error = true;
        if (typeof this.settings_values[var_name] == "string") {
            if (value == null || value == "") {
                this[var_name] = this.settings_values[var_name];
            } else {
                this[var_name] = value;
            }
        } else if (typeof this.settings_values[var_name] == "object") {
            for (let i = 0; i < this.settings_values[var_name].length; i++) {
                if (value == this.settings_values[var_name][i]) {
                    this[var_name] = value;
                    error = false;
                    break;
                }
            }
            if (error) {
                this[var_name] = this.settings_values[var_name][0];
            }
        } else {
            this[var_name] = parseFloat(value);
            if (isNaN(this[var_name])) {
                this[var_name] = this.settings_values[var_name];
            }
        }
        console.log("load_setting", var_name, this[var_name]);
    }

    load_settings() {
        for (const var_name in this.settings_values) {
            this.load_setting(var_name);
        }
        if (this.soaring_task == 0) {
            document.getElementById("soaring_task_checkbox").checked = false;
        }
        console.log("load_settings", this.altitude_units, this.distance_units);
    }

}
