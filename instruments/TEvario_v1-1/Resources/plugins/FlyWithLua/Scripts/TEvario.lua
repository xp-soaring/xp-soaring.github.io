-- lordauriel's TEvario
-- v 1.0 - 2018/06/20

require ("graphics")

--------------- Change this setting as you wish
-- This is the "averager time constant".
-- 150 means "sample every 1,5s", set this value to your liking. 200 means every 2s, 100 every 1s etc etc
local vario_samplerate = 100
------------------------------------------------------------
local done = false
local lastrun = 0 -- initialize at startup, nothing fancy
local te_vario = 0 -- holds the realtime smoothed vario signal that will be used for beeps and the needle of the vario display created by this script
local acoustic_switch = 1 -- Volume switch for the TE vario, default setting.
local displayWidget = true

--------------- Initialize sound samples etc
local acoustic_vario = load_WAV_file(SCRIPT_DIRECTORY .. "TEvario/sounds/vario_climb.wav")
local acoustic_vario_descend = load_WAV_file(SCRIPT_DIRECTORY .. "TEvario/sounds/vario_descend.wav")
local isVarioPlayingPositive = false
local isVarioPlayingNegative = false;
let_sound_loop(acoustic_vario, true)
set_sound_gain(acoustic_vario, 0.25) -- default Volume.

--------------- Get some X-Plane 11 datarefs and assign them to variables
dataref("vario_raw", "sim/cockpit2/gauges/indicators/total_energy_fpm")
dataref("pause", "sim/time/paused")
dataref("externalView", "sim/graphics/view/view_is_external")
dataref("Alt_ft", "sim/flightmodel/misc/h_ind")
dataref("clock_source", "sim/network/misc/network_time_sec") -- a good universal clock source, much better than os.clock()

--------------- Stop playing sounds when sim is paused
function StopSounds()
	if pause == 1 or te_vario < 0 then
		stop_sound(acoustic_vario)
		isVarioPlayingPositive = false
	end
end

--------------- A crude timer that will trigger the "Smooth()" function every 100th of a second. 
function Timer()
	local currentrun = clock_source
	if currentrun >= lastrun + 0.01 then
		Smooth()
		lastrun = currentrun
	end
end

--------------- helper functions
function Vol1()
	acoustic_switch = 1
	set_sound_gain(acoustic_vario, 0.25)
end
function Vol2()
	acoustic_switch = 2
	set_sound_gain(acoustic_vario, 0.50)
end
function Vol3()
	acoustic_switch = 3
	set_sound_gain(acoustic_vario, 0.75)
end
-- helper function, vario OFF
function off()
	acoustic_switch = 0
end
-- Toggle the vario widget on/off
function WidgetToggle()
	displayWidget = not displayWidget
end

function round(x)
  return x>=0 and math.floor(x+0.5) or math.ceil(x-0.5)
end

function Trigger()
	if pause == 0 then
		Timer()
		PlaySounds()
	end
end

add_macro("TEvario Vol 1", "Vol1()")
add_macro("TEvario Vol 2", "Vol2()")
add_macro("TEvario Vol 3", "Vol3()")
add_macro("TEvario OFF", "off()")
add_macro("TEvario Toggle Widget", "WidgetToggle()")

--------------- Draw the vario instrument, some OpenGL code quick & dirty
function ShowVario()
	if externalView == 0 and displayWidget == true then
		Vario(SCREEN_WIDTH - 210, SCREEN_HIGHT - 220, 10)
	end
end
	
function Vario(x, y, range)
	local angle
	local tick_angle
	local te_vario_ms = (te_vario + 1000) * 0.00508
	local Alt_m = round((Alt_ft / 3.28084))
	
	glColor3f(0.8, 0.8, 0.8)
	graphics.draw_filled_circle(x + 100, y + 100, 100)
	draw_string(x + 90, y + 50, Alt_m, "black")
	XPLMSetGraphicsState(0, 0, 0, 0, 0, 0, 0)
	
	glColor3f(0, 0, 0)
	graphics.draw_arc(x + 100, y + 100, -255, 75, 100)
	draw_string(x + 150, y + 98, "m/s", "black")
	-- Reset OpenGL state after draw_string
	XPLMSetGraphicsState(0, 0, 0, 0, 0, 0, 0)
	
	-- Set the needle limits properly
	if te_vario_ms < range then
		angle = (te_vario_ms / range * 300 - 240)
	else
		angle = -240
	end
	if te_vario_ms > range then
		angle = (te_vario_ms / range * 300 + 115)
	end
	
	glColor3f(1, 0, 0)
	graphics.draw_angle_arrow(x + 100, y + 100, angle, 90, 0, 4)
	
	-- draw small tick marks
	for tick = 0, range, 0.5 do
		tick_angle = tick / range * 300 - 240
		glColor3f(0.4, 0.4, 0.4)
		graphics.draw_tick_mark(x + 100, y + 100, tick_angle, 100, 10, 1)
	end
	-- draw thick tick marks
	for tick = 0, range, 1 do
		tick_angle = tick / range * 300 - 240
		glColor3f(0, 0, 0)
		graphics.draw_tick_mark(x + 100, y + 100, tick_angle, 100, 20, 3)
	end
	
	-- some eye candy in the middle (needle cover)
	glColor3f(0.30, 0.30, 0.30)
	graphics.draw_filled_circle(x + 100, y + 100, 10)
	glColor3f(0, 0, 0)
	graphics.draw_circle(x + 100, y + 100, 10)
end
 
--------------- Smooth the x-plane vario output with a clumsy, home-brewed moving average calculation
function Smooth()
	if done == false then
		samplerate = vario_samplerate
		samplebuffer = { }
		for i = 1, samplerate do
			samplebuffer[i] = vario_raw
		end
		done = true
	end
		smoothed_vario = vario_raw
		for i = 2, samplerate do
			smoothed_vario = smoothed_vario + samplebuffer[i]
			samplebuffer[i-1] = samplebuffer[i]
		end
		samplebuffer[samplerate] = vario_raw
		-- Here we set he actual smoothed te_vario value
		te_vario = smoothed_vario / samplerate
		-- limit to 1000ft/m (5m/s)
		if te_vario > 1000 then
			te_vario = 1000
		end
		if te_vario < -1000 then
			te_vario = -1000
		end
		--
		if samplerate ~= vario_samplerate then
			done = false
		end	
end

--[[
function smooth(period)
	local t = {}
	for i = 1, period do
		t[i] = vario_raw
	end
	function sum(a, ...)
		if a then return a+sum(...) else return 0 end
	end
	function average(n)
		if #t == period then table.remove(t, 1) end
		t[#t + 1] = n
		return sum(unpack(t)) / #t
	end
	return average
end
]]--

--------------- Generate sounds for positive Vario output
function PlaySounds()

	if acoustic_switch and acoustic_switch > 0 and te_vario and te_vario > 0 then
	
		if isVarioPlayingPositive == false then
			play_sound(acoustic_vario)
			isVarioPlayingPositive = true
		end
			
		local pitch = (te_vario * 0.00508) / 2.5 -- convert fpm to m/s and then establish a ratio that sounds good
		if pitch < 0.26 then -- The sample sounds silly below a certain pitch.
			pitch = 0.26
		end
		set_sound_pitch(acoustic_vario, pitch)
	end
end

------------------------------------------------------------
-- NOW PUT IT ALL TOGETHER
do_every_frame("Trigger()")
do_every_frame("StopSounds()")
do_every_draw("ShowVario()")