
/*
Copyright 2005-2014 skyvector.com. All Rights reserved.
You may not use this script for any purpose without permission.
*/

class SkyVector {
    constructor() {
        this.displayed = false;
        this.skyvector_el = document.getElementById("skyvector");
        this.panes_el = document.getElementById("panes");
    }

    show() {
        console.log("skyvector show");
        this.panes_el.style.display = "none";
        this.skyvector_el.style.display = "block";
        this.displayed = true;
        // skyvector.com/api/lchart?ll=51.895915820386826,-0.4709243662084289&amp;s=2&amp;c=sv_2188&amp;i=301
        //    'sv_2188',2108,301,2,261458.17,173426.17,'',51.895915820386826,-0.4709243662084289,0
        // UP 'sv_6299',2108,301,2,261536.50,163456.17,'',55.92452168149039, -0.41713713475972314,0
        // R  'sv_3892',2108,301,5,281685.00,162327.00,'',56.35650152492169, 13.417739880273546,0
        // UK 'sv_8931',2108,301,5,261824.50,172432.00,'',52.31519525987094, -0.2193832284971959,0)
        // Au 'skyveor',2108,301,4,279511.67,183704.00,'',47.32765399027703, 11.925430309866858,0)
        this.init('skyvector_map',2108,301,4,279511.67,183704.00,'',47.259855041306345,11.393686700507038,0);
    }

    hide() {
        console.log("skyvector hide");
        this.panes_el.style.display = "block";
        this.skyvector_el.style.display = "none";
        this.displayed = false;
    }

    toggle() {
        if (this.displayed) {
            this.hide();
        } else {
            this.show();
        }
    }

    init(p_chart,setid,protoid,scale,posx,posy,target,lat,lon,scaleset){
        console.log("SkyVector init");
        var chart=false;
        var ratio = window.devicePixelRatio;
        if (!ratio) ratio = 1.0;
        var tilesize=256 / ratio;
        scale -= Math.round(2 * Math.LOG2E * Math.log(ratio));
        if (scale < 1) scale = 1;
        if (scaleset){
          var scalors = [.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048];
        }else{
          var scalors = [.5,1,4/3,2,8/3,4,16/3,8,32/3,16,64/3,32,128/3,64,256/3,128,512/3,256,1024/3,512,2048/3,1024,4096/3,2048];
        }
        posx = Math.round(posx/(scalors[scale]*ratio));
        posy = Math.round(posy/(scalors[scale]*ratio));

        chart=document.getElementById(p_chart);

        if(!(posx && posy && scale && protoid && setid)){
          return false;
        }

        var qs="?ll="+lat+","+lon+"&chart="+protoid+"&zoom="+scale;
        var vwidth=chart.clientWidth;
        var vheight=chart.clientHeight;
        if (!vwidth) vwidth=chart.style.pixelWidth;
        if (!vheight) vheight=chart.style.pixelHeight;
        if (!vwidth) vwidth=parseInt(chart.style.width);
        if (!vheight) vheight=parseInt(chart.style.height);
        if (!vwidth) vwidth=200;
        if (!vheight) vheight=200;

        var htiles=Math.ceil(vwidth/tilesize)+1;
        var vtiles=Math.ceil(vheight/tilesize)+1;
        if(isNaN(htiles) || htiles<2) htiles=2;
        if(isNaN(vtiles) || vtiles<2) vtiles=2;
        if (target){
          target=" target=\""+target+"\" ";
        }
        posx=Math.round(posx-(vwidth/2));
        posy=Math.round(posy-(vheight/2));

        var html = "<img style=\"margin: 0px; padding: 0px; border: none; position: absolute; z-index: 1; right: 0px; bottom: 0px; \" width=\"56\" height=\"13\" border=\"0\" src=\"https://skyvector.com/images/chart/skyvector_tiny.gif\" />";

        var otx=Math.floor(posx/tilesize);
        var oty=Math.floor(posy/tilesize);
        for (var i=0; i < vtiles; i++){
          var i2=i+oty;
          for (var j=0; j < htiles; j++){
             var j2=j+otx;
             var servermod=(j2+i2) % 2;
             if ("https:" == document.location.protocol) {
                var tileurl = "https://t.skyvector.com/e1097d3824e";
             }else{
                 var tileurl = "http://t"+servermod+".skyvector.net/e1097d3824e";
             }
             var tilename=protoid +"/"+ setid +"/" + scale + "/" + j2 + "/" + i2 + ".jpg";
             html += "<img style=\"padding: 0px; border: none; position: absolute; max-width: none; width: "+tilesize+"px; height: "+tilesize+"px; z-index: 0; top: "+(i2*tilesize - posy)+"px; left: "+(j2*tilesize -posx)+"px;\" border=\"0\" src=\""+tileurl + "/" + tilename + "\" />";
          }
        }

        chart.innerHTML=html;
    } // end init()

} // end class SkyVector
