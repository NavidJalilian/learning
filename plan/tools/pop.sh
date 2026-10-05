#!/bin/bash
# pop.sh <done-id> <launched-id> : record a finished build and remove the launched id from the queue
cd "$(dirname "$0")"; [ -n "$1" ] && echo "$1" >> done.txt; [ -n "$2" ] && sed -i "/^$2\$/d" queue.txt
echo "done=$(sort -u done.txt | wc -l) queued=$(wc -l < queue.txt) next=$(head -1 queue.txt)"
