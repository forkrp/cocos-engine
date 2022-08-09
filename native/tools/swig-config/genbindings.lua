local PATH = os.getenv('PATH')
local SWIG_LIB = os.getenv('SWIG_LIB')
local COCOS_NATIVE_ROOT = os.getenv('COCOS_NATIVE_ROOT')
local SWIG_ROOT = os.getenv('SWIG_ROOT')

local all_dirs = {
    SWIG_LIB,
    COCOS_NATIVE_ROOT,
    SWIG_ROOT
}

--- Check if a file or directory exists in this path
function exists(file)
   local ok, err, code = os.rename(file, file)
   if not ok then
      if code == 13 then
         -- Permission denied, but it exists
         return true
      end
   end
   return ok, err
end

--- Check if a directory exists in this path
function isdir(path)
   -- "/" works on both Unix and Windows
   return exists(path.."/")
end

print('COCOS_NATIVE_ROOT: ' .. COCOS_NATIVE_ROOT)
print('PATH: ' .. PATH)
print('SWIG_LIB: ' .. SWIG_LIB)
print('SWIG_ROOT: ' .. SWIG_ROOT)

for _, dir in ipairs(all_dirs) do
    if not isdir(dir) then
        print(string.format('(%s) does not exist!', dir))
        return
    end
end

local swig_config_map = {
    { '2d.i', 'jsb_2d_auto.cpp' },
    { 'assets.i', 'jsb_assets_auto.cpp' },
    { 'audio.i', 'jsb_audio_auto.cpp' },
    { 'cocos.i', 'jsb_cocos_auto.cpp' },
    { 'dragonbones.i', 'jsb_dragonbones_auto.cpp' },
    { 'editor_support.i', 'jsb_editor_support_auto.cpp' },
    { 'extension.i', 'jsb_extension_auto.cpp' },
    { 'geometry.i', 'jsb_geometry_auto.cpp' },
    { 'gfx.i', 'jsb_gfx_auto.cpp' },
    { 'network.i', 'jsb_network_auto.cpp' },
    { 'physics.i', 'jsb_physics_auto.cpp' },
    { 'pipeline.i', 'jsb_pipeline_auto.cpp' },
    { 'scene.i', 'jsb_scene_auto.cpp' },
    { 'spine.i', 'jsb_spine_auto.cpp' },
    { 'webview.i', 'jsb_webview_auto.cpp' },
    { 'video.i', 'jsb_video_auto.cpp' },
    { 'renderer.i', 'jsb_render_auto.cpp' },
}

for _, config in ipairs(swig_config_map) do
	local command = string.format('%s %s %s %s %s', 
		'swig -c++ -cocos -fvirtual -noexcept -cpperraswarn',
		'-D__clang__ -Dfinal= -DCC_PLATFORM=3 -Dconstexpr=const -DCC_PLATFORM_ANDROID=3',
		'-I' .. SWIG_ROOT .. '/build' .. ' -I' .. COCOS_NATIVE_ROOT .. ' -I' .. COCOS_NATIVE_ROOT .. '/cocos',
		'-o ' .. COCOS_NATIVE_ROOT .. '/cocos/bindings/auto/' .. config[2],
		COCOS_NATIVE_ROOT .. '/tools/swig-config/' .. config[1]
	)
	print('command: ' .. command)
	local r = os.execute(command)
	print('command execute returns: ' .. tostring(r))
	if r ~= true then
		print(string.format('ERROR: execute command (%s) failed!', command))
		break
	end
end
