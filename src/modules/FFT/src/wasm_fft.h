#include "kiss_fft.h"

extern "C" {
void transform(const float* rin, const float* iin, float* rout, float* iout, int len, int inverse);
void synthesize(const float* mag, const float* phase, float* real, float* imag, int len);
void analyze(const float* real, const float* imag, float* mag, float* phase, int len);
}