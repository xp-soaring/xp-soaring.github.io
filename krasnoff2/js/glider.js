class Glider {

    constructor(glider_obj) {
        console.log("Glider constructor", glider_obj);

        this.task = null;

        this.glider_id = glider_obj.glider_id;
        this.title = glider_obj.title;
        this.handicap = glider_obj.handicap;
        this.sink = glider_obj.sink;

        this.current_altitude = 2000;      // start off tow at 2000 feet
        this.current_time = 43200;         // 12:00:00
        this.current_distance = 0;         // distance around the task
        this.current_hdistance = 0;        // handicapped distance around the task
        this.current_ballast = 2;          // 0 = dry, 1 = half, 2 = full
        this.current_day = 0;              // day number, events loaded from k_day<n>.html
        this.current_pilot = "";           // pilot name or code used to distinguish stored results
        this.current_speed = 0;            // cross-country speed
        this.current_hspeed = 0;           // handicapped cross-country speed

        this.current_mc = 0;               // macready
        this.current_stf = 0;              // speed to fly
        this.current_altReq = 0;           // altitude required to reach a goal

        this.quadA = null;                // polar quadratic factor A
        this.quadB = null;
        this.quadC = null;                  // polar quadratic factor C

        this.speed = new Array;
        this.speed[0] = 0;   // thermalling
        this.speed[1] = 20;  // hunt cross-country speed = 20 knots i.e. you are wandering looking for lift
        this.speed[2] = 60;  // cruising speed rate 1 = 60 knots etc.
        this.speed[3] = 70;
        this.speed[4] = 80;
        this.speed[5] = 90;
        this.speed[6] = 100;
        this.speed[7] = 110;
        this.speed[8] = 120;

        this.setPolarQuad(this.current_ballast);
    }

    set_ballast(n) {
      if (this.current_ballast<n)
        { alert("You can't increase ballast in-flight."); }
      else
        { this.current_ballast = n; }
      this.setPolarQuad(n);
      //update_form1();
    }

    setPolarQuad(current_ballast)  {
    //  alert("current_glider:"+current_glider+" current_ballast:"+current_ballast);
        let v1 = this.speed[3];
        let v2 = this.speed[5];
        let v3 = this.speed[7];
    //  alert("v1:"+v1+" v2:"+v2+" v3:"+v3);
        let w1 = this.sink[current_ballast][3]*100;
        let w2 = this.sink[current_ballast][5]*100;
        let w3 = this.sink[current_ballast][7]*100;
    //  alert("w1:"+w1+" w2:"+w2+" w3:"+w3);
        this.quadA = ((v2-v3)*(w1-w3)+(v3-v1)*(w2-w3)) /
            ((v1*v1)*(v2-v3)+(v2*v2)*(v3-v1)+(v3*v3)*(v1-v2));
        this.quadB = (w2-w3-this.quadA*(v2*v2-v3*v3))/(v2-v3);
        this.quadC = w3 - this.quadA*v3*v3 - this.quadB * v3;
    //  alert("quadA:"+quadA+" quadB:"+quadB+" quadC:"+quadC);
    }


    interp(x1, x2, y1, y2, x) {
        let slope = (y2-y1)/(x2-x1);
    //  alert("slope:"+slope);
        return y2-slope*(x2-x);
    }

    lookupPolarSink(speed, ballast) {
        let iii;
        for (iii = 0; iii < this.speed.length && speed > this.speed[iii]; iii++);
        //  alert("iii:"+iii);  // debug
        if (iii == this.speed.length) {
            iii--;
        }

        let sinkRate;
        let sink1 = this.sink[ballast][iii-1];
        let sink2 = this.sink[ballast][iii];
        //  alert("sink1:"+sink1+" sink2:"+sink2);
        //  alert("speed1:"+speed[iii-1]+" speed2:"+speed[iii]+" speed:"+speed);
        sinkRate = this.interp(this.speed[iii-1], this.speed[iii], sink1, sink2, speed);
        //  alert("sinkRate:"+sinkRate);  // debug
        return sinkRate;
    }


    calcAltReq() {
        this.calcStf();
        let sinkRate = lookupPolarSink(this.current_stf);
        let ld = (this.current_stf-leg_wind[current_leg]) / sinkRate;
        let distGoal = leg_distance[current_leg] - current_distance;
        //  alert("ld:"+ld+" current_distance:"+current_distance+" distGoal:"+distGoal);
        this.current_altReq = distGoal * ftkm / ld;
        //  alert("altReq:"+current_altReq);
    }

    calcStf(mc) {
        //  alert("quadA:"+quadA+" quadC:"+quadC);
        let stf;
        if ((this.quadC+mc*100)/this.quadA < 0) {
            stf = this.speed[2]; // bugfix: current_stf calculation bad if on backslope of polar
        } else {
            stf = Math.sqrt((this.quadC+mc*100)/this.quadA);
        }
        if (stf < this.speed[2]) {
            stf = speed[2];
        }
        return stf;
    }

    set_mc(mc_inc) {
        this.current_mc = this.current_mc + mc_inc;
        if (this.current_mc < 0) {
            this.current_mc = 0;
        }
        //  calcAltReq();
        //update_form1();
    }

}
