This is the FSX RidgeLift 'ridgebox' visual aid.

For more info see:

   http://carrier.csi.cam.ac.uk/forsterlewis/soaring/sim/fsx/dev/lift.html#Ridge

That page also links to a RidgeTest mission just north of Minden that uses the
ridgebox scenery objects.

INSTALLATION:

1) move the file(s) 
      from the zip "scenery" folder 
      into "Program Files/Microsoft Games/Flight Simulator X/Addon Scenery/scenery"

2) move the file(s) 
      from the zip "texture" folder 
      into "Program Files/Microsoft Games/Flight Simulator X/Addon Scenery/texture"

That's it.  

(Dev note: This zip contains all the source also if you want to play with GMAX. The
texture bitmap in the material might need the folder resetting on your machine though.)

USAGE:

At the moment there seems to be a problem with scaling FSX scenery objects within
RidgeLift areas, so for now only use Rectangle areas with the following
dimensions (length, width, height in 1000's of meters):

1x1x1  {a4f22592-22a4-4aa7-b91d-f5700ef8108e}

4x2x1  {3ae1e3ed-82aa-4d64-922e-e793a87030ed}

8x2x1  {dcde1e0f-4ca3-426e-b59d-6eda6b2701b0}

2x2x2  {ffa19965-be4d-42a7-8543-ca19878e9827}

4x2x2  {ab9a9a23-8ea1-4ae6-9ef8-2352eab2ad61}

8x2x2  {16b03fcb-975e-473f-8fc3-efa0f2f7b69e}

take a little time to understand the sizes - either 1000m or 2000m high,
either a cube (1x1x1, 2x2x2) or 4km or 8km long by 2km wide.

To test the ridgebox, in the mission editor create a RectangleArea of one of those
sizes, e.g. at Minden:

        <SimMission.RectangleArea InstanceId="{<- FSX area ref ->}">
            <Descr>ridge_area_south</Descr>
            <Orientation>0.000,0.000,0.000</Orientation>
            <Length>1000.000</Length>
            <Width>1000.000</Width>
            <Height>1000.000</Height>
            <AttachedWorldPosition>
                <WorldPosition>N39° 0' 49.61",W119° 45' 16.98",+000000.00</WorldPosition>
                <AltitudeIsAGL>True</AltitudeIsAGL>
            </AttachedWorldPosition>
        </SimMission.RectangleArea>

And create a RidgeLift mission object and link it to the RectangleArea:

        <SimMission.RidgeLift InstanceId="{<- whatever FSX puts here ->}">
            <Descr>ridge_south</Descr>
            <AirObjectModelGuid>{A4F22592-22A4-4AA7-B91D-F5700EF8108E}</AirObjectModelGuid>
            <CoreRateScalar>1.001</CoreRateScalar>
            <CoreTurbulence>0.001</CoreTurbulence>
            <SinkRateScalar>1.001</SinkRateScalar>
            <SinkTurbulence>0.001</SinkTurbulence>
            <ObjectReference id="ridge_area_south" InstanceId="{<- FSX area ref ->}">
            </ObjectReference>
        </SimMission.RidgeLift>

Note that the object scaling is set to False (omitted in the XML as that's the default).

Save the mission.

EXIT AND RESTART FSX. (FSX doesn't always re-load AirObjectModelGuid scenery on a simple mission restart)

Set the wind to 225 degrees, 16 knots.

Fly around the model in the DG808S - you should get lift and sink as expected inside the ridgebox.

Post any questions to the FSX Missions forum on http://www.fsxmissions.com

B21.
8-jan-2007