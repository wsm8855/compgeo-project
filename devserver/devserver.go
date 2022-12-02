package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
)

var DEV_MODE = true
var SCRIPT_PATH = "../rupperts.py"
var PYTHON_PATH = "python3"

var DEBUG bool = true

func debug(to_print ...interface{}) {
	if DEBUG {
		fmt.Println(to_print...)
	}
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func ajaxHandler(w http.ResponseWriter, r *http.Request) {
	if !DEV_MODE {
		enableCors(&w)
	}

	q := r.URL.Query()
	points := q.Get("points")
	refine := q.Get("refine")
	angle := ""
	length := ""
	if refine == "1" {
		angle = q.Get("angle")
		length = q.Get("length")
	}

	debug(refine + " " + angle + " " + length + " " + points) // reverse order that they're passed into the program to accomidate large sets of points

	out, _ := exec.Command(PYTHON_PATH, SCRIPT_PATH, points, refine, angle, length).Output()
	str_out := string(out)
	fmt.Println(str_out)

	// create json response from struct
	a, err := json.Marshal(str_out)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	_, err = w.Write(a)
	if err != nil {
		fmt.Println("handle error")
	}
}

func main() {
	if len(os.Args) < 2 || os.Args[1] == "-h" || os.Args[1] == "--help" || len(os.Args) < 3 {
		fmt.Println("Usage: devserver.exe <port> <directory|\"prod\"> <optional:script path> <optional:python path>")
		fmt.Println("If <directory> == \"prod\", will not serve files. Only the getTriangulation/ route")
		return
	}

	port := os.Args[1]
	dir := os.Args[2]
	if len(os.Args) > 3 {
		SCRIPT_PATH = os.Args[3]
	}
	if len(os.Args) > 4 {
		PYTHON_PATH = os.Args[4]
	}

	DEV_MODE = dir != "prod"

	if DEV_MODE {
		// only serve files if not in production mode
		http.Handle("/", http.FileServer(http.Dir(dir)))
	}
	http.HandleFunc("/getTriangulation", ajaxHandler)

	if DEV_MODE {
		fmt.Println("DEV MODE: Serving files on port " + port + " from directory " + dir)
	} else {
		fmt.Println("PROD MODE: Listening for getTriangulation/ requests on port " + port)
	}
	fmt.Println("PYTHON_PATH=\"" + PYTHON_PATH + "\"")
	fmt.Println("SCRIPT_PATH=\"" + SCRIPT_PATH + "\"")
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
