
-- B21

aircraft_lat = 34.650497
aircraft_lon = -80.274918

local files = {
    { name = "example.fms", type = "file" },
    { name = "test.fms", type = "file" },
    { name = "dir", type = "directory" }
}

local t

local filename = files[1].name

f = io.open(filename,"rb")

if f
then
    print("Reading file")
    t = f:read("*all")
    f:close()
else
    print("File read error")
    t = ""
end

-- 
local points = {}

-- boolean to skip records up to "NUMENR" record
local points_start = false

for linestring in t:gmatch("[^\r\n]+") 
do 
    local line = {}
    for word in linestring:gmatch("[%w%._%-]+")
    do
        table.insert(line, word)
    end
    if points_start
    then
        table.insert(points, line)
    else
        points_start = line[1] == "NUMENR"
    end
end

print_r(points)

