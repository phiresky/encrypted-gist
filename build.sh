while true; do tsc; node runbabel.js; inotifywait -e modify -r src; done
