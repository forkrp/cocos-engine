cmake_minimum_required(VERSION 3.0)

set(COCOS_NAME "spine")

project(${COCOS_NAME}_wasm)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_BUILD_TYPE "Release")
# set(CMAKE_BUILD_TYPE "Debug")

set(BUILD_WASM 1)

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
	set(OPT_FLAGS "-O0 -g")
else()
	set(OPT_FLAGS "-O3")
endif()


set(APP_NAME "spine_static" CACHE STRING "Project Name")

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=0")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-exceptions -frtti -DEMSCRIPTEN_HAS_UNBOUND_TYPE_NAMES=1")


include_directories(../ ../../)
file(GLOB SPINE_CORE_SRC "../spine/*.cpp")
file(GLOB COCOS_ADAPTER_SRC "./*.cpp")

# add_executable(${APP_NAME} ${SPINE_CORE_SRC} ${COCOS_ADAPTER_SRC} )
#add_executable(${APP_NAME} ${COCOS_ADAPTER_SRC})

add_library(${APP_NAME} STATIC ${SPINE_CORE_SRC} ${COCOS_ADAPTER_SRC} )

set(EMS_LINK_FLAGS "-O3 -s WASM=${BUILD_WASM} -s INITIAL_MEMORY=33554432 -s ALLOW_MEMORY_GROWTH=1 -s DYNAMIC_EXECUTION=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
		--no-entry --bind -s USE_ES6_IMPORT_META=0 -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME='spineWasm' \
		-s ENVIRONMENT=web -s FILESYSTEM=0 -s NO_EXIT_RUNTIME=1 -s LLD_REPORT_UNDEFINED \
		-s MIN_SAFARI_VERSION=110000 \
		--js-library ../library_spine.js -Wl,--whole-archive libspine_static.a /Users/james/projects/cocos-creator/PhysX/physx/bin/emscripten/release/physx-fat.release.wasm.a -Wl,--no-whole-archive")




add_library(physx STATIC IMPORTED GLOBAL)
set_target_properties(physx PROPERTIES
  IMPORTED_LOCATION /Users/james/projects/cocos-creator/PhysX/physx/bin/emscripten/release/physx-fat.release.wasm.a
)


add_executable(${COCOS_NAME} empty.cpp)

target_link_libraries(${COCOS_NAME}
	PRIVATE ${APP_NAME} physx
)

set_target_properties(${COCOS_NAME} PROPERTIES LINK_FLAGS ${EMS_LINK_FLAGS})

# set_target_properties(${APP_NAME} PROPERTIES LINK_FLAGS ${EMS_LINK_FLAGS})