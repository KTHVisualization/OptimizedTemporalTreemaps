# Minimum CMake version
cmake_minimum_required(VERSION 3.10)

# Project name
project(TTMPL)

option(CXX "enable C++ compilation" ON)
set(CMAKE_CXX_FLAGS "-Wall -Wextra")
set(CMAKE_CXX_FLAGS_DEBUG "-g")
set(CMAKE_CXX_FLAGS_RELEASE "-O3")


# Set the C++ standard
if(CXX)
    set (CMAKE_CXX_STANDARD 17)
    enable_language(CXX)
endif()

list(APPEND CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/cmake")

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Release")
endif()

message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")

find_package(GUROBI REQUIRED)
add_subdirectory(modules/json)
# find_package(nlohmann_json REQUIRED)
include_directories(${PROJECT_SOURCE_DIR}/include ${GUROBI_INCLUDE_DIRS} nlohmann_json::nlohmann_json)


# Add source files
set(SOURCES 
    ${PROJECT_SOURCE_DIR}/src/datastructures/tree.cpp
    ${PROJECT_SOURCE_DIR}/src/treejsonreader.cpp
    ${PROJECT_SOURCE_DIR}/src/treeorder.cpp
    ${PROJECT_SOURCE_DIR}/src/treewriter.cpp
    ${PROJECT_SOURCE_DIR}/src/wigglemin.cpp
    ${PROJECT_SOURCE_DIR}/src/main.cpp
)

# Create the executable
add_executable(TTMPL ${SOURCES})

if(CXX)
  target_link_libraries(TTMPL optimized ${GUROBI_CXX_LIBRARY}
    debug ${GUROBI_CXX_DEBUG_LIBRARY})
endif()

target_link_libraries(TTMPL pthread)
target_link_libraries(TTMPL nlohmann_json::nlohmann_json ${GUROBI_LIBRARY})