
-- B21

utils = require "utils"

aircraft_lat = 34.650497
aircraft_lon = -80.274918
-- dir_contents = sasl.listFiles(path)

files = {}

files["test"] = {
    { name = "example.fms", type = "file" },
    { name = "test.fms", type = "file" },
    { name = "dir", type = "directory" }
}

files["/home/ijl20/src/x-plane/xp-soaring.github.io/tasks/FMS Plans"] = {
    { name = "1N7_littlenavmap_example.fms", type = "file" },
    { name = "example.fms", type = "file" },   
    { name = "KSEA_to_KPAE.fms", type = "file" },   
    { name = "seattle_local.fms", type = "file" },   
    { name = "soaring", type = "directory" },  
    { name = "VFR BLAIRSTOWN to BLAIRSTOWN.fms", type = "file" }
}

files["/home/ijl20/src/x-plane/xp-soaring.github.io/tasks/FMS Plans/soaring"] = {
    { name = "1N7_littlenavmap_example.fms", type = "file"},
    { name = "fake_dir", type = "directory" }
}

files["/home/ijl20/src/x-plane/xp-soaring.github.io/tasks/FMS Plans/soaring/fake_dir"] = {
    { name = "fake_example.fms", type = "file"},
    { name = "another_example.fms", type = "file"},
}

sasl = {}

function sasl.listFiles(path)
    return files[path]
end


function read_fms_file(path)

    local f = io.open(path,"r")

    local file_contents

    if f
    then
        print("Reading file")
        file_contents = f:read("*all")
        f:close()
    else
        print("File read error")
        return {}
    end

    --print("contents\n",file_contents)
    -- 
    local points = {}

    local file_version = "1100" -- will assume, until we get 'version' record

    local record_number = 0 -- will count current line in file, after "I" or "A" record
    local waypoint_count = 0 -- obtain from NUMENR record, or 4th record

    -- read records from file one at a time
    for linestring in file_contents:gmatch("[^\r\n]+") 
    do 
        -- keep track of record count after 'I' or 'A' record (allows starting blank lines)
        if record_number > 0
        then
            record_number = record_number + 1
        end

        local record = {}

        -- parse line into non-blank fields
        for word in linestring:gmatch("[%w%._%-]+")
        do
            --print("word", word)
            table.insert(record, word)
        end

        if record[1] == "I" or record[1] == "A"
        then
            record_number = 1

        elseif record_number == 2 and string.lower(record[2]) == "version"
        then
            file_version = record[1]

        elseif file_version == "3" and record_number == 4
        then 
            waypoint_count = tonumber(record[1])
            if not waypoint_count
            then
                waypoint_count = 0
            else
                waypoint_count = waypoint_count + 1
            end

        elseif record[1] == "NUMENR"
        then
            waypoint_count = tonumber(record[2])
            if not waypoint_count
            then
                waypoint_count = 0
            end

        elseif waypoint_count > 0
        then
            table.insert(points, record)
        end
    end

    print("version",file_version)
    print("waypoint_count", waypoint_count)

    return points
end -- read_fms_file

function display_files(files)

    local item_number = 0
    -- print directories first
    for i,v in pairs(files)
    do
        if v.type == "directory"
        then
            item_number = item_number + 1
            print("["..item_number.."]","DIR", v.name, ">>>")
        end
    end

    -- then files
    for i,v in pairs(files)
    do
        if v.type ~= "directory"
        then
            item_number = item_number + 1
            print("["..item_number.."]",v.name)
        end
    end
end

function index_to_file(index, files)

    --print("index to file",index)
    --utils.print_r(files)

    local item_number = 0

    -- try directories first
    for i,v in pairs(files)
    do
        if v.type == "directory"
        then
            item_number = item_number + 1
            --print("testing",item_number)
            if index == item_number
            then
                return v
            end
        end
    end

    -- then files
    for i,v in pairs(files)
    do
        if v.type ~= "directory"
        then
            item_number = item_number + 1
            --print("testing",item_number)
            if index == item_number
            then
                return v
            end
        end
    end
    return nil
end

fms_root = "/home/ijl20/src/x-plane/xp-soaring.github.io/tasks/FMS Plans"

sub_dir = ""

while true
do
    print("reading", fms_root..sub_dir)
    local current_files = sasl.listFiles(fms_root .. sub_dir)

    display_files(current_files)

    io.write("Choose file: > ")

    local selected = io.read("*n")

    if selected == 0
    then
        -- up a directory
        local slash, slash2 = string.find(sub_dir, "/[^/]*$")
        print("slashes", slash, slash2)
        if not slash
        then
            sub_dir = ""
        else
            sub_dir = string.sub(sub_dir, 1,slash-1)
        end
        print("Changed directory to", sub_dir)
    else
        -- file or directory selected
        local file = index_to_file(selected, current_files)

        if not file
        then
            print("not found")
        
        elseif file.type == "file"
        then
            local filename = file.name

            local filepath = fms_root .. sub_dir.."/" .. filename

            print("loading", filepath)

            points = read_fms_file(filepath)

            print("printing table:")
            utils.print_r(points,0)
            break

        elseif file.type == "directory"
        then
            sub_dir = sub_dir .. "/" .. file.name
        end
    end
end
