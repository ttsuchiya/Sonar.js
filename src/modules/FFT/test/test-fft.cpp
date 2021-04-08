#include "catch.hpp"
#include "wasm_fft.h"
#include <cmath>
#include <iostream>

void sinOsc(float* sig, int len, float freq, float gain, float dc) {
    float phase = 0.f;
    for (int i = 0; i < len; i++) {
        phase = (float)i/(float)(len-1);
        sig[i] = sinf(phase*M_PI*2.f * freq) * gain + dc;
    }
}

inline int intDivCeil(int a, int b) {
    return (a+b-1) / b;
}

TEST_CASE("Test") {
    const int len = 8;
    float mag[len] = {0};
    float phase[len] = {0};
    float wave[len] = {0};

    mag[1] = 1.f;
//    mag[8] = 1.f;
    phase[1] = M_PI*2.f * 0.3f;

//    synthesize(mag, phase, wave, len);

//    for (float v : wave) {
//        std::cout << v << std::endl;
//    }

//    analyze(wave, mag, phase, len);

//    for (int i = 0; i < len; i++) {
//        std::cout << mag[i] << " " << phase[i] << std::endl;
//    }
}