#include "wasm_fft.h"
#include <cmath>

extern "C" {
void transform(const float* rin, const float* iin, float* rout, float* iout, int len, int inverse=0) {
    kiss_fft_cfg cfg = kiss_fft_alloc(len, inverse==1, nullptr, nullptr);
    kiss_fft_cpx cai[len], cao[len];

    for (int i = 0; i < len; i++) {
        cai[i].r = rin[i];
        cai[i].i = iin[i];
    }

    kiss_fft(cfg, cai, cao);

    for (int i = 0; i < len; i++) {
        rout[i] = cao[i].r;
        iout[i] = cao[i].i;
    }

    free(cfg);
}

void synthesize(const float* mag, const float* phase, float* real, float* imag, int len) {
    kiss_fft_cfg cfg = kiss_fft_alloc(len, true, nullptr, nullptr);
    kiss_fft_cpx cai[len], cao[len];

    for (int i = 0; i < len; i++) {
        // TODO: Is this properly normalized?
        cai[i].r = mag[i] * cos(phase[i]);
        cai[i].i = mag[i] * sin(phase[i]);
    }

    kiss_fft(cfg, cai, cao);

    for (int i = 0; i < len; i++) {
        // TODO: Is this properly normalized?
        real[i] = cao[i].r;
        imag[i] = cao[i].i;
    }

    free(cfg);
}

void analyze(const float* real, const float* imag, float* mag, float* phase, int len) {
    kiss_fft_cfg cfg = kiss_fft_alloc(len, false, nullptr, nullptr);
    kiss_fft_cpx cai[len], cao[len];

    for (int i = 0; i < len; i++) {
        cai[i].r = real[i];
        cai[i].i = imag[i];
    }

    kiss_fft(cfg, cai, cao);

    for (int i = 0; i < len; i++) {
        mag[i] = sqrtf(powf(cao[i].r,2) + powf(cao[i].i,2));
        float p = atan(cao[i].i/cao[i].r);
        if (cao[i].r==0 || mag[i] < 1.e-6*len) {
            p = 0.f;
        } else if (cao[i].r < 0 && cao[i].i > 0) {
            p += M_PI;
        } else if (cao[i].r < 0 && cao[i].i < 0) {
            p += M_PI;
        } else if (cao[i].r > 0 && cao[i].i < 0) {
            p += 2*M_PI;
        }
        phase[i] = p;
    }

    free(cfg);
}
}