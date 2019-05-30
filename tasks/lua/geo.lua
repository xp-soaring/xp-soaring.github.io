-- B21
-- *********************************************************************************
-- ************* Geometric Functions ***********************************************
-- *********************************************************************************

local geo = {}

-- Return distance in m between positions p1 and p2.
-- lat/longs in e.g. p1.lat etc
function geo.get_distance(p1, p2)
    local R = 6371000 -- Earth's mean radius in meter
    local dLat = geo.rad(p2.lat - p1.lat)
    local dLong = geo.rad(p2.lng - p1.lng)
    local a =  math.sin(dLat / 2) *  math.sin(dLat / 2) +
                     math.cos(geo.rad(p1.lat)) *  math.cos(geo.rad(p2.lat)) *
                         math.sin(dLong / 2) *  math.sin(dLong / 2)
    local c = 2 *  math.atan2( math.sqrt(a),  math.sqrt(1 - a))
    local d = R * c
    return d -- returns the distance in meter
end

-- return {north = .., south = .., east = .., west = .. } as bounds of array of position
function geo.get_box(position_array)
    local box = { north = -90, south = 90, east = -180, west = 180 }
    for i=1,#position_array
    do
        if (position_array[i].lat > box.north)
        then box.north = position_array[i].lat
        end
        if (position_array[i].lat < box.south)
        then box.south = position_array[i].lat
        end
        if (position_array[i].lng > box.east)
        then box.east = position_array[i].lng
        end
        if (position_array[i].lng < box.west)
        then box.west = position_array[i].lng
        end
    end
    return box
end

-- Return true is position is inside bounding polygon
-- http://stackoverflow.com/questions/13950062/checking-if-a-longitude-latitude-coordinate-resides-inside-a-complex-polygon-in
function geo.is_inside(position, bounds_path, box)
    --console.log('is_inside '+JSON.stringify(position)+', '+JSON.stringify(bounds_path)+', '+JSON.stringify(box))

    -- easy optimization - return false if position is outside bounding rectangle (box)
    if ( position.lat > box.north or
         position.lat < box.south or
         position.lng < box.west or
         position.lng > box.east)
    then
        return false
    end

    local lastPoint = bounds_path[#bounds_path]
    local isInside = false
    local x = position.lng
    for i=1,#bounds_path
    do
        local point = bounds_path[i]
        local x1 = lastPoint.lng
        local x2 = point.lng
        local dx = x2 - x1

        if ( math.abs(dx) > 180.0)
        then
            -- we have, most likely, just jumped the dateline
            -- (could do further validation to this effect if needed).  normalise the
            -- numbers.
            if (x > 0)
            then
                while (x1 < 0)
                do
                    x1 = x1 + 360
                end
                while (x2 < 0)
                do
                    x2 = x2 + 360
                end
            else
                while (x1 > 0)
                do
                    x1 = x1 - 360
                end
                while (x2 > 0)
                do
                    x2 = x2 - 360
                end
            end
            dx = x2 - x1
        end

        if ((x1 <= x and x2 > x) or (x1 >= x and x2 < x))
        then
            local grad = (point.lat - lastPoint.lat) / dx
            local intersectAtLat = lastPoint.lat + ((x - x1) * grad)

            if (intersectAtLat > position.lat)
            then
                isInside = not isInside
            end
        end
        lastPoint = point
    end

    return isInside
end


-- Bearing in degrees from point A -> B (each as {lat = , lng = })
function geo.get_bearing(A, B)
    local a = { lat = geo.rad(A.lat), lng = geo.rad(A.lng) }
    local b = { lat = geo.rad(B.lat), lng = geo.rad(B.lng) }

    local y =  math.sin(b.lng-a.lng) *  math.cos(b.lat)
    local x =  math.cos(a.lat)* math.sin(b.lat) -
                 math.sin(a.lat)* math.cos(b.lat)* math.cos(b.lng-a.lng)
    return ( math.atan2(y, x) * 180 /   math.pi + 360) % 360
end

-- Return true if bearing A lies between bearings B1 and B2
-- B2 must be CLOCKWISE from B1 i.e. larger if the target zone doesn't include 0
function geo.test_bearing_between(a, b1, b2)
    if (b1 > b2) -- zone includes 0
    then
        return a > b1 or a < b2
    end
    return a > b1 and a < b2
end

-- Normalize an angle to >=0 & <360
function geo.angle360(a)
    local positive = a >= 0

    local abs_a =  math.abs(a) % 360

    return positive and abs_a or 360 - abs_a
end

-- Bearing of 'outside' bisector of corner from B in line from A->B->C
function geo.get_bisector(A,B,C)
    local track_in = geo.get_bearing(A,B)

    local track_out = geo.get_bearing(B,C)

    return geo.get_angle_bisector(track_in, track_out)
end

-- As above except for angles instead of points
function geo.get_angle_bisector(track_in, track_out)
    local bisector = (track_in + track_out) / 2 + 90

    local bisector_offset =  math.abs(bisector - track_in)

    if bisector_offset > 90 and bisector_offset < 270
    then
         bisector = bisector + 180
    end

    return geo.angle360(bisector)
end

-- http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
-- Detect whether lines A->B and C->D intersect
-- return { success = true/false, position = LatLng (if lines do intersect), progress = 0..1 }
-- where 'progress' is how far the intersection is along the A->B path
function geo.get_intersect(line1, line2)
    local A = line1[1]
    local B = line1[2]
    local C = line2[1]
    local D = line2[2]

    local s1 = { lat = B.lat - A.lat, lng = B.lng - A.lng }
    local s2 = { lat = D.lat - C.lat, lng = D.lng - C.lng }

    local s = (-s1.lat * (A.lng - C.lng) + s1.lng * (A.lat - C.lat)) /
                (-s2.lng * s1.lat + s1.lng * s2.lat)
    local t = ( s2.lng * (A.lat - C.lat) - s2.lat * (A.lng - C.lng)) /
                (-s2.lng * s1.lat + s1.lng * s2.lat)

    if s >= 0 and s <= 1 and t >= 0 and t <= 1
    then
        -- lines A->B and C->D intersect
        return { success = true,
                 position = { lat = A.lat + (t * s1.lat),
                             lng = A.lng + (t * s1.lng) },
                 progress = t }
    end

    return { success = false } -- lines don't intersect
end

-- Perpendicular distance of point P {lat =, lng =} from a line [A,B]
-- where A,B are points
function geo.get_distance_from_line(P, line)

    -- Prepare some values for the calculation
    local R = 6371000 -- Earth's mean radius in meter

    local A = line[1]

    local B = line[2]

    local bearing_AP = geo.get_bearing(A, P)

    local bearing_AB = geo.get_bearing(A, B)

    local bearing_BP = geo.get_bearing(B, P)

    -- if point P is 'behind' A wrt to B, then return distance from A
    local angle_BAP = (bearing_AP - bearing_AB + 360) % 360

    --console.log('angle_BAP',angle_BAP)

    if angle_BAP > 90 and angle_BAP < 270
    then
        return geo.get_distance(A,P)
    end

    -- if point P is 'behind' B wrt to A, then return distance from B
    local angle_ABP = (180 - bearing_BP + bearing_AB + 360) % 360

    --console.log('angle_ABP',angle_ABP)

    if angle_ABP > 90 and angle_ABP < 270
    then
        return geo.get_distance(B,P)
    end

    -- ok, so the point P is somewhere between A and B, so return perpendicular distance

    local distance_AB = geo.get_distance(A, P)

    local d =  math.asin( math.sin(distance_AB/R)* math.sin(geo.rad(bearing_AP - bearing_AB))) * R

    return  math.abs(d)
end

--*********************************************************************************************
--*************** CONVERSION FUNCTIONS, E.G. meters to nautical miles *************************
--*********************************************************************************************

-- degrees to radians
function geo.rad(x)
      return x *   math.pi / 180
end

-- meters to nautical miles
function geo.nm(x)
        return x * 0.000539956803
end

-- meters to statute miles
function geo.miles(x)
        return x * 0.000621371
end

return geo

-- TESTS

-- $ lua
-- > geo = require "geo"
-- > utils = require "utils" -- for print_r

-- > geo.get_distance({lat = 50, lng=14},{lat=51, lng=15})
-- 131780.47419664

-- > geo.get_bearing({lat = 50, lng=14},{lat=51, lng=15})
-- 32.07470825227

-- > geo.get_distance({lat = 50, lng=1},{lat=51, lng=-1})
-- 179918.12330347

-- > geo.get_bearing({lat = 50, lng=1},{lat=51, lng=-1})
-- 308.9382197337

-- > box = geo.get_box({{lat = 50, lng=14},{lat=51, lng=14},{lat = 51, lng=15},{lat=50, lng=15}})
-- > utils.print_r(box,1)
-- #		north: 51
-- #		east: 15
-- #		south: 50
-- #		west: 14

-- > geo.is_inside({lat=50.5,lng=14.5}, {{lat = 50, lng=14},{lat=51, lng=14},{lat = 51, lng=15},{lat=50, lng=15}}, box)
-- true

-- > geo.is_inside({lat=50.5,lng=15.5}, {{lat = 50, lng=14},{lat=51, lng=14},{lat = 51, lng=15},{lat=50, lng=15}}, box)
-- false

-- > geo.test_bearing_between(15, 300, 20)
-- true

-- > geo.test_bearing_between(270, 300, 20)
-- false

-- > geo.get_bisector({lat=49,lng=-1},{lat=50,lng=0},{lat=50,lng=1})
-- 331.1196895563

-- > geo.get_angle_bisector(45,90)
-- 337.5

-- > p = geo.get_intersect( { {lat=50,lng=-1},{lat=52,lng=1} }, { {lat=51,lng=-1},{lat=50,lng=2} } )
-- > print(p.success)
-- true
-- > utils.print_r(p.position,1)
-- #		lat: 50.75
-- #		lng: -0.25
-- > print(p.progress)
-- 0.375

-- > geo.get_distance_from_line( {lat=50,lng=0}, { {lat=51,lng=-1},{lat=50,lng=2} } )
-- 67197.625946753
