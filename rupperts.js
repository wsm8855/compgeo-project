/** 
 * Ruppert's Algorithm Pedagogical Aid
 * Abigail Buckta and Wiley Matthews
 * CSCI-716 Computational Geometry Project
 * Fall 2022
 * 
 * 
*/

import {test_export} from './delaunay.js';

// canvas constants
const CANVAS_ELEMENT_ID = 'canvas';
const CANVAS_WIDTH = 500; //window.innerWidth * 0.8; 20%?
const CANVAS_HEIGHT = CANVAS_WIDTH;

let canvas = null; // global starts uninitialized

function initCanvas() {
    // get canvas element
    canvas = document.getElementById(CANVAS_ELEMENT_ID);

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
    test_export('imports work!');
};

window.onload = setup; // ensure page is done loading before doing anything
