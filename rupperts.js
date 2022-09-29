/** 
 * Ruppert's Algorithm Pedagogical Aid
 * Abigail Buckta and Wiley Matthews
 * CSCI-716 Computational Geometry Project
 * Fall 2022
 * 
 * 
*/

// canvas constants
CANVAS_ELEMENT_ID = 'canvas';
CANVAS_WIDTH = 500; //window.innerWidth * 0.8; 20%?
CANVAS_HEIGHT = CANVAS_WIDTH;

canvas = null; // global starts uninitialized

function initCanvas() {
    // get canvas element
    canvas = document.getElementById('canvas');

    // style canvas
    canvas.style.width = CANVAS_WIDTH + "px";
    canvas.style.height = CANVAS_HEIGHT + "px";
}

function initControls() {
    // TODO
}

function setup() {
    // UI setup
    initCanvas();
    initControls();
}

window.onload = setup; // ensure page is done loading before doing anything
