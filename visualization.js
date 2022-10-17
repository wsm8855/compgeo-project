/** 
 * Ruppert's Algorithm Pedagogical Aid
 * Abigail Buckta and Wiley Matthews
 * CSCI-716 Computational Geometry Project
 * Fall 2022
 * 
 * Implements the user interface of the visualization.
*/

import {test_export} from './delaunay.js';
import { rupperts_algorithm } from './rupperts.js';

// debug mode
const DEBUG = true;
function debug(msg) {
    if (DEBUG) {
        console.log(msg);
    }
}

// UI Constants
const CTRLS_MANUAL_ENTRY_MODE_BTN_ELEMENT_ID = 'setup_manual_btn';
const CTRLS_RANDOM_MODE_BTN_ELEMENT_ID       = 'setup_random_btn';
const CTRLS_RANDOM_INPUT_ELEMENT_ID          = 'setup_random_input';
const CTRLS_CLEAR_ELEMENT_ID                 = 'setup_clear_btn';

const CTRLS_TRIANGULATE_ELEMENT_ID           = 'triangulate_btn';

const CTRLS_STEP_ELEMENT_ID                  = 'run_step_btn';
const CTRLS_SPEED_ELEMENT_ID                 = 'run_speed_input';
const CTRLS_PLAY_ELEMENT_ID                  = 'run_play_btn';
const CTRLS_PAUSE_ELEMENT_ID                 = 'run_pause_btn';
const CTRLS_RESTART_ELEMENT_ID               = 'run_reset_btn';

// canvas constants
const CANVAS_ELEMENT_ID = 'canvas';
const CANVAS_WIDTH = 500; //window.innerWidth * 0.8; 20%?
const CANVAS_HEIGHT = CANVAS_WIDTH;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Edge {
    constructor(p0, pf) {
        this.p0 = p0;
        this.pf = pf;
    }
}

class Canvas {
    constructor(canvas_element_id) {
        // get canvas element
        this.element = document.getElementById(canvas_element_id);

        // create drawing context
        this.ctx = canvas.getContext('2d');
    }

    draw_smiley() {
        // draw smiley :)
        this.draw_circle(new Point(125, 125), 20, false);
        this.draw_circle(new Point(375, 125), 20, false); 

        // smile
        this.ctx.beginPath();
        this.ctx.arc(250, 250, 175, 0, Math.PI);
        this.ctx.stroke();

        // nose
        this.draw_edge(new Edge(new Point(250, 225), new Point(275, 250)));
        this.draw_edge(new Edge(new Point(275, 250), new Point(250, 275)));
    }

    draw_circle(p, r, fill) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, 2*Math.PI);
        if (fill) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    draw_edge(e) {
        this.ctx.beginPath();
        this.ctx.moveTo(e.p0.x, e.p0.y);
        this.ctx.lineTo(e.pf.x, e.pf.y);
        this.ctx.stroke();
    }
    
    draw_points(points, r) {
        points.forEach(p => {
            this.draw_circle(p, r, true);
        });
    }
    
    draw_edges(edges) {
        edges.forEach(e => {
            this.draw_edge(e);
        });
    }
}

/**
 * Glue that connects HTML view to core business logic in Visualization.
 * Does things like
 *  - Grab html elements from document
 *  - Defines event listeners that represent what should happen to the visualization
 *    when the user does something
 *  - Registers those event listeners with UI elements.
 */
class UserInterface {

    constructor(canvas, visualization) {
        this.canvas = canvas;
        this.visualization = visualization;

        // grab UI elements from document
        this.grab_elements();

        // setup event listeners on UI elements
        this.setup_event_handlers();
    }

    // CONSTRUCTOR HELPERS
    grab_elements() {
        this.setup_manual_btn   = document.getElementById(CTRLS_MANUAL_ENTRY_MODE_BTN_ELEMENT_ID);
        this.setup_random_btn   = document.getElementById(CTRLS_RANDOM_MODE_BTN_ELEMENT_ID);
        this.setup_random_input = document.getElementById(CTRLS_RANDOM_INPUT_ELEMENT_ID);
        this.setup_clear_btn    = document.getElementById(CTRLS_CLEAR_ELEMENT_ID);

        this.triangulate_btn    = document.getElementById(CTRLS_TRIANGULATE_ELEMENT_ID);

        this.run_step_btn       = document.getElementById(CTRLS_STEP_ELEMENT_ID);
        this.run_speed_input    = document.getElementById(CTRLS_SPEED_ELEMENT_ID);
        this.run_play_btn       = document.getElementById(CTRLS_PLAY_ELEMENT_ID);
        this.run_pause_btn      = document.getElementById(CTRLS_PAUSE_ELEMENT_ID);
        this.run_reset_btn      = document.getElementById(CTRLS_RESTART_ELEMENT_ID);
    }

    setup_event_handlers() {
        // clear button
        this.setup_clear_btn.onclick = () => {this.event_clear()};
    }

    // EVENT HANDLERS
    event_clear() {
        // clear button
        debug("UserInterface.event_clear");
        this.canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    event_rand_input(event) {
        // todo
    }
}

/**
 * Core logic of the visualization.
 */
class Visualization {
    constructor() {
        // TODO
    }
}

class Application {
    constructor(canvas, vis, ui) {
        this.canvas = canvas;
        this.vis = vis;
        this.ui = ui;
    }
}

// needs to outlive the init function, so preserve in global scope (may not need this?)
let app = null;
function init() {
    // Setup canvas
    const canvas = new Canvas(CANVAS_ELEMENT_ID);
    canvas.draw_smiley(); // :)

    // Setup core visualization state/model
    const vis = new Visualization();

    // Setup user interface controls
    const ui = new UserInterface(canvas, vis);

    app = new Application(canvas, vis, ui);

    debug("init complete")
    test_export('imports work!');
};

// ensure page is done loading before doing anything
window.onload = init;