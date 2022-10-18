/** 
 * Ruppert's Algorithm Pedagogical Aid
 * Abigail Buckta and Wiley Matthews
 * CSCI-716 Computational Geometry Project
 * Fall 2022
 * 
 * Implements the user interface of the visualization.
*/

import {test_export} from "./delaunay.js";
import { rupperts_algorithm } from "./rupperts.js";

// debug mode
const DEBUG = true;
function debug(msg) {
    if (DEBUG) {
        console.log(msg);
    }
}

// UI Constants
const CTRLS_MANUAL_ENTRY_MODE_BTN_ELEMENT_ID = "setup_manual_btn";
const CTRLS_RANDOM_MODE_BTN_ELEMENT_ID       = "setup_random_btn";
const CTRLS_RANDOM_INPUT_ELEMENT_ID          = "setup_random_input";
const CTRLS_CLEAR_ELEMENT_ID                 = "setup_clear_btn";

const CTRLS_TRIANGULATE_ELEMENT_ID           = "triangulate_btn";

const CTRLS_STEP_ELEMENT_ID                  = "run_step_btn";
const CTRLS_SPEED_ELEMENT_ID                 = "run_speed_input";
const CTRLS_PLAY_ELEMENT_ID                  = "run_play_btn";
const CTRLS_PAUSE_ELEMENT_ID                 = "run_pause_btn";
const CTRLS_RESTART_ELEMENT_ID               = "run_reset_btn";

// canvas constants
const CANVAS_ELEMENT_ID = "canvas";
const CANVAS_WIDTH = 500; //window.innerWidth * 0.8; 20%?
const CANVAS_HEIGHT = CANVAS_WIDTH;

function randint(min, max) {
    // min and max inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// data structures
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

// program function
const GRID_DIMS = new Point(CANVAS_WIDTH, CANVAS_HEIGHT);

// enumeration for visualization state
const VisState = {
    Setup: "Setup",
    // ManualPointEntry: "ManualPointEntry",
    Triangulate: "Triangulate",
    Run: "Run",
};



class Canvas {
    constructor(canvas_element_id) {
        // get canvas element
        this.element = document.getElementById(canvas_element_id);

        // create drawing context
        this.ctx = canvas.getContext("2d");
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

    clear() {
        this.ctx.clearRect(0, 0, this.element.width, this.element.height);
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

    constructor(canvas, vis) {
        this.canvas = canvas;
        this.vis = vis;

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
        // manual entry mode
        this.setup_manual_btn.onclick = () => {this.manual_entry_mode()};

        // clear button
        this.setup_clear_btn.onclick = () => {this.event_clear()};

        // rng input validation
        this.setup_random_input.oninput = () => {this.event_rng_input()};

        // rng input generation
        this.setup_random_btn.onclick = () => {this.event_populate_random()};
    }

    // EVENT HANDLERS
    manual_entry_mode() {
        debug("UserInterface.manual_entry_mode");
        // very special mode
        const starting_button_states = this._disable_btns();
        this.vis.start_manual_entry_mode();
        this.canvas.clear();

        this.setup_manual_btn.textContent = "Submit Entry";
        this.setup_manual_btn.disabled = false;

        // set event listeners
        // user clicks submit to exit mode
        this.setup_manual_btn.onclick = () => {this.exit_manual_entry_mode(starting_button_states)};

        // user clicks on canvas to add point
        this.canvas.element.onclick = (event) => {this.canvas_click_manual_entry_mode(event)};

    }

    canvas_click_manual_entry_mode(event) {
        debug("UserInterface.canvas_click_manual_entry_mode");
        const x = event.offsetX;
        const y = event.offsetY;
        const new_point = new Point(x, y);
        this.vis.add_point_manual_entry_mode(new_point);
        this.canvas.clear();
        this.draw_state();
    }

    exit_manual_entry_mode(starting_button_states) {
        debug("UserInterface.exit_manual_entry_mode");
        // user submited entry.
        this.setup_manual_btn.disabled = true;
        this.setup_manual_btn.textContent = "Manual Entry Mode";
        this.setup_manual_btn.disabled = false;
        this._set_btn_status(starting_button_states);
        this.setup_manual_btn.onclick = () => {this.manual_entry_mode()};
        this.vis.exit_manual_entry_mode(); // check if triangluate butto should be active
        this.triangulate_btn.disabled = this.vis.points.length < 3;
        this.event_rng_input();
    }

    _disable_btns() {
        debug("UserInterface._disable_btns");
        const btn_states = {
            setup_manual_btn: this.setup_manual_btn.disabled,
            setup_clear_btn: this.setup_manual_btn.disabled,
            setup_random_btn: this.setup_manual_btn.disabled,
            triangulate_btn: this.triangulate_btn.disabled
        }

        this.setup_manual_btn.disabled = true;
        this.setup_clear_btn.disabled = true;
        this.setup_random_btn.disabled = true;
        this.triangulate_btn.disabled = true;

        return btn_states;
    }

    _set_btn_status(btn_states) {
        debug("UserInterface._set_btn_status");
        this.setup_manual_btn.disabled = btn_states.setup_manual_btn;
        this.setup_clear_btn.disabled = btn_states.setup_manual_btn;
        this.setup_random_btn.disabled = btn_states.setup_manual_btn;
        this.triangulate_btn.disabled = btn_states.triangulate_btn;
    }

    event_rng_input() {
        // validate input is an integer >= 3. if not, disable the random generation button.
        debug("UserInterface.event_rng_input");
        if (this.vis.in_manual_entry_mode) {
            return;
        }
        const input_val = this.setup_random_input.value;
        if (input_val < 3) {
            this.setup_random_btn.disabled = true;
        } else {
            this.setup_random_btn.disabled = false;
        }
    }

    event_populate_random() {
        debug("UserInterface.event_populate_random");
        const num_points = this.setup_random_input.value;
        this.vis.populate_random(num_points);
        this.vis.populated = true;
        this.triangulate_btn.disabled = this.vis.points.length < 3;
        this.canvas.clear();
        this.draw_state();
    }

    event_clear() {
        // clear button
        debug("UserInterface.event_clear");
        this.canvas.clear();
    }

    draw_state() {
        this.canvas.draw_points(this.vis.points, 5);
    }
}

/**
 * Core logic of the visualization.
 */
class Visualization {
    constructor(grid_dims) {
        // state variables
        this.state = VisState.Setup;
        this.in_manual_entry_mode = false;
        this.populated = false;
        this.triangulation_complete = false;

        this.temp_manual_entry_mode_set = null;

        // grid dimensions (max x and y coords)
        this.grid_dims = grid_dims;

        // graph state
        this.points = [];
        this.edges = [];
    }

    populate_random(num_points) {
        // assumes num_points >= 3
        const new_points = new Set();
        while (new_points.size < num_points) {
            const rng_x = randint(0, this.grid_dims.x);
            const rng_y = randint(0, this.grid_dims.y);
            const new_point = new Point(rng_x, rng_y);
            new_points.add(new_point);
        }
        this.points =  [...new_points];
    }

    start_manual_entry_mode() {
        this.in_manual_entry_mode = true;
        this.points = [];
        this.temp_manual_entry_mode_set = new Set();
        this.populated = false;
    }

    add_point_manual_entry_mode(new_point) {
        if (this.temp_manual_entry_mode_set.has(new_point)) {
            return;
        }
        this.temp_manual_entry_mode_set.add(new_point);
        this.points = [...this.temp_manual_entry_mode_set];
    }

    exit_manual_entry_mode() {
        this.points = [...this.temp_manual_entry_mode_set];
        this.populated = this.points.length >= 3;
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
    const vis = new Visualization(GRID_DIMS);

    // Setup user interface controls
    const ui = new UserInterface(canvas, vis);

    app = new Application(canvas, vis, ui);

    debug("init complete")
    test_export("imports work!");
};

// ensure page is done loading before doing anything
window.onload = init;