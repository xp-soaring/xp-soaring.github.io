# XCSoar Task Files (*.tsk)

## Example 1. Bomoen - Suldal
```
<Task fai_finish="0" start_max_height_ref="MSL" start_max_height="1800" finish_min_height_ref="MSL"
      finish_min_height="0"  start_max_speed="0" start_requires_arm="0" aat_min_time="0" type="RT">
       <Point type="Start">
               <Waypoint name="S:Bomoen" id="0" comment="Bomoen" altitude="101">
                       <Location latitude="60.63820" longitude="6.50350"/>
               </Waypoint>
               <ObservationZone type="Line" length="6000"/>
       </Point>
       <Point type="Turn">
               <Waypoint name="1:Suldal utel." id="0" comment="Suldal utel." altitude="77">
                       <Location latitude="59.49135" longitude="6.50027"/>
               </Waypoint>
               <ObservationZone type="SymmetricQuadrant" radius="3000"/>
       </Point>
       <Point type="Finish">
               <Waypoint name="F:Bomoen" id="0" comment="Bomoen" altitude="101">
                       <Location latitude="60.63820" longitude="6.50350"/>
               </Waypoint>
               <ObservationZone type="Cylinder" radius="1500"/>
       </Point>
</Task>
```

## Example 2. Zell-Am-See
```
<Task fai_finish="0" finish_min_height_ref="AGL" finish_min_height="152"
    start_max_height_ref="MSL" start_max_height="1828" start_max_speed="0" start_requires_arm="0"
    aat_min_time="0" name="ZELL-AM-SEE TASK 1" type="RT">
    <Point type="Start">
        <Waypoint altitude="0" comment="TP HHN User WP" id="2" name="TP HHN">
            <Location latitude="47.303333" longitude="12.837778"/>
        </Waypoint>
        <ObservationZone length="10000" type="Line"/>
    </Point>
    <Point type="Turn">
        <Waypoint altitude="0" comment="TP STS User WP" id="3" name="TP STS">
            <Location latitude="47.458889" longitude="13.815"/>
        </Waypoint>
        <ObservationZone radius="500" type="Cylinder"/>
    </Point>
    <Point type="Turn">
        <Waypoint altitude="0" comment="TP WRF User WP" id="4" name="TP WRF">
            <Location latitude="47.483333" longitude="13.188889"/>
        </Waypoint>
        <ObservationZone radius="500" type="Cylinder"/>
    </Point>
    <Point type="Finish">
        <Waypoint altitude="751.942" comment="LOWZ Airport" id="5" name="LOWZ">
            <Location latitude="47.292778" longitude="12.788056"/>
        </Waypoint>
        <ObservationZone length="2000"  type="Line"/>
    </Point>
</Task>
```

## Task

Parameters:
* `type` – type of the task (one of the constants in TaskType)
`start_requires_arm` – True: start has to be armed manually, False: task will be started * automatically
* `start_max_height` – maximum altitude when the task is started (in m)
* `start_max_height_ref` – altitude reference of start_max_height (one of the constants in AltitudeReference)
* `start_max_speed` – maximum speed when the task is started (in m/s)
* `start_open_time` – time that the start line opens as datetime.time
* `start_close_time` – time that the start line is closing as datetime.time
* `aat_min_time` – AAT time as datetime.timedelta
* `finish_min_height` – minimum altitude when the task is finished (in m)
* `finish_min_height_ref` – altitude reference of finish_min_height (one of the constants in AltitudeReference)
* `fai_finish` – True: FAI finish rules apply

`type`:
```
AAT             -- Assigned Area Task
FAIGeneral
FAIGoal
FAIOR           -- FAI Out and Return
FAITriangle
MAT
Mixed
RT              -- Racing
Touring
```

## Point

`type`:
```
Area
Finish
OptionalStart
Start
Turn
```

## Waypoint
Parameters:
* `name` – name of the waypoint
* `latitude` – latitude of the waypoint (in WGS84)
* `longitude` – longitude of the waypoint (in WGS84)
* `altitude` – altitude of the waypoint (in m, optional)
* `id` – internal id of the waypoint (optional)
* `comment` – extended description of the waypoint (optional)

`Location`

## Location
Parameters
* `latitude`
* `longitude`

## ObservationZone
Parameters:
`type` – observation zone type (one of the constants in ObservationZoneType)
`length` – length of the line (only used with type LINE)
`radius` – (outer) radius of the observation zone (used with types CYLINDER, SECTOR, SYMMETRIC_QUADRANT and CUSTOM_KEYHOLE)
`inner_radius` – inner radius of the observation zone (only used with type CUSTOM_KEYHOLE)
`angle` – angle of the observation zone (only used with type CUSTOM_KEYHOLE)
`start_radial` – start radial of the observation zone (only used with type SECTOR)
`end_radial` – end radial of the observation zone (only used with type SECTOR)

`type`:
```
BGAEnhancedOption
BGAFixedCourse
BGAStartSector
CustomKeyhole
Cylinder        -- radius (m)
FAISector
Keyhole
Line
MatCylinder
Sector
SymmetricQuadrant
```

## AltitudeReference

```
AGL
MSL
```
