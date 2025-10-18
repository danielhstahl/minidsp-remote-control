#!/bin/bash

# PipeWire Automatic Port Linker
# This script automatically finds and links ports between a source node (like an
# AES67 receiver) and a sink node (like a speaker/headphone output).

# --- Configuration ---

# You should set the correct node names here, or pass them as arguments.
# Example Source (AES67 Receiver): aes67-source
# Example Sink (Local Audio Output): alsa_output.platform-soc_audio.analog-stereo
SOURCE_NODE="$1"
SINK_NODE="$2"

pw-link "$SOURCE_NODE:receive_1" "$SINK_NODE:playback_FL"
pw-link "$SOURCE_NODE:receive_2" "$SINK_NODE:playback_FR"
pw-link "$SOURCE_NODE:receive_3" "$SINK_NODE:playback_RL"
pw-link "$SOURCE_NODE:receive_4" "$SINK_NODE:playback_RR"
pw-link "$SOURCE_NODE:receive_5" "$SINK_NODE:playback_LFE" # switched LFE and C on purpose
pw-link "$SOURCE_NODE:receive_6" "$SINK_NODE:playback_FC"
pw-link "$SOURCE_NODE:receive_7" "$SINK_NODE:playback_SL"
pw-link "$SOURCE_NODE:receive_8" "$SINK_NODE:playback_SR"
