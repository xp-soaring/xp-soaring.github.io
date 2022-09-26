
class Results {

    constructor() {
        this.cookie_name = "krasnoff"; // name of cookie used to store results

        // results arrays r_<value>[n] is result n

        this.num_results = 0;  // number of results stored in cookie
        this.max_results = 15; // store maximum of 15 results in cookie (cookie space limit)
            // COOKIE VALUES:
        this.r_timestamp = new Array; // timestamp of result entry
        this.r_day = new Array;       // competition day of this result
        this.r_glider = new Array;    // type of glider flown (0=asw-28 etc)
        this.r_pilot = new Array;     // id of pilot
        this.r_speed = new Array;     // speed achieved (km/h, 0 if landout)
        this.r_hspeed = new Array;    // handicapped speed achieved (km/h)
        this.r_distance = new Array;  // distance achieved (km)
        this.r_hdistance = new Array; // handicapped distance achieved

        this.results_tag = "<rs>";      // XML tags wrapped around results in cookie
        this.results_end_tag = "</rs>";
        this.result_tag = "<r>";
        this.result_end_tag = "</r>";
        this.timestamp_tag = "<t>";
        this.timestamp_end_tag = "</t>";
        this.day_tag = "<dy>";
        this.day_end_tag = "</dy>";
        this.glider_tag = "<g>";
        this.glider_end_tag = "</g>";
        this.pilot_tag = "<p>";
        this.pilot_end_tag = "</p>";
        this.speed_tag = "<s>";
        this.speed_end_tag = "</s>";
        this.hspeed_tag = "<hs>";
        this.hspeed_end_tag = "</hs>";
        this.distance_tag = "<d>";
        this.distance_end_tag = "</d>";
        this.hdistance_tag = "<hd>";
        this.hdistance_end_tag = "</hd>";

        this.xml_cursor = 0;
        this.splits = null;
    }

    // **********************************************************************************
    // Cookie functions
    // **********************************************************************************

    getCookie (name)
    {
        var dcookie = document.cookie;
        var cname = name + "=";
        var clen = dcookie.length;
            // alert("Cookie size = " + clen); // debug
        var cbegin = 0;
        while (cbegin < clen)
        {
            var vbegin = cbegin + cname.length;
            if (dcookie.substring(cbegin, vbegin) == cname)
            {
                var vend = dcookie.indexOf (";", vbegin);
                if (vend == -1) vend = clen;
                return unescape(dcookie.substring(vbegin, vend));
            }
            cbegin = dcookie.indexOf(" ", cbegin) + 1;
            if (cbegin == 0) break;
        }
        return null;
    }

    setCookie (name, value)
    {
        var expdate = new Date();
        // Set expiration date to a year from now.
        expdate.setTime(expdate.getTime() +  (24 * 60 * 60 * 1000 * 365));
        document.cookie = name + "=" + escape (value) + "; expires=" + expdate.toGMTString();
    }

    delCookie (name)
    {
        var expireNow = new Date();
        document.cookie = name + "=" + "; expires=Thu, 01-Jan-70 00:00:01 GMT";
    }

    // End of cookie code adapted from Nick Heinle

    strip_tags(source, start, open_tag, close_tag)
    {
        if (source=="") return "";
            if (start>=source.length) return ""
        xml_cursor = start;
        var i = source.indexOf(open_tag, start);
            if (i==-1) return "";
            i = i + open_tag.length;
            var j = source.indexOf(close_tag,i);
            if (j==-1) return "";
            xml_cursor = j + close_tag.length;
            return source.substring(i,j);
        }

    load_results() // populates global results variables from cookie
    {
        var result;
        num_results = 0;
        var r_string = getCookie(cookie_name); // load entire results string
            if (r_string==null)
            {
                // alert("Current "+cookie_name+" cookie is null"); // debug
                return;
                }
        var i = 0;                             // index into r_string
        result = strip_tags(r_string, 0, result_tag, result_end_tag);
        while (result.length > 0)
        {
            r_timestamp[num_results] = strip_tags(result, 0, timestamp_tag, timestamp_end_tag);
            r_day[num_results] = strip_tags(result, 0, day_tag, day_end_tag);
            r_glider[num_results] = strip_tags(result, 0, glider_tag, glider_end_tag);
            r_pilot[num_results] = strip_tags(result, 0, pilot_tag, pilot_end_tag);
            r_speed[num_results] = strip_tags(result, 0, speed_tag, speed_end_tag);
            r_hspeed[num_results] = strip_tags(result, 0, hspeed_tag, hspeed_end_tag);
            r_distance[num_results] = strip_tags(result, 0, distance_tag, distance_end_tag);
            r_hdistance[num_results] = strip_tags(result, 0, hdistance_tag, hdistance_end_tag);
            num_results++;
            i = i + result.length;
            result = strip_tags(r_string, i, result_tag, result_end_tag);
        }
        if (num_results>0) current_pilot =  r_pilot[num_results-1]; // set current_pilot to most recent value in results cookie
        // alert(num_results+" results loaded"); // debug
    }

    show_results()
    {
        var message_text = "<html>";
        message_text += "<head><title>Results</title></head>";
        message_text += "<body><font face='Helvetica'>";
        message_text += "<h2>Krasnoff County Regionals: Results</h2>";
        message_text += "<table border='1'>";
            message_text += show_heading();
            for (var i = num_results-1;i>=0;i--)
            {
                message_text += show_result(i);
                }
        message_text += "</table></font></body></html>";
        messages_div.innerHTML = message_text;
    }

    show_heading()
    {
        var message_text = '';
        message_text += "<tr bgcolor=\"lightgreen\">";
        message_text += "<th>Glider</th>";
        message_text += "<th>Date</th>";
        message_text += "<th>Day</th>";
        message_text += "<th>Pilot</th>";
        message_text += "<th>Speed</th>";
        message_text += "<th>Handicapped<br>speed</th>";
        message_text += "<th>Distance</th>";
        message_text += "<th>Handicapped<br>distance</th>";
        message_text += "</tr>";
        return message_text;
        }

    is_less(i,j) // used by sort_results()
    {
        if (r_glider[i]<r_glider[j]) return true
        else if (r_glider[i]==r_glider[j] && r_timestamp[i]<r_timestamp[j]) return true
        return false;
    }

    swap_results(i,j) // used by sort_results()
    {
        var s_timestamp = r_timestamp[i]; // timestamp of result entry
        var s_day = r_day[i];       // competition day of this result
        var s_glider = r_glider[i];    // type of glider flown (0=asw-28 etc)
        var s_pilot = r_pilot[i];     // id of pilot
        var s_speed = r_speed[i];     // speed achieved (km/h, 0 if landout)
        var s_hspeed = r_hspeed[i];    // handicapped speed achieved (km/h)
        var s_distance = r_distance[i];  // distance achieved (km)
        var s_hdistance = r_hdistance[i]; // handicapped distance achieved

        r_timestamp[i] = r_timestamp[j];
        r_day[i] = r_day[j];
        r_glider[i] = r_glider[j];
        r_pilot[i] = r_pilot[j];
        r_speed[i] = r_speed[j];
        r_hspeed[i] = r_hspeed[j];
        r_distance[i] = r_distance[j];
        r_hdistance[i] = r_hdistance[j];

        r_timestamp[j] = s_timestamp;
        r_day[j] = s_day;
        r_glider[j] = s_glider;
        r_pilot[j] = s_pilot;
        r_speed[j] = s_speed;
        r_hspeed[j] = s_hspeed;
        r_distance[j] = s_distance;
        r_hdistance[j] = s_hdistance;
    }

    sort_results() // bubble sort
    {
            for (var i = 0; i<num_results-1;i++)
            {
                for (var j = i+1; j<num_results;j++)
            {
                if (is_less(j,i)) swap_results(i,j);
            }
            }
    }

    show_result(i) // window, result_index
    {
        var message_text = '';
        var d = new Date(parseInt(r_timestamp[i]));
        var day = r_day[i];
        if (day==0) { day = "practice"; }
        var pilot = r_pilot[i];
        if (pilot=="") { pilot = "n/a"; }
        var row_color = "lightgreen";
        if (r_glider[i]==0) row_color = "#80ff00";
        else if (r_glider[i]==1) row_color = "#ffff00";
        else if (r_glider[i]==2) row_color = "#00ffff";
        message_text += "<tr bgcolor=" + row_color + ">";
        message_text += "<td>"+glider_desc[r_glider[i]]+"</td>";
        message_text += "<td>"+d.getYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+"</td>";
        message_text += "<td>"+day+"</td>";
        message_text += "<td>"+pilot+"</td>";
        if (r_speed[i]!=0)
        {
            message_text += "<td>"+r_speed[i]+" km/h</td>";
            message_text += "<td>"+r_hspeed[i]+" km/h</td>";
        }
        else
        {
            message_text += "<td>&nbsp;</td>";
            message_text += "<td>&nbsp;</td>";
        }
        if (r_distance[i]!=0)
        {
            message_text += "<td>"+r_distance[i]+" km</td>";
            message_text += "<td>"+r_hdistance[i]+" km</td>";
        }
        else
        {
            message_text += "<td>&nbsp;</td>";
            message_text += "<td>&nbsp;</td>";
        }
        message_text += "</tr>";
        }

    store_results()
    {
        // store results as XML string in cookie called 'cookie_name'
        // alert("Storing "+num_results+" results"); // debug
        var r_string = results_tag;
        var i = 0;
        while (i<num_results)
        {
            r_string = r_string + result_tag;
            r_string = r_string + timestamp_tag + r_timestamp[i] + timestamp_end_tag;
            r_string = r_string + day_tag + r_day[i] + day_end_tag;
            r_string = r_string + glider_tag + r_glider[i] + glider_end_tag;
            r_string = r_string + pilot_tag + r_pilot[i] + pilot_end_tag;
            r_string = r_string + speed_tag + r_speed[i] + speed_end_tag;
            r_string = r_string + hspeed_tag + r_hspeed[i] + hspeed_end_tag;
            r_string = r_string + distance_tag + r_distance[i] + distance_end_tag;
            r_string = r_string + hdistance_tag + r_hdistance[i] + hdistance_end_tag;
            r_string = r_string + result_end_tag;
                    i++
        }
            r_string = r_string + results_end_tag;
            // alert("results="+r_string); // debug
        setCookie(cookie_name, r_string);
    }

    set_result()
    {
        var current_result = num_results;
        if (num_results==max_results)
            {
                current_result = result_to_replace();
                }
        else
            num_results++;
        // alert("Setting  current result "+current_result); // debug
        var t = new Date();
        r_timestamp[current_result] = places(t.getTime(),0); // save all as string
        r_day[current_result] = places(current_day,0);
        r_glider[current_result] = places(current_glider,0);
        r_pilot[current_result] = current_pilot;
        r_speed[current_result] = places(current_speed,1);
        r_hspeed[current_result] = places(current_hspeed,1);
        r_distance[current_result] = places(current_distance,1);
        r_hdistance[current_result] = places(current_hdistance,1);
        sort_results();
        store_results();
    }

    result_to_replace() // return index of oldest result in cookie
    {
        if (num_results==0) return 0;
        var replace_index = 0;
        for (var i=1; i<num_results; i++)
            {
            if (r_timestamp[i]<r_timestamp[replace_index])
                {
                    replace_index = i;
                    }
            }
        // alert("result to replace is "+replace_index); // debug
        return replace_index;
        }

    // **********************************************************************************
    // Formatting functions
    // **********************************************************************************

    places(f, d) // return number f as a string, with d digits after decimal point
        {
        var q="";
        if (d == 0)
            return ""+( Math.round(f) );
        else if ( d == 1)
            p = (Math.round(f*10) / 10);
        else if ( d == 2)
            p = (Math.round(f*100) / 100);
        else if ( d == 3)
            p = (Math.round(f*1000) / 1000);
        if ((""+p).indexOf('.') == -1)
            q = p + ".0000";
        else
            q = p + "0000";
        return q.substring(0,q.indexOf('.')+d+1);
        }

    two_digits(i)
    {
        var cc = "00"+i;
        var r = cc.substring(cc.length-2);
        return r;
    }

    char_to_int(c)
    {
        if (c=='0') return 0;
        else if (c=='1') return 1;
        else if (c=='2') return 2;
        else if (c=='3') return 3;
        else if (c=='4') return 4;
        else if (c=='5') return 5;
        else if (c=='6') return 6;
        else if (c=='7') return 7;
        else if (c=='8') return 8;
        else if (c=='9') return 9;
        alert("Error: trying to convert <"+c+"> to a number - bad event in day file?");
        return -1;
    }

    str_to_int(s)
    {
        var i, num=0;
        for (i=0; i<s.length; i++)
        {
            num = (num*10)+char_to_int(s.charAt(i));
        }
        return num;
    }

    time_to_int(t)
    {
        var seconds=0, i;
        var hms = new Array;
        split(t,":");
        hms = splits; // hms[0..2] = hours, mins, secs
        for (i=0;i<hms.length; i++)
        {
            seconds = (seconds * 60) + str_to_int(hms[i]);
        }
        if (hms.length==1) seconds = seconds * 3600; // only hours given in t
        else if (hms.length==2) seconds = seconds * 60; // only hh:mm in t
        return seconds;
    }

    format_time(tt)
        {
        if (tt<0) t = tt+86400;
        else t = tt;
        h = Math.floor(t / 3600);
        m = Math.floor((t-(h*3600)) / 60);
        s = Math.floor(t - (h*3600) - (m*60));
        h = h % 24;
        hh = two_digits(h);
        mm = two_digits(m);
        ss = two_digits(s);
        return hh+":"+mm+":"+ss;
        }

    split(s,c)  // divide string s by character c into array a
    {                  // replacement for JavaScript 1.1 s.split(",");
        var i=0, j, elem=0;
        this.splits = new Array;
        while (i<s.length)
        {
            j = s.indexOf(c,i);
            if (j<0) j = s.length;
            this.splits[elem] = s.substring(i,j);
            elem = elem + 1;
            i = j+1;
        }
    }
}

