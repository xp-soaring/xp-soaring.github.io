<!--
var No_DST = new DayLightSaving(-1, 1, -1, 5);
var USA_Canada_DST = new DayLightSaving(2, 2, 10, 1);
var Mexico_DST = new DayLightSaving(1, 3, 9, 5);
var UK_Europe_DST = new DayLightSaving(2, 5, 9, 5);
var Israel_DST = new DayLightSaving(2, 5, 8, 2);
var Russia_DST = new DayLightSaving(2, 5, 8, 1);
var Australia_DST = new DayLightSaving(9, 5, 2, 5);
var NewZealand_DST = new DayLightSaving(9, 5, 3, 1);

// -- To have the script show the time of any particular cities when it loads just type the words
// -- selected='selected' in the arrays below between the blank quotes for the chosen cities.
// -- Make sure this is done only for one city in each group. For example among the cities in Africa
// -- if you wish to see the time of Cairo when the page loads, modify the code like this:
// --   Africa_Cities_List[8] = new CityObj("Cairo", 2, UK_Europe_DST, "CAI", "selected='selected'");

// -- Begin Africa Cities
 var Africa_Cities_List = new Array();
  Africa_Cities_List[0] = new CityObj("Abidjan", 0, No_DST, "ABI", "");
  Africa_Cities_List[1] = new CityObj("Accra", 0, No_DST, "ACC", "");
  Africa_Cities_List[2] = new CityObj("Addis Ababa", 3, No_DST, "ADA", "");
  Africa_Cities_List[3] = new CityObj("Algiers", 1, UK_Europe_DST, "ALJ", "");
  Africa_Cities_List[4] = new CityObj("Antananarivo", 3, No_DST, "ANT", "");
  Africa_Cities_List[5] = new CityObj("Bamako", 0, No_DST, "BAM", "");
  Africa_Cities_List[6] = new CityObj("Benin City", 1, No_DST, "BEN", "");
  Africa_Cities_List[7] = new CityObj("Bloemfontein", 2, No_DST, "BLO", "");
  Africa_Cities_List[8] = new CityObj("Cairo", 2, UK_Europe_DST, "CAI", "");
  Africa_Cities_List[9] = new CityObj("Cape Town", 2, No_DST, "CTC", "");
  Africa_Cities_List[10] = new CityObj("Dakar", 0, No_DST, "DAK", "");
  Africa_Cities_List[11] = new CityObj("Dar-Es-Salaam", 3, No_DST, "DAR", "");
  Africa_Cities_List[12] = new CityObj("Durban", 2, No_DST, "DUR", "");
  Africa_Cities_List[13] = new CityObj("Freetown", 0, No_DST, "FRE", "");
  Africa_Cities_List[14] = new CityObj("Harare", 2, No_DST, "HAR", "");
  Africa_Cities_List[15] = new CityObj("Johannesburg", 2, No_DST, "JOH", "");
  Africa_Cities_List[16] = new CityObj("Kampala", 3, No_DST, "KAM", "");
  Africa_Cities_List[17] = new CityObj("Khartoum", 2, No_DST, "KAR", "");
  Africa_Cities_List[18] = new CityObj("Kinshasa", 1, No_DST, "KIN", "");
  Africa_Cities_List[19] = new CityObj("Luanda", 2, No_DST, "LUA", "");
  Africa_Cities_List[20] = new CityObj("Maputo", 2, No_DST, "MAP", "");
  Africa_Cities_List[21] = new CityObj("Mbala", 2, No_DST, "MBA", "");
  Africa_Cities_List[22] = new CityObj("Monrovia", 0, No_DST, "MON", "");
  Africa_Cities_List[23] = new CityObj("Ndjamena", 1, No_DST, "NDJ", "");
  Africa_Cities_List[24] = new CityObj("Pointe Noire", 1, No_DST, "PNO", "");
  Africa_Cities_List[25] = new CityObj("Port Elizabeth", 2, No_DST, "POE", "");
  Africa_Cities_List[26] = new CityObj("Pretoria", 2, No_DST, "PRE", "");
  Africa_Cities_List[27] = new CityObj("Rabat", 0, No_DST, "RBT", "");
  Africa_Cities_List[28] = new CityObj("Tripoli", 1, No_DST, "TRI", "");
  Africa_Cities_List[29] = new CityObj("Tsumeb", 2, No_DST, "TSU", "");
//-- End Africa Cities

// -- Begin Americas Cities
 var Americas_Cities_List = new Array();
  Americas_Cities_List[0] = new CityObj("Atlanta", -5, USA_Canada_DST, "ATL", "");
  Americas_Cities_List[1] = new CityObj("Belize City", -6, No_DST, "BLZ", "");
  Americas_Cities_List[2] = new CityObj("Bogota", -5, No_DST, "BGT", "");
  Americas_Cities_List[3] = new CityObj("Boston", -5, USA_Canada_DST, "BSN", "");
  Americas_Cities_List[4] = new CityObj("Bridgetown", -4, No_DST, "BRD", "");
  Americas_Cities_List[5] = new CityObj("Buenos Aires", -3, No_DST, "BUA", "");
  Americas_Cities_List[6] = new CityObj("Caracas", -4, No_DST, "CAA", "");
  Americas_Cities_List[7] = new CityObj("Chicago", -6, USA_Canada_DST, "CHJ", "");
  Americas_Cities_List[8] = new CityObj("Cincinnati", -5, USA_Canada_DST, "CNN", "");
  Americas_Cities_List[9] = new CityObj("Columbia", -5, USA_Canada_DST, "CUA", "");
  Americas_Cities_List[10] = new CityObj("Dallas", -6, USA_Canada_DST, "DAL", "");
  Americas_Cities_List[11] = new CityObj("Denver", -7, USA_Canada_DST, "DNV", "");
  Americas_Cities_List[12] = new CityObj("Detroit", -5, USA_Canada_DST, "DTR", "");
  Americas_Cities_List[13] = new CityObj("Georgetown", -4, No_DST, "GGT", "");
  Americas_Cities_List[14] = new CityObj("Guatemala City", -6, No_DST, "GTL", "");
  Americas_Cities_List[15] = new CityObj("Havana", -5, USA_Canada_DST, "HAA", "");
  Americas_Cities_List[16] = new CityObj("Honolulu", -10, No_DST, "HLL", "");
  Americas_Cities_List[17] = new CityObj("Indianapolis", -5, USA_Canada_DST, "IDP", "");
  Americas_Cities_List[18] = new CityObj("Jacksonville", -5, USA_Canada_DST, "JKV", "");
  Americas_Cities_List[19] = new CityObj("Kansas City", -6, USA_Canada_DST, "KNC", "");
  Americas_Cities_List[20] = new CityObj("Jamaica", -5, USA_Canada_DST, "JMC", "");
  Americas_Cities_List[21] = new CityObj("La Paz", -6, Mexico_DST, "LPZ", "");
  Americas_Cities_List[22] = new CityObj("Las Vegas", -8, USA_Canada_DST, "LVS", "");
  Americas_Cities_List[23] = new CityObj("Lima", -5, No_DST, "LMA", "");
  Americas_Cities_List[24] = new CityObj("Los Angeles", -8, USA_Canada_DST, "LAC", "");
  Americas_Cities_List[25] = new CityObj("Managua", -6, No_DST, "MNG", "");
  Americas_Cities_List[26] = new CityObj("Mexico City", -6, Mexico_DST, "MXC", "");
  Americas_Cities_List[27] = new CityObj("Miami", -5, USA_Canada_DST, "MII", "");
  Americas_Cities_List[28] = new CityObj("Montevideo", -3, No_DST, "MVO", "");
  Americas_Cities_List[29] = new CityObj("New Orleans", -6, USA_Canada_DST, "NOR", "");
  Americas_Cities_List[30] = new CityObj("New York", -5, USA_Canada_DST, "NYC", "");
  Americas_Cities_List[31] = new CityObj("Oklahoma City", -6, USA_Canada_DST, "OKH", "");
  Americas_Cities_List[32] = new CityObj("Omaha City", -6, USA_Canada_DST, "OMH", "");
  Americas_Cities_List[33] = new CityObj("Orlando", -5, USA_Canada_DST, "OLD", "");
  Americas_Cities_List[34] = new CityObj("Panamá", -5, No_DST, "PNM", "");
  Americas_Cities_List[35] = new CityObj("Philadelphia", -5, USA_Canada_DST, "PHL", "");
  Americas_Cities_List[36] = new CityObj("Pittsburgh", -5, USA_Canada_DST, "PTT", "");
  Americas_Cities_List[37] = new CityObj("Port of Spain", -4, No_DST, "PFN", "");
  Americas_Cities_List[38] = new CityObj("Quito", -5, No_DST, "QTO", "");
  Americas_Cities_List[39] = new CityObj("Rio de Janeiro", -3, No_DST, "RJR", "");
  Americas_Cities_List[40] = new CityObj("San Jose", -6, No_DST, "SNJ", "");
  Americas_Cities_List[41] = new CityObj("Salt Lake City", -7, USA_Canada_DST, "SLC", "");
  Americas_Cities_List[42] = new CityObj("San Diego", -8, USA_Canada_DST, "SDE", "");
  Americas_Cities_List[43] = new CityObj("San Francisco", -8, USA_Canada_DST, "SFC", "");
  Americas_Cities_List[44] = new CityObj("San Juan", -4, USA_Canada_DST, "SJA", "");
  Americas_Cities_List[45] = new CityObj("Sao Paulo", -3, No_DST, "SPO", "");
  Americas_Cities_List[46] = new CityObj("Santiago", -4, No_DST, "STG", "");
  Americas_Cities_List[47] = new CityObj("Santo Domingo", -4, No_DST, "STD", "");
  Americas_Cities_List[48] = new CityObj("San Salvador", -6, No_DST, "SSD", "");
  Americas_Cities_List[49] = new CityObj("Washington", -5, USA_Canada_DST, "WHC", "");
// -- End Americas Cities

// -- Begin Asia Cities
 var Asia_Cities_List = new Array();
  Asia_Cities_List[0] = new CityObj("Almaty", 7, Russia_DST, "AMT", "");
  Asia_Cities_List[1] = new CityObj("Amman", 2, UK_Europe_DST, "AMM", "");
  Asia_Cities_List[2] = new CityObj("Ankara", 2, UK_Europe_DST, "AKA", "");
  Asia_Cities_List[3] = new CityObj("Ashkhabad", 5, No_DST, "AHH", "");
  Asia_Cities_List[4] = new CityObj("Baghdad", 4, No_DST, "BDD", "");
  Asia_Cities_List[5] = new CityObj("Baku", 4, UK_Europe_DST, "BKU", "");
  Asia_Cities_List[6] = new CityObj("Bangkok", 7, No_DST, "BKK", "");
  Asia_Cities_List[7] = new CityObj("Beijing", 8, No_DST, "BJG", "");
  Asia_Cities_List[8] = new CityObj("Beirut", 2, UK_Europe_DST, "BRU", "");
  Asia_Cities_List[9] = new CityObj("Colombo", 5.5, No_DST, "CLB", "");
  Asia_Cities_List[10] = new CityObj("Delhi", 5.5, No_DST, "DLH", "");
  Asia_Cities_List[11] = new CityObj("Dhaka", 6, No_DST, "DHK", "");
  Asia_Cities_List[12] = new CityObj("Doha", 3, No_DST, "DOA", "");
  Asia_Cities_List[13] = new CityObj("Dubai", 4, No_DST, "DBI", "");
  Asia_Cities_List[14] = new CityObj("Halab", 2, No_DST, "HLB", "");
  Asia_Cities_List[15] = new CityObj("Hanoi", 7, No_DST, "HNI", "");
  Asia_Cities_List[16] = new CityObj("Hong Kong", 8, No_DST, "HKC", "");
  Asia_Cities_List[17] = new CityObj("Jakarta", 7, No_DST, "JKT", "");
  Asia_Cities_List[18] = new CityObj("Jerusalem", 2, Israel_DST, "JSM", "");
  Asia_Cities_List[19] = new CityObj("Kabul", 4.5, No_DST, "KBL", "");
  Asia_Cities_List[20] = new CityObj("Karachi", 5, No_DST, "KRH", "");
  Asia_Cities_List[21] = new CityObj("Kathmandu", 5.75, No_DST, "KHD", "");
  Asia_Cities_List[22] = new CityObj("Kuala Lumpur", 8, No_DST, "KLP", "");
  Asia_Cities_List[23] = new CityObj("Kuwait City", 3, No_DST, "KWT", "");
  Asia_Cities_List[24] = new CityObj("Kyoto", 9, No_DST, "KYO", "");
  Asia_Cities_List[25] = new CityObj("Male", 5, No_DST, "MLE", "");
  Asia_Cities_List[26] = new CityObj("Manama", 3, No_DST, "MAA", "");
  Asia_Cities_List[27] = new CityObj("Manila", 8, No_DST, "MNA", "");
  Asia_Cities_List[28] = new CityObj("Mumbai", 5.5, No_DST, "MUM", "");
  Asia_Cities_List[29] = new CityObj("Muscat", 3, UK_Europe_DST, "MST", "");
  Asia_Cities_List[30] = new CityObj("Port Louis", 4, No_DST, "PRL", "");
  Asia_Cities_List[31] = new CityObj("Riyadh", 3, No_DST, "RYH", "");
  Asia_Cities_List[32] = new CityObj("Sana'a", 3, No_DST, "SNA", "");
  Asia_Cities_List[33] = new CityObj("Seoul", 9, No_DST, "SEO", "");
  Asia_Cities_List[34] = new CityObj("Shanghai", 8, No_DST, "SHG", "");
  Asia_Cities_List[35] = new CityObj("Singapore", 8, No_DST, "SGP", "");
  Asia_Cities_List[36] = new CityObj("Taipei", 8, No_DST, "TPI", "");
  Asia_Cities_List[37] = new CityObj("Teheran", 2, No_DST, "THR", "");
  Asia_Cities_List[38] = new CityObj("Tel Aviv", 2, Israel_DST, "TVV", "");
  Asia_Cities_List[39] = new CityObj("Tokyo", 9, No_DST, "TKY", "");
// -- End Asia Cities

// -- Begin Australasia Cities
 var Australasia_Cities_List = new Array();
  Australasia_Cities_List[0] = new CityObj("Adelaide", 9.5, Australia_DST, "ADE", "");
  Australasia_Cities_List[1] = new CityObj("Alice Springs", 9.5, Australia_DST, "ALS", "");
  Australasia_Cities_List[2] = new CityObj("Aspley", 10, No_DST, "ASP", "");
  Australasia_Cities_List[3] = new CityObj("Auckland", 12, NewZealand_DST, "AUC", "");
  Australasia_Cities_List[4] = new CityObj("Bridgetown", 8, Australia_DST, "BRT", "");
  Australasia_Cities_List[5] = new CityObj("Brisbane", 10, No_DST, "BRI", "");
  Australasia_Cities_List[6] = new CityObj("Canberra", 10, Australia_DST, "CAN", "");
  Australasia_Cities_List[7] = new CityObj("Christchurch", 12, NewZealand_DST, "CHR", "");
  Australasia_Cities_List[8] = new CityObj("Darwin", 9.5, Australia_DST, "DRW", "");
  Australasia_Cities_List[9] = new CityObj("Derby", 8, Australia_DST, "DRB", "");
  Australasia_Cities_List[10] = new CityObj("Hobart", 10, Australia_DST, "HBT", "");
  Australasia_Cities_List[11] = new CityObj("Melbourne", 10, Australia_DST, "MEL", "");
  Australasia_Cities_List[12] = new CityObj("Perth", 8, No_DST, "PER", "");
  Australasia_Cities_List[13] = new CityObj("Port Augusta", 9.5, Australia_DST, "PTA", "");
  Australasia_Cities_List[14] = new CityObj("Rockhampton", 10, No_DST, "RCH", "");
  Australasia_Cities_List[15] = new CityObj("Rotorua", 12, NewZealand_DST, "RTR", "");
  Australasia_Cities_List[16] = new CityObj("Sydney", 10, Australia_DST, "SYD", "");
  Australasia_Cities_List[17] = new CityObj("Timaru", 12, NewZealand_DST, "TMR", "");
  Australasia_Cities_List[18] = new CityObj("Townsville", 10, No_DST, "TWV", "");
  Australasia_Cities_List[19] = new CityObj("Wellington", 12, NewZealand_DST, "WLL", "");
// -- End Australasia Cities

// -- Begin Europe Cities
 var Europe_Cities_List = new Array();
  Europe_Cities_List[0] = new CityObj("Amsterdam", 1, UK_Europe_DST, "ATD", "");
  Europe_Cities_List[1] = new CityObj("Antwerp", 1, No_DST, "ATW", "");
  Europe_Cities_List[2] = new CityObj("Athens", 2, UK_Europe_DST, "AHN", "");
  Europe_Cities_List[3] = new CityObj("Barcelona", 1, UK_Europe_DST, "BCL", "");
  Europe_Cities_List[4] = new CityObj("Belgrade", 1, UK_Europe_DST, "BGE", "");
  Europe_Cities_List[5] = new CityObj("Berlin", 1, UK_Europe_DST, "BRL", "");
  Europe_Cities_List[6] = new CityObj("Bratislava", 1, UK_Europe_DST, "BTL", "");
  Europe_Cities_List[7] = new CityObj("Bucharest", 2, UK_Europe_DST, "BHR", "");
  Europe_Cities_List[8] = new CityObj("Budapest", 1, UK_Europe_DST, "BPT", "");
  Europe_Cities_List[9] = new CityObj("Copenhagen", 1, UK_Europe_DST, "CHG", "");
  Europe_Cities_List[10] = new CityObj("Dublin", 0, UK_Europe_DST, "DBN", "");
  Europe_Cities_List[11] = new CityObj("Helsinki", 2, UK_Europe_DST, "HSK", "");
  Europe_Cities_List[12] = new CityObj("Kamchatka", 12, Russia_DST, "KCT", "");
  Europe_Cities_List[13] = new CityObj("Lisbon", 0, UK_Europe_DST, "LSB", "");
  Europe_Cities_List[14] = new CityObj("Ljubljana", 1, UK_Europe_DST, "LJU", "");
  Europe_Cities_List[15] = new CityObj("London", 0, UK_Europe_DST, "LON", "");
  Europe_Cities_List[16] = new CityObj("Luxembourg", 1, UK_Europe_DST, "LUX", "");
  Europe_Cities_List[17] = new CityObj("Kaunas", 2, UK_Europe_DST, "KUA", "");
  Europe_Cities_List[18] = new CityObj("Kiev", 3, Russia_DST, "KEV", "");
  Europe_Cities_List[19] = new CityObj("Minsk", 2, Russia_DST, "MNK", "");
  Europe_Cities_List[20] = new CityObj("Moscow", 3, Russia_DST, "MSC", "");
  Europe_Cities_List[21] = new CityObj("Nicosia", 2, UK_Europe_DST, "NCA", "");
  Europe_Cities_List[22] = new CityObj("Oslo", 1, UK_Europe_DST, "OSO", "");
  Europe_Cities_List[23] = new CityObj("Paris", 1, UK_Europe_DST, "PRS", "");
  Europe_Cities_List[24] = new CityObj("Prague", 1, UK_Europe_DST, "PGE", "");
  Europe_Cities_List[25] = new CityObj("Pula", 1, UK_Europe_DST, "PUA", "");
  Europe_Cities_List[26] = new CityObj("Riga", 2, No_DST, "RGA", "");
  Europe_Cities_List[27] = new CityObj("Reykjavik", 0, No_DST, "RYK", "");
  Europe_Cities_List[28] = new CityObj("Rome", 1, UK_Europe_DST, "RME", "");
  Europe_Cities_List[29] = new CityObj("Sarajevo", 2, UK_Europe_DST, "SJV", "");
  Europe_Cities_List[30] = new CityObj("Sofia", 3, UK_Europe_DST, "SFA", "");
  Europe_Cities_List[31] = new CityObj("Stockholm", 1, UK_Europe_DST, "SKM", "");
  Europe_Cities_List[32] = new CityObj("Tallin", 2, UK_Europe_DST, "TLL", "");
  Europe_Cities_List[33] = new CityObj("Valletta", 1, No_DST, "VLT", "");
  Europe_Cities_List[34] = new CityObj("Vienna", 1, UK_Europe_DST, "VNN", "");
  Europe_Cities_List[35] = new CityObj("Vladivostok", 10, Russia_DST, "VDK", "");
  Europe_Cities_List[36] = new CityObj("Warsaw", 1, UK_Europe_DST, "WRW", "");
  Europe_Cities_List[37] = new CityObj("Zurich", 1, UK_Europe_DST, "ZRH", "");
// -- End Europe Cities

//-- Total Cities: 178
//====================================================================================================

// -- Info popup script Start
function info() {
 var DispWin = window.open('','NewWin','toolbar=no,status=no,resizable=yes,width=380,height=165,scrollbars')
  message = "<title>Info</title><body bgcolor=#c0c0c0><font size='2' face='ms sans serif, verdana, arial, helvetica, sans-serif'><b>World-Times</b><br /></font>";
  message += "<font size='1' face='ms sans serif, verdana, arial, helvetica, sans-serif'> <b>Copyright &copy; 2001 Sandeep Gangadharan.</b><br />";
  message += "<b>Home Page: </b><A href='http://www.sivamdesign.com/home/' target='_blank' title='Home Page'>Sandeep's Nook</a><br /><br />";
  message += "This is a World-Times script. You can simultaneously view the time in 5 different cities";
  message += " covering 5 different continents. In all you can find out the time in 178 given cities situated in the 6 major continents. Just choose the city and the time and date will";
  message += " automatically  be displayed in  the text box just below the respective drop down menu. There are radio buttons which give the users the option to either see the time in";
  message += " the 12 Hour or 24 Hour format. This script supports Daylight Saving Time.<br /><br />";
  message += "<b>The Daylight Savings Time Rules are given below:</b>";
  message += "<ul style='margin-top:0;margin-bottom:0'><li>USA/Canada: (March - November)</li>";
  message += "<li>UK/Europe: (March - October)</li>";
  message += "<li>Australia: (October - March)</li>";
  message += "<li>New Zealand: (October - April)</li>";
  message += "<li>Russia: (March - September)</li></ul><hr /></font></body>";
 DispWin.document.write(message);
  var X = parseInt(window.screen.width) / 2 - 190;
  var Y = parseInt(window.screen.height) / 2 - 85;
 DispWin.moveTo(X,Y);
}
// -- Info popup script End
//-->