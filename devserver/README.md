# Developement Server

Since the implementation makes use of JavaScript modules, it is not possible to run the project simply
by opening the html documents directly with your browser due to CORS policy restrictions. Instead,
you can run this simple development server to serve the files from the base directory of the repo.

`devserver.go` implements a basic HTTP webserver that accomplishes this task.

## How to run the server

`Usage: devserver.exe <port> <directory>`

To run the server, run the executable. You must specify the desired port number and directory from which
files are to be served (again, this should be the base directory of the repo.)

Example usage: `> devserver.exe 9090 ../../compgeo-project`

Example usage: `> compgeo-project/devserver/devserver.exe 9090 compgeo-project`

## Compilation

The server is implemented in Go. Only native Go packages are required for compilation. Compilation can
be performed via the command:

`> go build devserver.go`

Which will produce `devserver.exe`. 

If you do not have Go installed on you system, you can either:
 - Install it (do that, go is great :) )
 - Just run it from the included executable (compiled for Windows 10)
