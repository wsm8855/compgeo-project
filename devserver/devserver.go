package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
)

var DEBUG bool = true

func debug(to_print ...interface{}) {
	if DEBUG {
		fmt.Println(to_print...)
	}
}

func ajaxHandler(w http.ResponseWriter, r *http.Request) {
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

	out, _ := exec.Command("python3", "../rupperts.py", points, refine, angle, length).Output()
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
		fmt.Println("Usage: devserver.exe <port> <directory|\"prod\">")
		fmt.Println("If <directory> == \"prod\", will not serve files. Only the getTriangulation/ route")
		return
	}

	port := os.Args[1]
	dir := os.Args[2]

	dev_mode := dir != "prod"

	if dev_mode {
		// only serve files if not in production mode
		http.Handle("/", http.FileServer(http.Dir(dir)))
	}
	http.HandleFunc("/getTriangulation", ajaxHandler)

	if dev_mode {
		fmt.Println("DEV MODE: Serving files on port " + port + " from directory " + dir)
	} else {
		fmt.Println("PROD MODE: Listening for getTriangulation/ requests on port " + port)
	}
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
