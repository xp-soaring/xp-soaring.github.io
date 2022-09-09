// Loads settings from localstorage

// Note we are treating the Local Waypoints files (like CUP) as 'settings' as they are persisted to localStorage.

class B21_Settings {

    // ********************************************************************************************
    // *********  Settings                                 ****************************************
    // ********************************************************************************************

    constructor(planner) {

        this.planner = planner;

        this.settings_el = document.getElementById("settings");

        this.SETTINGS_VAR_PREFIX = 'b21_task_planner_';
        this.SETTINGS_LOCAL_WAYPOINTS_INFO = this.SETTINGS_VAR_PREFIX+'local_waypoints_info';

        this.init();
    }

    init() {
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
            show_speed_line_on_chart: ["yes","no"],
            task_line_color_1: ["red","green","yellow"],
            task_line_color_2: ["none", "brown", "black"],
            base_layer_name: "Streetmap"
        };

        this.local_waypoints_info = []; // ARRAY of [ { local_waypoints_key, active }, ... ]

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
            this.build_settings_html();
            this.settings_el.style.display = "block";
            this.settings_displayed = true;
        }
    }

    close_settings() {
        this.settings_el.style.display = "none";
        this.settings_displayed = false;
        this.planner.task.display_task_info();
        this.planner.task.redraw();
    }

    reset_settings() {
        if (confirm("Do you really want to reset all settings values, including your custom waypoints?")) {

            // clear localStroage, but see if we can persist the id
            let id = localStorage.getItem("b21_task_planner_id");
            localStorage.clear();
            if (id != null) {
                localStorage.setItem("b21_task_planner_id", id);
            }

            this.init();

            this.settings_el.style.display = "block";
            this.planner.task.display_task_info();
            this.planner.task.redraw();
            this.settings_displayed = true;
        }
    }

    build_settings_html() {
        console.log("build_settings_html()");

        B21_Utils.clear_div(this.settings_el);

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

        let reset_el = document.createElement("button");
        reset_el.addEventListener("click", (e) => this.reset_settings());
        reset_el.innerHTML = "Reset ALL Settings";
        heading_el.appendChild(reset_el);

        this.settings_el.appendChild(heading_el);

        for (const var_name in this.settings_values) {
            if (typeof this.settings_values[var_name] == "object") {
                this.build_setting_html(var_name);
            }
        }

        this.build_all_local_waypoints_html();
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
                setting_option_el.className = "setting_option";

                let setting_option_entry_el = document.createElement("div");
                setting_option_entry_el.id = "setting_" + var_name + "_" + option_name;
                setting_option_entry_el.className = "setting_option_entry";
                setting_option_entry_el.addEventListener("click", (e) => {
                    parent.unset(var_name);
                    parent.select(e.target);
                    parent.set(var_name, option_name);
                    parent.planner.task.display_task_info();
                });
                setting_option_entry_el.innerHTML = "Option: " + option_name;
                setting_option_el.appendChild(setting_option_entry_el);

                if (this[var_name] == option_name) {
                    this.select(setting_option_entry_el);
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
        window.localStorage.setItem(this.SETTINGS_VAR_PREFIX + var_name, "" + value);
    }

    load_setting(var_name) {
        let value = window.localStorage.getItem(this.SETTINGS_VAR_PREFIX + var_name);
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

    // Load all the persisted settings valuse from localStorage
    load_settings() {
        // Load the settings 'vars' such as altitude_units
        for (const var_name in this.settings_values) {
            this.load_setting(var_name);
        }

        // This soaring_task flag is a placeholder (always true)
        if (this.soaring_task == 0) {
            document.getElementById("soaring_task_checkbox").checked = false;
        }
        console.log("load_settings", this.altitude_units, this.distance_units);

        // Load .local_waypoints_info and then the active waypoints into b21_task_planner
        this.load_settings_active_waypoints();
    }

    // ***********************************************************************
    // ************** Local Waypoints           ******************************
    // ***********************************************************************

    // Read local_waypoints_info from localStorage, and
    // load all waypoints data flagged as 'active'
    load_settings_active_waypoints() {
        console.log("load_settings_local_waypoints()");
        // '[ { "local_waypoints_key":  "BGA 2022 Revision a SeeYou.cup", "load": true } .. ]'
        let local_waypoints_info_str = window.localStorage.getItem(this.SETTINGS_LOCAL_WAYPOINTS_INFO);
        if (local_waypoints_info_str == null) {
            console.log("load_settings_local_waypoints got null from localStorage");
            return;
        }
        try {

            this.local_waypoints_info = JSON.parse(local_waypoints_info_str);
            console.log("loaded local_waypoints_info from settings", this.local_waypoints_info);
            for (let i=0; i<this.local_waypoints_info.length; i++) {
                if (this.local_waypoints_info[i].active) {
                    console.log("load_settings_local_waypoints loading active",this.local_waypoints_info[i]);
                    let key = this.local_waypoints_info[i].local_waypoints_key;
                    this.load_waypoints(key);
                } else {
                    console.log("load_settings_local_waypoints skipping inactive",this.local_waypoints_info[i]);
                }
            }

        } catch (e) {
            console.log("load error for local waypoints settings", e);
            alert("An error occurred while loading your saved Local Waypoints");
            window.localStorage.removeItem(this.SETTINGS_LOCAL_WAYPOINTS_INFO);
            return;
        }
    }

    // Load waypoints from localStorage
    load_waypoints(key) {
        let waypoints_obj = new B21_Local_Waypoints(this.planner, key);
        let waypoints_str = window.localStorage.getItem(this.SETTINGS_VAR_PREFIX+'waypoints_'+key);
        waypoints_obj.loads(waypoints_str);
        this.planner.add_local_waypoints(key, waypoints_obj);
    }

    build_all_local_waypoints_html() {
        console.log("build_all_local_waypoints_html()", this.local_waypoints_info);
        for (let i=0; i<this.local_waypoints_info.length; i++) {
            this.build_local_waypoints_html(this.local_waypoints_info[i]);
        }
    }

    build_local_waypoints_html(waypoints_info) {
        console.log("build_local_waypoints_html",waypoints_info);
        let parent = this;

        let local_waypoints_key = waypoints_info.local_waypoints_key;

        let setting_el = document.createElement("div");
        setting_el.className = "setting";
        let setting_name_el = document.createElement("div");
        setting_name_el.className = "setting_name";
        setting_name_el.innerHTML = "Local waypoints: "+local_waypoints_key;
        setting_el.appendChild(setting_name_el);

        let setting_options_el = document.createElement("div");
        setting_options_el.className = "setting_options";

        let setting_option_enabled_el = document.createElement("div");
        setting_option_enabled_el.className = "setting_option";
        let setting_option_enabled_entry_el = document.createElement("div");
        setting_option_enabled_entry_el.id = "setting_waypoints_" + local_waypoints_key + "_enabled";
        setting_option_enabled_entry_el.className = "setting_option_entry";
        setting_option_enabled_entry_el.innerHTML = "Option: load on startup";
        setting_option_enabled_entry_el.addEventListener("click", (e) => {
            console.log("local_waypoints setting CLICKED: enabled", local_waypoints_key, e);
            if (waypoints_info.active) {
                return; // waypoints are already enabled, so ignore
            }
            this.wp_unselect(local_waypoints_key);
            e.target.className = "setting_option_entry_selected";
            waypoints_info.active = true;
            this.store_local_waypoints_info();
            // If these waypoints are not already loaded, we should load them
            if (this.planner.local_waypoints_loaded_status(local_waypoints_key)) {
                this.planner.local_waypoints_set_active(local_waypoints_key);
            } else {
                this.load_waypoints(local_waypoints_key);
            }
            // Tell the planner new local waypoints have been loaded
            this.planner.local_waypoints_load_completed(local_waypoints_key);
        });
        setting_option_enabled_el.appendChild(setting_option_enabled_entry_el);
        setting_options_el.appendChild(setting_option_enabled_el);

        let setting_option_disabled_el = document.createElement("div");
        setting_option_disabled_el.className = "setting_option";
        let setting_option_disabled_entry_el = document.createElement("div");
        setting_option_disabled_entry_el.id = "setting_waypoints_" + local_waypoints_key + "_disabled";
        setting_option_disabled_entry_el.className = "setting_option_entry";
        setting_option_disabled_entry_el.innerHTML = "Option: disabled";
        setting_option_disabled_entry_el.addEventListener("click", (e) => {
            console.log("local_waypoints setting CLICKED: disabled", local_waypoints_key, e);
            if (!waypoints_info.active) {
                return; // waypoints are already disabled, so ignore
            }
            this.wp_unselect(local_waypoints_key);
            e.target.className = "setting_option_entry_selected";
            waypoints_info.active = false;
            this.store_local_waypoints_info();
            this.planner.local_waypoints_set_inactive(local_waypoints_key);
            this.planner.local_waypoints_hide(local_waypoints_key);
        });
        setting_option_disabled_el.appendChild(setting_option_disabled_entry_el);
        setting_options_el.appendChild(setting_option_disabled_el);

        let setting_option_delete_el = document.createElement("div");
        setting_option_delete_el.className = "setting_option";
        let setting_option_delete_entry_el = document.createElement("div");
        setting_option_delete_entry_el.id = "setting_waypoints_" + local_waypoints_key + "_delete";
        setting_option_delete_entry_el.className = "setting_option_entry";
        setting_option_delete_entry_el.innerHTML = "Option: DELETE";
        setting_option_delete_entry_el.addEventListener("click", (e) => {
            this.wp_unselect(local_waypoints_key);
            e.target.className = "setting_option_entry_selected";
            if (confirm("Are you sure you want to remove "+waypoints_info.local_waypoints_key)) {
                console.log("DELETE "+waypoints_info.local_waypoints_key);
                // hide current entry in settings
                setting_el.style.display = "none";
                // If waypoints are currently displayed, remove the marker layer
                if (this.planner.local_waypoints_loaded_status(local_waypoints_key)) {
                    this.planner.local_waypoints_hide(local_waypoints_key);
                }
                // delete the local_waypoints object
                this.planner.local_waypoints_delete(local_waypoints_key);
                // remove the waypoints from localStorage
                window.localStorage.removeItem(local_waypoints_key);
                // remove the entry from local_waypoints_info
                let index = null;
                for (let i=0; i<this.local_waypoints_info.length; i++) {
                    if (this.local_waypoints_info[i].local_waypoints_key == local_waypoints_key) {
                        index = i;
                        break;
                    }
                }
                if (index != null) {
                    this.local_waypoints_info.splice(index,1);
                }
                // save waypoints_info change to localStorage
                this.store_local_waypoints_info();
            } else {
                e.target.style.backgroundColor = "white";
                if (waypoints_info.active) {
                    this.select(setting_option_enabled_entry_el);
                } else {
                    this.select(setting_option_disabled_entry_el);
                }
            }
        });
        setting_option_delete_el.appendChild(setting_option_delete_entry_el);
        setting_options_el.appendChild(setting_option_delete_el);

        if (waypoints_info.active) {
            setting_option_enabled_entry_el.className = "setting_option_entry_selected";
        } else {
            setting_option_disabled_entry_el.className = "setting_option_entry_selected";
        }

        setting_el.appendChild(setting_options_el);
        this.settings_el.appendChild(setting_el);
    }

    // remove highlighting from all the current local waypoint options
    wp_unselect(key) {
        for (let option_name of ["enabled", "disabled", "delete"]) {
            let el = document.getElementById("setting_waypoints_" + key + "_" + option_name);
            el.className = "setting_option_entry";
        }
    }

    set_settings_local_waypoints(key, waypoints_obj) {
        try {

            // Persist the waypoints in localStorage
            let local_waypoints_str = waypoints_obj.dumps();
            window.localStorage.setItem(this.SETTINGS_VAR_PREFIX+'waypoints_'+key, local_waypoints_str);

            // Set/Store an updated local_waypoints_info
            let new_local_waypoints_info = [];
            for (let i=0; i<this.local_waypoints_info.length; i++) {
                let entry = this.local_waypoints_info[i];
                if (entry.local_waypoints_key != key) {
                    new_local_waypoints_info.push(entry);
                }
            }
            new_local_waypoints_info.push({ local_waypoints_key: key, active: true });
            this.local_waypoints_info = new_local_waypoints_info;
            this.store_local_waypoints_info();

        } catch (e) {
            console.log("Bad data given for local_waypoints setting", key, waypoints_obj, e);
            alert("A problem occurred with the Local Waypoints data");
        }
    }

    store_local_waypoints_info() {
        try {

            let local_waypoints_info_str = JSON.stringify(this.local_waypoints_info);
            window.localStorage.setItem(this.SETTINGS_VAR_PREFIX+'local_waypoints_info', local_waypoints_info_str);
        } catch(e) {
            console.log("Bad data given for local_waypoints_info setting", this.local_waypoints_info, e);
            alert("A problem occurred with the Local Waypoints info");
        }
    }
}
