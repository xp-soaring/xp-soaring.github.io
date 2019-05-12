<!--
 var localDate = new Date();
 var localTime = localDate.getTime();
 var UTCoffset = localDate.getTimezoneOffset();
 var UTCTime = localTime + (UTCoffset * 60 * 1000);
 var UTCDate = new Date(UTCTime);
 var debug = 3;

function getMilliSecOffset(offset) {
 return UTCDate.getTime() + (offset * 60 * 60 * 1000);
}

function formatNum(theNum) {
 if (theNum < 10)
  return "0"+theNum;
 else return theNum;
}

function DayLightSaving(beginMonth, beginSunday, endMonth, endSunday) {
 this.beginMonth = beginMonth;
 this.beginSunday = beginSunday;
 this.endMonth = endMonth;
 this.endSunday = endSunday;
}

function CityObj(cityName, cityOffset, cityDST, cityAcronym, citySelecter) {
 this.cityName = cityName;
 this.cityOffset = cityOffset;
 this.cityDST = cityDST;
 this.cityAcronym = cityAcronym;
 this.citySelecter = citySelecter;
}

function sundaySort(a, b) {
 return a - b;
}

function calculateDST(dstDate, dstObj) {
 var isDST = 1;
 var notDST = 0;

if (document.theForm.notoDST.checked) {return notDST;}

 var dstBeginMonth = dstObj.beginMonth;
 var dstEndMonth   = dstObj.endMonth;

 if (dstBeginMonth == -1) return notDST;

 if (dstBeginMonth > dstEndMonth) {
  var isDST = 0;
  var notDST = 1;
  dstBeginMonth = dstObj.endMonth;
  dstEndMonth = dstObj.beginMonth;
 }

 var dstMonth = dstDate.getMonth();
 var dstWeekDay = dstDate.getDay();
 var dstMonthDay = dstDate.getDate();
 var monthSundays = new Array();

 if (dstMonth > dstBeginMonth && dstMonth < dstEndMonth) return isDST;

 if ((dstMonth >= 0 && dstMonth < dstBeginMonth) || (dstMonth > dstEndMonth)) return notDST;

 var j = dstWeekDay;

 for (var i = dstMonthDay; i > 0; i--) {
  if (j == 0) { monthSundays.push(i); j = 6; }
  else { j--; }
 }

 var endOfMonth = 30;

 if (dstMonth == 0 || dstMonth == 2 || dstMonth == 4 || dstMonth == 6 ||
     dstMonth == 7 || dstMonth == 9 || dstMonth == 11) { endOfMonth = 31; }

 j = dstWeekDay;

 for (var i = dstMonthDay; i <= endOfMonth; i++) {
  if (j == 0) { monthSundays.push(i); }
  if (j == 6) { j = 0; }
  else { j++; }
 }

 monthSundays.sort(sundaySort);

 for (var k = 0; k < monthSundays.length; k++) {
  var mSun = monthSundays[k];
  if (dstMonth == dstBeginMonth) {

   if (dstObj.beginSunday == 1) {
    if (dstMonthDay >= mSun && k == 0) { return isDST; }
   }

   if (dstObj.beginSunday == 2) {
    if (dstMonthDay >= mSun && k == 1) { return isDST; }
   }

   if (dstObj.beginSunday == 5) {
    if (dstMonthDay >= mSun && k == (monthSundays.length -1)) { return isDST; }
   }
  }

  if (dstMonth == dstEndMonth) {
   if (dstObj.endSunday == 1) {
    if (dstMonthDay <= mSun && k == 0) { return isDST; }
   }

   if (dstObj.endSunday == 2) {
    if (dstMonthDay <= mSun && k == 1) { return isDST; }
   }

   if (dstObj.endSunday == 5) {
    if (dstMonthDay <= mSun && k == (monthSundays.length -1)) {
     return isDST;
    }
   }
  }
 } 

return notDST;
}

function HourObj(placeDate, DST) {
 var hour = placeDate.getHours();
 var DST_Inc = calculateDST(placeDate, DST);
 
 if (DST_Inc == 1) { this.isDST = 1; } 

 hour = hour + DST_Inc;

 if (hour == 24) { hour = 0; }

 
  this.hour = formatNum(hour);
  this.opt = "";
 
}

function writeItAll(theCityArray) {
 for(var i=0; i < theCityArray.length; i++) {
  document.write("<option value=" + theCityArray[i].cityAcronym + " " + theCityArray[i].citySelecter + ">" + theCityArray[i].cityName + "</option>");
 }
}

// -- Start Comment
// to make setTimeout parameters compatible with IE, tip taken from the Stchur Talks website.
// URL: http://ecmascript.stchur.com/2006/06/07/settimeout-revisited/

if (!window.sstchur) { window.sstchur = {}; }
if (!sstchur.web) { sstchur.web = {}; }
if (!sstchur.web.js) { sstchur.web.js = {}; }

sstchur.web.js.xb =
{
  setTimeout: function(fnPointer, ms)
  {
    var args = arguments;
    function proxy()
    {
      var params = new Array();
      var i;
      for (i = 2; i < args.length; i++)
        { params.push(args[i]); }

      fnPointer.apply(this, params);
    }

    return window.setTimeout(proxy, ms);
  }
};
// -- End Comment

function theOnLoadBody() {
 if (window.onload) document.theForm.reset();
     document.theForm.con_1.focus();
     document.theForm.con_2.focus();
     document.theForm.con_3.focus();
     document.theForm.con_4.focus();
     document.theForm.con_5.focus();
     document.theForm.con_5.blur();
}

function citySelect(drop, cityArray, id) {
 var city = drop.options[drop.selectedIndex].value;

 if (city != "< Choose City >") {
  for (var i=0; i < cityArray.length; i++) {
   if (city == cityArray[i].cityAcronym) {
    //document.theForm.elements[id].value = displayDate(cityArray[i]);
    document.getElementById(id).value = displayDate(cityArray[i]);
    if (document.all) {
     window.sstchur.web.js.xb.setTimeout(citySelect, 1000, drop, cityArray, id);
    }
    else { window.setTimeout(citySelect, 1000, drop, cityArray, id); }
   }
  }
 }
  else {document.theForm.elements[id].value = "00:00:00";}
}

function displayDate(theCity) {
 localDate = new Date();
 localTime = localDate.getTime();
 UTCoffset = localDate.getTimezoneOffset();
 UTCTime = localTime + (UTCoffset * 60 * 1000);
 UTCDate = new Date(UTCTime);

 var theDST = theCity.cityDST;
 var theDate = new Date(getMilliSecOffset(theCity.cityOffset));
 var hourDisp = new HourObj(theDate, theDST);

 var dispDT = hourDisp.hour;
 dispDT += ":";
 dispDT += formatNum(theDate.getMinutes());
 dispDT += ":";
 dispDT += formatNum(theDate.getSeconds());
 
 if (hourDisp.isDST == 1) { dispDT += "+"; }
return dispDT;
}

function theCal() {
 var month1 = new Array("January","February","March","April","May","June","July","August","September","October","November","December")
 var today1 = new Date();
 var date1 = today1.getDate();
 var month1 = (month1[today1.getMonth()]);
 var year1 = (today1.getFullYear());
 document.write(month1 + "&nbsp;" + date1 + ", " + year1); }

function formatTime() {
 var now = new Date();
 var hour = now.getHours();
 var min = now.getMinutes();
 var sec = now.getSeconds();

 //if (document.theForm.hourChoice[0].checked) {
 //  if (min <= 9) { min = "0" + min; }
 //  if (sec <= 9) { sec = "0" + sec; }
 //  if (hour > 12) { hour = hour - 12; var add = " PM"; }
 //  else { hour = hour; add = " AM"; }
 //  if (hour == 12) { add = " PM"; }
 //  if (hour == 00) { hour = "12"; }
 // document.theForm.theLocal.value = ((hour<=9) ? "0" + hour : hour) + ":" + min + ":" + sec + add;
 //}

 //if (document.theForm.hourChoice[1].checked) {
   if (min <= 9) { min = "0" + min; }
   if (sec <= 9) { sec = "0" + sec; }
   if (hour < 10) { hour = "0" + hour; }
  document.theForm.theLocal.value = hour + ':' + min + ':' + sec;
 //}
setTimeout("formatTime()", 1000);
}
//-->