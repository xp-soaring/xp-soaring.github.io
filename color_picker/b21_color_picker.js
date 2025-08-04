"use strict"

class B21Picker {
    constructor() {
        const p = this;

        p.VERSION = "1.0";

        p.rgba = { r: 255, g: 142, b: 123, a: 0.8 };
        p.brightness_adj = 0; // -1 .. 0 .. +1
        p.wheel_rgb = { r: p.rgba.r, g: p.rgba.g, b: p.rgba.b };

        // Get the element references
        p.wheel_el = document.getElementById("wheel");
        p.wheel_chooser_el = document.getElementById("wheel_chooser");
        p.color_box_el = document.getElementById("clipboard_color_box");
        p.rgb_value_el = document.getElementById("clipboard_rgb_value");
        p.hex_value_el = document.getElementById("clipboard_hex_value");
        p.brightness_slider_el = document.getElementById("brightness_slider");
        p.brightness_chooser_el = document.getElementById("brightness_chooser");
        p.brightness_dark_el = document.getElementById("brightness_bg_dark");
        p.brightness_light_el = document.getElementById("brightness_bg_light");
        p.brightness_chooser_width_percent =
            100 * p.brightness_chooser_el.getBoundingClientRect().width /
            p.brightness_slider_el.getBoundingClientRect().width;
        // Color wheel canvas context
        p.ctx = p.wheel_el.getContext('2d', { willReadFrequently: true });

        p.wheel_width_px = p.wheel_el.offsetWidth;
        p.wheel_height_px = p.wheel_el.offsetHeight;
        p.wheel_chooser_width_px = p.wheel_chooser_el.offsetWidth;
        p.wheel_chooser_height_px = p.wheel_chooser_el.offsetHeight;

        // Capture mouse events for color wheel
        p.wheel_el.addEventListener("mousedown", (e) => { p.wheel_mousedown(e); });
        p.wheel_el.addEventListener("mouseup", (e) => { p.wheel_mouseup(e); });
        p.wheel_el.addEventListener("mousemove", (e) => { p.wheel_mousemove(e); });
        //p.wheel_el.addEventListener("mouseout", (e) => { p.mouseup(e); });
        p.wheel_drag = false;

        // Capture mouse events for brightness chooser
        p.brightness_slider_el.addEventListener("mousedown", (e) => { p.brightness_mousedown(e); });
        p.brightness_slider_el.addEventListener("mouseup", (e) => { p.brightness_mouseup(e); });
        p.brightness_slider_el.addEventListener("mousemove", (e) => { p.brightness_mousemove(e); });
        p.brightness_slider_el.addEventListener("mouseout", (e) => { p.brightness_mouseout(e); });
        //p.wheel_el.addEventListener("mouseout", (e) => { p.mouseup(e); });
        p.brightness_drag = false;

        // Events for rgb / hex clipboard
        p.hex_value_el.addEventListener("input", (e) => { p.hex_value_change(p, p.hex_value_el.value); })
        document.getElementById("copy_rgb").addEventListener("click", (e) => { p.copy_rgb(); })
        document.getElementById("copy_hex").addEventListener("click", (e) => { p.copy_hex(); })

        p.draw_wheel();

        p.set_wheel(p.rgba);
        p.set_brightness_chooser(p.brightness_adj);
    }

    // *****************************************************
    // COLOR WHEEL CONTROL
    // *****************************************************

    wheel_mousedown(e) {
        const p = this;
        //console.log(`mousedown at ${e.offsetX.toFixed(0)},${e.offsetY.toFixed(0)}`);
        p.wheel_drag = true;
        p.wheel_mousemove(e);
    }

    wheel_mouseup(e) {
        const p = this;
        //console.log(`mouseup at ${e.offsetX.toFixed(0)},${e.offsetY.toFixed(0)}`);
        p.wheel_drag = false;
        p.set_brightness_chooser(p.brightness_adj);
    }

    wheel_mousemove(e) {
        const p = this;
        //console.log(`mousemove at ${e.offsetX.toFixed(0)},${e.offsetY.toFixed(0)}`);
        e.preventDefault();
        const x = e.offsetX/p.wheel_width_px;
        const y = e.offsetY/p.wheel_height_px;
        const d = Math.sqrt(Math.pow(x-0.5,2)+Math.pow(y-0.5,2));
        if (p.wheel_drag && d < 0.495) { // check move is within color circle
            //console.log(`mouse ${e.offsetX},${e.offsetY}`);
            const px_colors = p.ctx.getImageData(e.offsetX, e.offsetY, 1, 1).data;
            p.wheel_rgb = {r: px_colors[0], g: px_colors[1], b: px_colors[2]};
            //p.brightness_adj = 0;
            const adj_rgb = p.brightness_adjust_rgb(p.wheel_rgb, p.brightness_adj);
            p.rgba.r = adj_rgb.r;
            p.rgba.g = adj_rgb.g;
            p.rgba.b = adj_rgb.b;
            p.set_wheel(p.rgba);
        }
    }

    set_wheel(rgba) {
        const p = this;
        p.set_wheel_chooser(p.wheel_rgb);
        p.set_brightness_background(p.wheel_rgb);
        //let hsv = p.rgb2hsv(rgba);
        //p.set_brightness_chooser(hsv.v);
        p.set_clipboard_values(rgba);
    }

    set_wheel_chooser(rgba) {
        const p = this;
        const xy = p.rgb2xy(rgba);
        const x_px = xy[0] * p.wheel_width_px;
        const y_px = xy[1] * p.wheel_height_px;
        const draw_x = x_px - p.wheel_chooser_width_px / 2;
        const draw_y = y_px - p.wheel_chooser_height_px / 2;
        p.wheel_chooser_el.style.left = `${draw_x.toFixed(1)}px`;
        p.wheel_chooser_el.style.top = `${draw_y.toFixed(1)}px`;
        const rgb = p.contrast_rgb(rgba);
        p.wheel_chooser_el.style.borderColor = `rgb(${rgb.r.toFixed(0)},${rgb.g.toFixed(0)},${rgb.b.toFixed(0)})`;
    }

    // **************************************************
    // COLOR BOX AND CLIPBOARD TEXT VALUES
    // **************************************************

    set_clipboard_values(rgba) {
        const p = this;
        p.set_color_box(rgba);
        p.set_rgb_text(rgba);
        p.set_hex_text(rgba);
    }

    set_color_box(rgb) {
        const p = this;
        const css_color = `rgb(${rgb.r.toFixed(0)},${rgb.g.toFixed(0)},${rgb.b.toFixed(0)})`;
        p.color_box_el.style.backgroundColor = css_color;
        console.log(`set_color_box ${css_color}`);
    }

    set_rgb_text(rgb) {
        const p = this;
        const css_color = `rgb(${rgb.r.toFixed(0)},${rgb.g.toFixed(0)},${rgb.b.toFixed(0)})`;
        p.rgb_value_el.innerText = css_color;
    }

    hex_value_change(p, hex_value) {
        let rgba = p.hex2rgba(hex_value);
        if (rgba != null) {
            console.log(`hex_value_change '${hex_value}'`);
            p.set_color_box(rgba);
            p.set_rgb_text(rgba);
            let hsv = p.rgb2hsv(rgba);
            hsv.v = 1;
            p.wheel_rgb = p.hsv2rgb(hsv);
            p.set_wheel_chooser(p.wheel_rgb);
            p.set_brightness_background(p.wheel_rgb);
            const max_pixel = Math.max(Math.max(rgba.r, rgba.g),rgba.b);
            p.brightness_adj = max_pixel >= 255 ? 0 : -(1-max_pixel/255);
            p.set_brightness_chooser(p.brightness_adj);
        }
    }

    //DEBUG will need similar rgb_value_change for cut/paste

    set_hex_text(rgb) {
        const p = this;
        p.hex_value_el.value = p.get_hex_str(rgb);
    }

    get_hex_str(rgb) {
        const p = this;
        let hex_str = "#";
        hex_str += ("0"+Math.round(rgb.r).toString(16).toUpperCase()).slice(-2);
        hex_str += ("0"+Math.round(rgb.g).toString(16).toUpperCase()).slice(-2);
        hex_str += ("0"+Math.round(rgb.b).toString(16).toUpperCase()).slice(-2);
        return hex_str;
    }

    copy_rgb() {
        navigator.clipboard.writeText(p.rgb_value_el.innerText).then(
            () => { console.log("rgb to clipboard"); },
            () => { console.log("rgb to clipboard failed")
        });
    }

    copy_hex() {
        navigator.clipboard.writeText(p.hex_value_el.innerText).then(
            () => { console.log("rgb to clipboard"); },
            () => { console.log("rgb to clipboard failed")
        });
    }

    // **********************************************
    // BRIGHTNESS CONTROL
    // **********************************************

    brightness_mousedown(e) { //DEBUG we can freeze hue/saturation while drag & use those
        const p = this;
        //console.log(`brightness down at ${e.offsetX},${e.offsetY}`);
        p.brightness_drag = true;
        p.brightness_mousemove(e);
    }

    brightness_mouseup(e) {
        const p = this;
        //console.log("brightness up");
        p.brightness_drag = false;
    }

    brightness_mouseout(e) {
        const p = this;
        //console.log("brightness out");
        //p.brightness_drag = false;
    }

    brightness_mousemove(e) {
        const p = this;
        //console.log("brightness move");
        if (p.brightness_drag) {
            let slider_ratio = e.offsetX / p.brightness_slider_el.clientWidth;
            p.brightness_adj = 2 * (slider_ratio - 0.5);
            p.set_brightness_chooser(p.brightness_adj);
            const rgb = p.brightness_adjust_rgb(p.wheel_rgb, p.brightness_adj);
            p.rgba.r = rgb.r;
            p.rgba.g = rgb.g;
            p.rgba.b = rgb.b;
            p.set_clipboard_values(p.rgba);
        }
    }

    brightness_adjust_rgb(rgba, brightness_adj) {
        const p = this;

        //console.log(`brightness_adj: ${p.brightness_adj.toFixed(2)} wheel_rgb: ${JSON.stringify(wheel_rgb)}`);
        const r = p.wheel_rgb.r;
        const g = p.wheel_rgb.g;
        const b = p.wheel_rgb.b;
        if (brightness_adj > 0) {
            return { r: r + brightness_adj * (255 - r),
                     g: g + brightness_adj * (255 - g),
                     b: b + brightness_adj * (255 - b),
                     a: rgba.a
            }
        } else {
            return { r: r * (1 + brightness_adj),
                     g: g * (1 + brightness_adj),
                     b: b * (1 + brightness_adj),
                     a: rgba.a
            }
        }
    }

    set_brightness(rgba) { //DEBUG incomplete
        const p = this;
        let hsv = p.rgb2hsv(rgba);
    }

    set_brightness_background(wheel_rgb) {
        const p = this;
        let color_hex = p.get_hex_str(wheel_rgb);
        p.brightness_dark_el.style.background = `linear-gradient(90deg,#000,${color_hex})`;
        p.brightness_light_el.style.background = `linear-gradient(90deg,${color_hex},#FFF)`;
    }

    set_brightness_chooser(brightness_adj) {
        const p = this;
        const offset_percent = p.brightness_chooser_width_percent / 2;
        p.brightness_chooser_el.style.left = (50 + brightness_adj*50-offset_percent).toFixed(1) + "%";
    }

    // ********************************************
    // Draw the HSV color wheel on startup
    // ********************************************

    draw_wheel() {
        const p = this;
        let radius = 256;
        let image = p.ctx.createImageData(2*radius, 2*radius);
        let data = image.data;

        for (let x = -radius; x < radius; x++) {
            for (let y = -radius; y < radius; y++) {

                let [r, phi] = p.xy2polar(x, y);

                if (r > radius) {
                    // skip all (x,y) coordinates that are outside of the circle
                    continue;
                }

                let deg = p.rad2deg(phi);

                // Figure out the starting index of this pixel in the image data array.
                let rowLength = 2*radius;
                let adjustedX = x + radius; // convert x from [-50, 50] to [0, 100] (the coordinates of the image data array)
                let adjustedY = y + radius; // convert y from [-50, 50] to [0, 100] (the coordinates of the image data array)
                let pixelWidth = 4; // each pixel requires 4 slots in the data array
                let index = (adjustedX + (adjustedY * rowLength)) * pixelWidth;

                let hue = deg;
                let saturation = r / radius;
                let value = 1.0;

                let rgb = p.hsv2rgb({ h:hue, s:saturation, v:value });
                let alpha = 255;

                data[index] = Math.round(rgb.r);
                data[index+1] = Math.round(rgb.g);
                data[index+2] = Math.round(rgb.b);
                data[index+3] = alpha;
            }
        }
        p.ctx.putImageData(image, 0, 0);
    }

    // [#]RGB[A] or [#]RRGGBBAA
    // Returns { r: 0..255, g: 0..255, b: 0..255, a: 0..1 }
    // Returns null if invalid color hex
    hex2rgba(hex_str) {
        let s = hex_str;
        if (s.startsWith("#")) {
            s = s.slice(1);
        }
        let r = null;
        let g = null;
        let b = null;
        let a = 1;
        if (s.length == 3) {
            r = Number("0x" + s.slice(0, 1) + s.slice(0, 1));
            g = Number("0x" + s.slice(1, 2) + s.slice(1, 2));
            b = Number("0x" + s.slice(2, 3) + s.slice(2, 3));
        } else if (s.length == 6) {
            r = Number("0x" + s.slice(0, 2));
            g = Number("0x" + s.slice(2, 4));
            b = Number("0x" + s.slice(4, 6));
        } else if (s.length == 8) {
            r = Number("0x" + s.slice(0, 2));
            g = Number("0x" + s.slice(2, 4));
            b = Number("0x" + s.slice(4, 6));
            a = Number("0x" + s.slice(6, 8)) / 255;
        } else {
            return null;
        }
        if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
            return null;
        }
        return { r: r, g: g, b: b, a: a };
    }

    // [x,y] are 0..1 for proportion of width/height
    rgb2xy(rgb) {
        const p = this;
        let hsv = p.rgb2hsv(rgb);
        return p.hsv2xy(hsv);
    }

    // [x,y] are 0..1 for proportion of width/height
    xy2polar(x,y) {
        let r = Math.sqrt(x*x + y*y);
        let rad = Math.atan2(y, x);
        return [r, rad];
    }

    // h = deg from west, s = 0..1 proportion of wheel radius
    // [x,y] 0..1 proportion of wheel width, height
    hsv2xy(hsv) {
        const p = this;
        let x = 0.5 - hsv.s * Math.cos(p.deg2rad(hsv.h)) / 2;
        let y = 0.5 - hsv.s * Math.sin(p.deg2rad(hsv.h)) / 2;
        return [x,y];
    }

    // rad in [-π, π] range
    // return degree in [0, 360] range
    rad2deg(rad) {
        return ((rad + Math.PI) / (2 * Math.PI)) * 360;
    }

    deg2rad(deg) {
        return deg / 360 * 2 * Math.PI;
    }

    // hue in range [0, 360]
    // saturation in range [0,1]
    // value in range [0,1]
    // return [r,g,b] each in range [0,255]
    // See: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
    hsv2rgb(hsv) {
        let chroma = hsv.v * hsv.s;
        let hue1 = hsv.h / 60;
        let x = chroma * (1- Math.abs((hue1 % 2) - 1));
        let r1, g1, b1;
        if (hue1 >= 0 && hue1 <= 1) {
            ([r1, g1, b1] = [chroma, x, 0]);
        } else if (hue1 >= 1 && hue1 <= 2) {
            ([r1, g1, b1] = [x, chroma, 0]);
        } else if (hue1 >= 2 && hue1 <= 3) {
            ([r1, g1, b1] = [0, chroma, x]);
        } else if (hue1 >= 3 && hue1 <= 4) {
            ([r1, g1, b1] = [0, x, chroma]);
        } else if (hue1 >= 4 && hue1 <= 5) {
            ([r1, g1, b1] = [x, 0, chroma]);
        } else if (hue1 >= 5 && hue1 <= 6) {
            ([r1, g1, b1] = [chroma, 0, x]);
        }

        let m = hsv.v - chroma;
        let [r,g,b] = [r1+m, g1+m, b1+m];

        // Change r,g,b values from [0,1] to [0,255]
        return { r: 255*r, g: 255*g, b: 255*b };
    }

    // {r:,g:,b:} 0..255
    // {h:,s:,v:} hue 0..360, saturation 0..1, value 0..1
    rgb2hsv(rgb) {
        let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
        rabs = rgb.r / 255;
        gabs = rgb.g / 255;
        babs = rgb.b / 255;
        v = Math.max(rabs, gabs, babs),
        diff = v - Math.min(rabs, gabs, babs);
        diffc = c => (v - c) / 6 / diff + 1 / 2;
        if (diff == 0) {
            h = s = 0;
        } else {
            s = diff / v;
            rr = diffc(rabs);
            gg = diffc(gabs);
            bb = diffc(babs);

            if (rabs === v) {
                h = bb - gg;
            } else if (gabs === v) {
                h = (1 / 3) + rr - bb;
            } else if (babs === v) {
                h = (2 / 3) + gg - rr;
            }
            if (h < 0) {
                h += 1;
            }else if (h > 1) {
                h -= 1;
            }
        }
        return {
            h: h*360,
            s: s,
            v: v
        };
    }

    contrast_rgb(rgba) {
        const p = this;
        return { r:0, g:0, b:0 };
    }
} // end B21Picker
