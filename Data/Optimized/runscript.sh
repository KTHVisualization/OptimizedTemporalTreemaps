#!/usr/bin/env bash
source /home1/adobler/.bashrc
cd $1
echo ../../../build/TTMPL "${@:3}" > "$2.log"
../../../build/TTMPL "${@:3}" > "$2.log"