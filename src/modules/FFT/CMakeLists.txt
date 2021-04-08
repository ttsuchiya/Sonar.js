cmake_minimum_required(VERSION 3.10)
project(WASM_FFT)
set(CMAKE_CXX_STANDARD 11)
set(ROOT ${CMAKE_CURRENT_SOURCE_DIR})

if (${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
    set(CMAKE_C_COMPILER "emcc")
endif ()

include_directories(
        ${ROOT}/lib/catch-2.9.2
        ${ROOT}/lib/kiss_fft130
        ${ROOT}/src
)

add_executable(
        Test
        ${ROOT}/test/test-main.cpp
        ${ROOT}/test/test-fft.cpp
        ${ROOT}/lib/kiss_fft130/kiss_fft.c
        ${ROOT}/src/wasm_fft.cpp
)