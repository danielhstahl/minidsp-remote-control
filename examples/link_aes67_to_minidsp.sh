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

# --- Argument Check ---
if [ -z "$SOURCE_NODE" ] || [ -z "$SINK_NODE" ]; then
    echo "Usage: $0 <SOURCE_NODE_NAME> <SINK_NODE_NAME>"
    echo "Example: $0 aes67-source alsa_output.platform-soc_audio.analog-stereo"
    exit 1
fi

# --- Status Check ---
echo "--- PipeWire Link Automation ---"
echo "Source Node: $SOURCE_NODE"
echo "Sink Node:   $SINK_NODE"
echo "--------------------------------"

# Check if PipeWire service is running (critical to avoid 'No such file or directory' error)
if ! systemctl --user is-active --quiet pipewire; then
    echo "WARNING: PipeWire service does not appear to be running for the current user."
    echo "This is the most common cause of errors. Ensure it's started."
fi

# --- Get and Validate Ports ---

echo "Querying available ports..."

# Get all output ports from the source node
# pw-link -o lists output ports. grep filters for the source node name.
SOURCE_PORTS=$(pw-link -o 2>/dev/null | grep "^$SOURCE_NODE:")
if [ -z "$SOURCE_PORTS" ]; then
    echo "ERROR: Could not find any output ports for source node '$SOURCE_NODE'."
    echo "Is the source node active? Use 'pw-cli list-objects Node' to confirm the name."
    exit 1
fi

# Get all input ports for the sink node
# pw-link -i lists input ports. grep filters for the sink node name.
SINK_PORTS=$(pw-link -i 2>/dev/null | grep "^$SINK_NODE:")
if [ -z "$SINK_PORTS" ]; then
    echo "ERROR: Could not find any input ports for sink node '$SINK_NODE'."
    echo "Is the sink node active? Use 'pw-cli list-objects Node' to confirm the name."
    exit 1
fi

# Convert the lists into arrays (using newlines as the delimiter)
IFS=$'\n' SOURCE_ARRAY=($SOURCE_PORTS)
IFS=$'\n' SINK_ARRAY=($SINK_PORTS)

SOURCE_COUNT=${#SOURCE_ARRAY[@]}
SINK_COUNT=${#SINK_ARRAY[@]}

echo "Found $SOURCE_COUNT source ports and $SINK_COUNT sink ports."

if [ "$SOURCE_COUNT" -ne "$SINK_COUNT" ]; then
    echo "WARNING: Port count mismatch ($SOURCE_COUNT != $SINK_COUNT). Linking will proceed based on the minimum count."
fi

# Determine the number of links to create
MAX_LINKS=$(( SOURCE_COUNT < SINK_COUNT ? SOURCE_COUNT : SINK_COUNT ))

# --- Create Links ---

echo "Creating $MAX_LINKS links..."

NEW_LINK_COUNT=0
for (( i=0; i<$MAX_LINKS; i++ )); do
    SRC=${SOURCE_ARRAY[$i]}
    DST=${SINK_ARRAY[$i]}

    # Check if the link already exists before attempting to create it
    if pw-link -l 2>/dev/null | grep -q "$SRC -> $DST"; then
        echo "  [SKIP] Link already exists: $SRC -> $DST"
    else
        echo "  [LINK] $SRC -> $DST"
        # The pw-link command attempts to create the link
        if pw-link "$SRC" "$DST" 2>/dev/null; then
            NEW_LINK_COUNT=$((NEW_LINK_COUNT + 1))
        else
            echo "  [FAIL] Failed to link $SRC to $DST. Check PipeWire logs for details."
        fi
    fi
done

echo "---"
echo "Automation complete. $NEW_LINK_COUNT new links created."
if [ "$MAX_LINKS" -eq 0 ]; then
    echo "No ports were linked. Review the node names and service status."
fi
