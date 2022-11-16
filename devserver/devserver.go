package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	if len(os.Args) < 2 || os.Args[1] == "-h" || os.Args[1] == "--help" || len(os.Args) < 3 {
		fmt.Println("Usage: devserver.exe <port> <directory>")
		return
	}

	port := os.Args[1]
	dir := os.Args[2]

	fmt.Println("Serving files on port " + port + " from directory " + dir)
	log.Fatal(http.ListenAndServe(":"+port, http.FileServer(http.Dir(dir))))
}
