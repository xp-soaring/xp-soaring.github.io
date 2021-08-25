# MSFS Airport data

## Extracting the MSFS airports data (using LittleNavMap)

Install LittleNavMap

Menu: Scenery Library, select MSFS, click Load Scenery Library

This will generate file %APPDATA%C:\Roaming\ABarthel\little_navmap_db\little_navmap_msfs.sqlite

## Using SQLITE

Download the SQLITE command shell https://www.sqlite.org/cli.html

Run with e.g.
```
G:\bin\sqlite\sqlite-tools-win32-x86-3360000\sqlite3.exe C:\Users\fripl\AppData\Roaming\ABarthel\little_navmap_db\little_navmap_msfs.sqlite
```

`.tables` - list tables (see table `airport`)

`select count(*) from airport;`
38040

`.schema airport`
```
CREATE TABLE airport
 (
  airport_id integer primary key,
  file_id integer not null,
  ident varchar(10) not null,
  icao varchar(10),
  iata varchar(10),
  xpident varchar(10),
  name varchar(50) collate nocase,
  city varchar(50) collate nocase,
  state varchar(50) collate nocase,
  country varchar(50) collate nocase,
  region varchar(4) collate nocase,
  flatten integer,
  fuel_flags integer not null,
  has_avgas integer not null,
  has_jetfuel integer not null,
  has_tower_object integer not null,

  tower_frequency integer,
  atis_frequency integer,
  awos_frequency integer,
  asos_frequency integer,
  unicom_frequency integer,

  is_closed integer not null,
  is_military integer not null,
  is_addon integer not null,

  num_com integer not null,

  num_parking_gate integer not null,
  num_parking_ga_ramp integer not null,
  num_parking_cargo integer not null,
  num_parking_mil_cargo integer not null,
  num_parking_mil_combat integer not null,

  num_approach integer not null,
  num_runway_hard integer not null,
  num_runway_soft integer not null,
  num_runway_water integer not null,
  num_runway_light integer not null,
  num_runway_end_closed integer not null,
  num_runway_end_vasi integer not null,
  num_runway_end_als integer not null,
  num_runway_end_ils integer,

  num_apron integer not null,
  num_taxi_path integer not null,
  num_helipad integer not null,
  num_jetway integer not null,
  num_starts integer not null,

  longest_runway_length integer not null,
  longest_runway_width integer not null,
  longest_runway_heading double not null,
  longest_runway_surface varchar(15),


  num_runways integer not null,
  largest_parking_ramp varchar(20),
  largest_parking_gate varchar(20),

  rating integer not null,


  is_3d integer not null,

  scenery_local_path varchar(250) collate nocase,
  bgl_filename varchar(300) collate nocase,

  left_lonx double not null,
  top_laty double not null,
  right_lonx double not null,
  bottom_laty double not null,

  mag_var double not null,
  tower_altitude integer,
  tower_lonx double,
  tower_laty double,
  transition_altitude integer,
  altitude integer not null,
  lonx double not null,
  laty double not null,
 foreign key(file_id) references bgl_file(bgl_file_id)
 );
 ```

## Sample airports

### Blairstown Airport, NJ:

```
sqlite> select airport_id,ident,icao,name,altitude,lonx,laty from airport where ident='1N7';
```
```
airport_id, ident,  icao,   name,       altitude,   lonx,               laty
32782       1N7     <blank> Blairstown  368         -74.9975051879883   40.971134185791
```

Full record:
```
 32782|313|1N7||||Blairstown|Blairstown|New Jersey||K6||1073741872|1|0|0|0|0|0|0|123000|0|0|0|6|0|7|0|0|0|0|1|0|0|1|0|0|0|0|46|127|0|0|2|3103|64|60.676197052002|A|1|RGAS||3|0|fs-base|APX28170.bgl|-75.0024719238281|40.9747314453125|-74.9924850463867|40.9684906005859|-13.2638130187988|||||368|-74.9975051879883|40.971134185791
```

ourairports.com data for Blairstown
```
18498,K1N7,small_airport,Blairstown Airport,40.9710998535,-74.9974975586,372,NA,US,US-NJ,Blairstown,no,1N7,,1N7,,,
```

Note the identifiers:
```
18498   - ourairports.com identifier
K1N7    - ident
1N7     - gps_code
blank   - iata_code
1N7     - local_code
```

### JFK

```
 87610|3272|KJFK||||Kennedy Intl|New York|New York||K6||1073741872|1|0|1|119100|128725|0|128725|122950|0|0|1|20|121|146|0|0|0|0|4|0|0|4|0|4|4|7|1107|3404|0|0|12|14510|200|120.733848571777|A|4|RGAL|GH|5|0|fs-base, asobo-airport-kjfk-new-york-jfk|APX28170.bgl, KJFK.bgl|-73.8231811523437|40.6648330688477|-73.7534713745117|40.6213569641113|-13.9459600448608|||||12|-73.7776718139648|40.6413688659668
```

## Runways

```
sqlite> .mode csv
sqlite> .output msfs_runways.csv
sqlite> select ident,runway_end.name from airport,runway,runway_end where airport.airport_id=runway.airport_id and (runway.primary_end_id=runway_end.runway_end_id or runway.secondary_end_id=runway_end_id);
```
Outputs `<airport ident>,<runway name>` rows (i.e. multiple rows per airport)
