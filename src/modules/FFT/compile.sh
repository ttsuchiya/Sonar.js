#!/usr/bin/env bash

SCRIPTDIR=$(dirname $BASH_SOURCE)
cd ${SCRIPTDIR}

if [ -z "$1" ]; then
  echo "As the first argument, please provide the path to an EMSDK directory."
  exit 1
else
  EMDIR="$1"
fi

${EMDIR}/emsdk update
${EMDIR}/emsdk install latest
${EMDIR}/emsdk activate latest

source ${EMDIR}/emsdk_env.sh

emcc -O2 lib/kiss_fft130/kiss_fft.c src/wasm_fft.cpp \
-I src/ \
-I lib/kiss_fft130/ \
-o build/fft.wasm.js \
-s EXPORT_NAME="'EM'" \
-s EXPORTED_FUNCTIONS="['_transform','_synthesize','_analyze']" \
-s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
-s WASM=1 \
-s EXPORT_ES6=1 \
-s MODULARIZE=1 \
-s MALLOC=emmalloc \
-s ALLOW_MEMORY_GROWTH=1 \
-s USE_ES6_IMPORT_META=0 \
-s SINGLE_FILE=1