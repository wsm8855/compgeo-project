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
var ALLOWED_CHARS = "0123456789.,"

var DEBUG bool = true

func debug(to_print ...interface{}) {
	if DEBUG {
		fmt.Println(to_print...)
	}
}

func isin(char rune, allowed string) bool {
	char_in_allowed := false
	for _, allowed_char := range allowed {
		if char == allowed_char {
			char_in_allowed = true
			break
		}
	}
	return char_in_allowed
}

func safe_str(unsafe_str string, allowed_chars string) bool {
	for _, unsafe_char := range unsafe_str {
		if !isin(unsafe_char, allowed_chars) {
			return false
		}
	}
	return true // implies string is safe
}

func request_is_safe(r *http.Request) bool {
	q := r.URL.Query()
	unsafe_points := q.Get("points")
	unsafe_refine := q.Get("refine")

	security_checks_passed := true
	if !safe_str(unsafe_points, ALLOWED_CHARS) {
		fmt.Println("Security hazard detected in points argument: " + unsafe_points)
		security_checks_passed = false
	}
	if !safe_str(unsafe_refine, ALLOWED_CHARS) {
		fmt.Println("Security hazard detected in refine argument: " + unsafe_refine)
		security_checks_passed = false
	}

	if !security_checks_passed {
		return false
	}

	unsafe_angle := ""
	unsafe_length := ""
	if unsafe_refine == "1" {
		unsafe_angle = q.Get("angle")
		unsafe_length = q.Get("length")
	}
	if len(unsafe_angle) > 0 && !safe_str(unsafe_angle, ALLOWED_CHARS) {
		fmt.Println("Security hazard detected in angle argument: " + unsafe_angle)
		security_checks_passed = false
	}
	if len(unsafe_length) > 0 && !safe_str(unsafe_length, ALLOWED_CHARS) {
		fmt.Println("Security hazard detected in length argument: " + unsafe_length)
		security_checks_passed = false
	}
	return security_checks_passed
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func ajaxHandler(w http.ResponseWriter, r *http.Request) {
	// SECURITY CHECK DO NOT REMOVE
	if !request_is_safe(r) {
		http.Error(w, "Error 404 not found", http.StatusNotFound)
		return
	}
	// ALL INPUTS SAFE
	if !DEV_MODE {
		enableCors(&w)
	}

	q := r.URL.Query()
	points := q.Get("points")
	refine := q.Get("refine")
	angle := ""
	length := ""
	if refine == "1" { // if logic is changed, refer to security check to ensure validity
		angle = q.Get("angle")
		length = q.Get("length")
	}

	debug(refine + " " + angle + " " + length + " " + points) // reverse order that they're passed into the program to accomidate large sets of points

	out, _ := exec.Command(PYTHON_PATH, SCRIPT_PATH, points, refine, angle, length).Output()
	str_out := string(out)
	debug(str_out)

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
		fmt.Println("Usage: devserver.exe <port> <directory> <debug> <optional:script path> <optional:python path>")
		fmt.Println("If <directory> == \"prod\", will not serve files. Only the getTriangulation/ route")
		return
	}

	port := os.Args[1]
	dir := os.Args[2]
	if len(os.Args) > 3 {
		DEBUG = os.Args[3] == "true"
	}
	if len(os.Args) > 4 {
		SCRIPT_PATH = os.Args[4]
	}
	if len(os.Args) > 5 {
		PYTHON_PATH = os.Args[5]
	}

	http.Handle("/", http.FileServer(http.Dir(dir)))
	http.HandleFunc("/getTriangulation", ajaxHandler)

	if DEBUG {
		fmt.Println("DEBUG MODE: Serving files on port " + port + " from directory " + dir)
	} else {
		fmt.Println("PROD MODE: Serving files on port " + port + " from directory " + dir)
	}
	fmt.Println("PYTHON_PATH=\"" + PYTHON_PATH + "\"")
	fmt.Println("SCRIPT_PATH=\"" + SCRIPT_PATH + "\"")
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
