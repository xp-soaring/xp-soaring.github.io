
class Tasks {

    constructor() {
        this.data = {};

        this.data["task0"] = {
            "task_id":           "task0",
            "title":            "302km even triangle, good soaring weather",
            "task_length_km":   302,
            "tp_name":          ["Gransden","Didcot","Leicester"],
            "leg_length_km":    [90,130,82],
            "leg_wind_knots":   [0,5,-8],
            "start_height_max": 4000,

            "events": [
                "general,time,12:50,message,Conditions look likely to improve",
                "general,time,13:00,conditions,1",
                "general,time,14:10,message,Oh oh! Looks like it's going blue",
                "general,time,14:20,conditions,3",
                "general,time,14:50,conditions,5",
                "general,distance,70,message,It looks over-convected around the TP",
                "special,distance,80,100,conditions,2",
                "special,distance,130,190,conditions,6"
            ]
        };

        this.data["task1"] = {
            "task_id":           "task1",
            "title":            "260km out-and-return, good soaring weather",
            "task_length_km":   260,
            "tp_name":          ["Gransden","Thorne"],
            "leg_length_km":    [130,130],
            "leg_wind_knots":   [5,-4],
            "start_height_max": 5000,

            "events": [
                "general,time,12:20,message,Conditions should improve soon",
                "general,time,12:30,conditions,1",
                "general,time,14:40,message,Conditions look like they'll weaken soon",
                "general,time,14:50,conditions,0",
                "general,time,15:10,conditions,4",
                "general,time,15:30,conditions,5"
            ]
        };
    }
}