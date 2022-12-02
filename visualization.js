/** 
 * Ruppert's Algorithm Pedagogical Aid
 * Abigail Buckta and Wiley Matthews
 * CSCI-716 Computational Geometry Project
 * Fall 2022
 * 
 * Implements the user interface of the visualization.
*/

import { delaunay_triangulate } from "./delaunay.js";
import { rupperts_algorithm } from "./rupperts.js";

// debug mode
const DEBUG = true;
function debug(msg) {
    if (DEBUG) {
        console.log(msg);
    }
}

// CONSTANTS
// backend
const BACKEND_ADDRESS = 'http://67.205.189.195' // will need to connect to backend in production

// input validation
const INPUT_MIN_POINTS = 3
const INPUT_MIN_ANGLE = 21.0
const INPUT_MIN_LENGTH = 1

// UI
const CTRLS_MANUAL_ENTRY_MODE_BTN_ELEMENT_ID = "setup_manual_btn";
const CTRLS_RANDOM_MODE_BTN_ELEMENT_ID       = "setup_random_btn";
const CTRLS_RANDOM_INPUT_ELEMENT_ID          = "setup_random_input";
const CTRLS_CLEAR_ELEMENT_ID                 = "setup_clear_btn";

const CTRLS_TRIANGULATE_ELEMENT_ID           = "triangulate_btn";

const CTRLS_REFINE_ANGLE_INPUT               = "refine_angle_input";
const CTRLS_REFINE_LENGTH_INPUT              = "refine_length_input";
const CTRLS_REFINE_BTN_ELEMENT               = "refine_btn";
const CTRLS_STEP_ELEMENT_ID                  = "run_step_btn";
const CTRLS_SPEED_ELEMENT_ID                 = "run_speed_input";
const CTRLS_PLAY_ELEMENT_ID                  = "run_play_btn";
const CTRLS_PAUSE_ELEMENT_ID                 = "run_pause_btn";
const CTRLS_RESTART_ELEMENT_ID               = "run_reset_btn";

// canvas
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

class Triangle {
    constructor(p0, p1, p2) {
        this.v0 = p0;
        this.v1 = p1;
        this.v2 = p2;
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

    draw_triangle(t) {
        this.draw_edge(new Edge(t.v0, t.v1));
        this.draw_edge(new Edge(t.v1, t.v2));
        this.draw_edge(new Edge(t.v2, t.v0));
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

    draw_triangles(triangles) {
        triangles.forEach(t => {
            this.draw_triangle(t);
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
        debug("UserInterface.constructor");

        this.canvas = canvas;
        this.vis = vis;

        // grab UI elements from document
        this.grab_elements();

        // setup event listeners on UI elements
        this.setup_event_handlers();
    }

    // CONSTRUCTOR HELPERS
    grab_elements() {
        debug("UserInterface.grab_elements");

        this.setup_manual_btn       = document.getElementById(CTRLS_MANUAL_ENTRY_MODE_BTN_ELEMENT_ID);
        this.setup_random_btn       = document.getElementById(CTRLS_RANDOM_MODE_BTN_ELEMENT_ID);
        this.setup_random_input     = document.getElementById(CTRLS_RANDOM_INPUT_ELEMENT_ID);
        this.setup_clear_btn        = document.getElementById(CTRLS_CLEAR_ELEMENT_ID);

        this.triangulate_btn        = document.getElementById(CTRLS_TRIANGULATE_ELEMENT_ID);

        this.run_refine_angle_input = document.getElementById(CTRLS_REFINE_ANGLE_INPUT);
        this.run_refine_length_input  = document.getElementById(CTRLS_REFINE_LENGTH_INPUT);
        this.run_refine_btn         = document.getElementById(CTRLS_REFINE_BTN_ELEMENT);
        this.run_step_btn           = document.getElementById(CTRLS_STEP_ELEMENT_ID);
        this.run_speed_input        = document.getElementById(CTRLS_SPEED_ELEMENT_ID);
        this.run_play_btn           = document.getElementById(CTRLS_PLAY_ELEMENT_ID);
        this.run_pause_btn          = document.getElementById(CTRLS_PAUSE_ELEMENT_ID);
        this.run_reset_btn          = document.getElementById(CTRLS_RESTART_ELEMENT_ID);
    }

    setup_event_handlers() {
        debug("UserInterface.setup_event_handlers");

        // manual entry mode
        this.setup_manual_btn.onclick = () => {this.manual_entry_mode()};

        // clear button
        this.setup_clear_btn.onclick = () => {this.event_clear()};

        // rng input validation
        this.setup_random_input.oninput = () => {this.event_rng_input()};

        // rng input generation
        this.setup_random_btn.onclick = () => {this.event_populate_random()};

        // triangulate button
        this.triangulate_btn.onclick = () => {this.event_triangulate()};

        this.run_refine_angle_input.oninput = () => {this.event_angle_input()};

        this.run_refine_length_input.oninput = () => {this.event_length_input()};

        this.run_refine_btn.onclick = () => {this.event_refine()};
    }

    // EVENT HANDLERS
    manual_entry_mode() {
        // enter manual entry mode, whch dramatially changes behavior of UI
        debug("UserInterface.manual_entry_mode");

        // disable UI
        const starting_button_states = this._disable_btns();

        // let vis know mode has started
        this.vis.start_manual_entry_mode();

        // clear canvas
        this.canvas.clear();

        // change manual entry mode button to submit button
        this.setup_manual_btn.textContent = "Submit Entry";
        this.setup_manual_btn.disabled = false;

        // set event listeners
        // user clicks submit to exit mode
        this.setup_manual_btn.onclick = () => {this.exit_manual_entry_mode(starting_button_states)};

        // user clicks on canvas to add point
        this.canvas.element.onclick = (event) => {this.canvas_click_manual_entry_mode(event)};
    }

    canvas_click_manual_entry_mode(event) {
        // when in manual entry mode, user clicks canvas
        debug("UserInterface.canvas_click_manual_entry_mode");

        // parse event and create new point
        const x = event.offsetX;
        const y = event.offsetY;
        const new_point = new Point(x, y);

        // submit point to vis
        this.vis.add_point_manual_entry_mode(new_point);

        // redraw canvas
        this.canvas.clear();
        this.draw_state();
    }

    exit_manual_entry_mode(starting_button_states) {
        // user submited entry
        debug("UserInterface.exit_manual_entry_mode");

        // remove canvas event listener
        this.canvas.element.onclick = null;

        // tell visualization to exit mode
        this.vis.exit_manual_entry_mode();
        
        // reset manual entry button
        this.setup_manual_btn.disabled = true;
        this.setup_manual_btn.textContent = "Manual Entry Mode";
        this.setup_manual_btn.disabled = false;
        this.setup_manual_btn.onclick = () => {this.manual_entry_mode()};

        // reset button states
        this._set_btn_status(starting_button_states);

        // check for necessary changes to button states
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
        if (input_val < INPUT_MIN_POINTS) {
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
        this.vis.reset_state();
        this.canvas.clear();
        this.triangulate_btn.disabled = true;
        this.run_refine_btn.disabled = true;
        this.run_step_btn.disabled = true;
    }

    event_triangulate() {
        debug("UserInterface.event_triangulate");
        this.vis.triangulate();
        this.canvas.clear();
        this.draw_state();
        if (this._angle_input_valid() && this._length_input_valid()) {
            this.run_refine_btn.disabled = false;
        }
    }

    _angle_input_valid() {
        const input_val = this.run_refine_angle_input.value;
        if (input_val > INPUT_MIN_ANGLE) {
            return true;
        } else {
            return false;
        }
    }

    event_angle_input() {
        debug("UserInterface.event_angle_input");
        if (this.vis.in_manual_entry_mode) {
            return;
        }
        if (this._angle_input_valid() && this.vis.triangulation_complete) {
            this.run_refine_btn.disabled = false;
        } else {
            this.run_refine_btn.disabled = true;
        }
    }

    _length_input_valid() {
        debug("UserInterface._length_input_valid");
        if (this.vis.in_manual_entry_mode) {
            return;
        }
        const input_val = this.run_refine_length_input.value;
        if (input_val >= INPUT_MIN_LENGTH) {
            return true;
        } else {
            return false;
        }
    }

    event_length_input() {
        debug("UserInterface.event_length_input");
        if (this.vis.in_manual_entry_mode) {
            return;
        }
        if (this._length_input_valid() && this.vis.triangulation_complete) {
            this.run_refine_btn.disabled = false;
        } else {
            this.run_refine_btn.disabled = true;
        }
    }

    event_refine() {
        debug("UserInterface.event_refine");
        const angle_val = this.run_refine_angle_input.value;
        const length_val = this.run_refine_length_input.value;
        this.vis.refine(angle_val, length_val);
        this.canvas.clear();
        this.draw_state();
        this.run_step_btn.disabled = false;

    }

    draw_state() {
        this.canvas.draw_triangles(this.vis.triangles);
        this.canvas.draw_points(this.vis.points, 5);
    }
}

/**
 * Core logic of the visualization.
 */
class Visualization {
    constructor(grid_dims) {
        // properties
        this.grid_dims = grid_dims;

        // set initial state
        this.reset_state();

        // manual entry mode state
        this.in_manual_entry_mode = false;
        this.temp_manual_entry_mode_set = null;
    }

    reset_state() {
        // state enum
        this.state = VisState.Setup;

        // display state
        this.points = [];
        this.triangles = [];

        // saved hidden state
        this.input_points = [];
        this.delaunay_points = [];
        this.delaunay_triangles = [];
        this.refined_points = [];
        this.refined_triangles = [];

        // setup state
        this.populated = false;
        this.triangulation_complete = false;
        this.refinement_complete = false;
    }

    populate_random(num_points) {
        // assumes num_points >= 3
        this.reset_state();
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
        this.reset_state();
        this.in_manual_entry_mode = true;
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
        this.in_manual_entry_mode = false;
    }

    triangulate() {
        // assumes populated
        if (!this.triangulation_complete) {
            this.input_points = [...this.points]; // save original points if re-triangulation is desired
        }
        var input_points = this.input_points.map(function(point) {
            return [point['x'], point['y']];
        });
        
        // request delaunay triangulation
        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", BACKEND_ADDRESS + "/getTriangulation?points=" + input_points + "&refine=0", false);
        xhttp.send();
        const str_response = xhttp.responseText;
        const parsed = JSON.parse(JSON.parse(str_response));
        const triangles_to_add = parsed[0];

        // convert the triangles from raw to our format
        const new_triangles = [];
        for (let i=0; i < triangles_to_add.length; i += 1) {
            const new_triangle = new Triangle(
                this.input_points[triangles_to_add[i][0]],
                this.input_points[triangles_to_add[i][1]],
                this.input_points[triangles_to_add[i][2]]
            );
            new_triangles.push(new_triangle);
        }

        // update saved state
        this.delaunay_points = [...this.input_points];
        this.delaunay_triangles = new_triangles;

        // update visualization state
        this.points = [...this.delaunay_points];
        this.triangles = [...this.delaunay_triangles];
        this.triangulation_complete = true;
    }

    refine(angle, length) {
        // assumes populated
        const input_points = this.delaunay_points.map(function(point) {
            return [point['x'], point['y']];
        });
        console.log(input_points)

        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", BACKEND_ADDRESS + "/getTriangulation?points=" + input_points + "&refine=1&angle=" + angle + "&length=" + length, false);
        xhttp.send();
        const str_response = xhttp.responseText;
        const parsed = JSON.parse(JSON.parse(str_response));
        const triangles_to_add = parsed[0];
        const points_to_add = parsed[1];

        // use delaunay to compute triangle

        const new_points = [...this.delaunay_points];
        for (let i=0; i < points_to_add.length; i += 1) {
            const new_point = new Point(points_to_add[i][0], points_to_add[i][1]);
            new_points.push(new_point);
        }

        // convert the triangles from raw to our format
        const new_triangles = [];
        for (let i=0; i < triangles_to_add.length; i += 1) {
            const new_triangle = new Triangle(
                new_points[triangles_to_add[i][0]],
                new_points[triangles_to_add[i][1]],
                new_points[triangles_to_add[i][2]]
            );
            new_triangles.push(new_triangle);
        }

        // update saved state
        this.refined_points = new_points;
        this.refined_triangles = new_triangles;

        // update visualization state
        this.points = [...this.refined_points];
        this.triangles = [...this.refined_triangles];
        this.refinement_complete = true;
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

    debug("init complete");
};

// ensure page is done loading before doing anything
window.onload = init;