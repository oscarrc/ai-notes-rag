#!/bin/bash

OUTPUT_FILE="submission.txt"

if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
fi

git ls-files | sort | while read -r file; do
    # Skip binary files and other non-text files (adjust as needed)
    if [[ -f "$file" && ! "$file" =~ \.(jpg|jpeg|png|gif|svg|ico|woff|woff2|eot|ttf|otf|mp3|mp4|zip|tar|gz|pdf)$ ]]; then
        # Add file path as header
        echo "======================" >> "$OUTPUT_FILE"
        echo "FILE: $file" >> "$OUTPUT_FILE"
        echo "======================" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # Add file content
        cat "$file" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done