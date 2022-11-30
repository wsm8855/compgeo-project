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
	if refine == "1" {
		angle = q.Get("angle")
	}

	out, _ := exec.Command("python3", "../rupperts.py", points, refine, angle).Output()
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
		fmt.Println("Usage: devserver.exe <port> <directory>")
		return
	}

	port := os.Args[1]
	dir := os.Args[2]

	http.Handle("/", http.FileServer(http.Dir(dir)))
	http.HandleFunc("/getTriangulation", ajaxHandler)

	fmt.Println("Serving files on port " + port + " from directory " + dir)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
