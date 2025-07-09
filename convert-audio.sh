#!/bin/bash

# Audio Conversion Script for Portfolio
# This script helps convert audio files to web-optimized formats

echo "Portfolio Audio Converter"
echo "========================"

if [ $# -eq 0 ]; then
    echo "Usage: ./convert-audio.sh <input-audio-file>"
    echo "Example: ./convert-audio.sh my-music.wav"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_MP3="background.mp3"
OUTPUT_OGG="background.ogg"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found!"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed!"
    echo "Install it with: brew install ffmpeg (macOS) or apt install ffmpeg (Ubuntu)"
    exit 1
fi

echo "Converting '$INPUT_FILE' to web-optimized formats..."

# Convert to MP3 (128kbps, optimized for web)
echo "Creating MP3..."
ffmpeg -i "$INPUT_FILE" -codec:a libmp3lame -b:a 128k -ac 2 -ar 44100 "$OUTPUT_MP3" -y

# Convert to OGG (for better browser compatibility)
echo "Creating OGG..."
ffmpeg -i "$INPUT_FILE" -codec:a libvorbis -b:a 128k -ac 2 -ar 44100 "$OUTPUT_OGG" -y

echo "Conversion complete!"
echo "Files created:"
echo "  - $OUTPUT_MP3"
echo "  - $OUTPUT_OGG"
echo ""
echo "You can now use these files in your portfolio!"