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

// UI Constants
// controls
// CONSTANTS
// backend
const BACKEND_ADDRESS = ''

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
const CTRLS_COMPLETE_REFINEMENT_BTN_ID       = "run_complete_refinement_btn";
const CTRLS_SPEED_ELEMENT_ID                 = "run_speed_input";
const CTRLS_PLAY_ELEMENT_ID                  = "run_play_btn";
const CTRLS_PAUSE_ELEMENT_ID                 = "run_pause_btn";
const CTRLS_RESTART_ELEMENT_ID               = "run_reset_btn";

// code display
const CODE_LINE_ID_PREFIX                    = "line_";
const STYLE_CLASS_CODE_BOLD                  = "code_bold";

// code line meanings
const CODE_NUM_LINES                         = 17; // expect elements with ids line_1 ... line_17 exist.
const CODE_TRIANGULATE_LINE                  = 2;

// canvas constants
// canvas
const CANVAS_ELEMENT_ID = "canvas";
const CANVAS_WIDTH = 500; //window.innerWidth * 0.8; 20%?
const CANVAS_HEIGHT = CANVAS_WIDTH;

const COLOR_BLACK = "#000000";
const COLOR_GREEN = "#00FF00";
const COLOR_RED = "#FF0000";
const POINT_SIZE = 5;

// event/steps
const EVENT_ENCROACHED_UPON = "encroached_upon";
const STEP_ENCROACHED_UPON_CHECK     = EVENT_ENCROACHED_UPON + "_check";
const STEP_ENCROACHED_UPON_NEW       = EVENT_ENCROACHED_UPON + "_new";
const STEP_ENCROACHED_UPON_REFRESH   = EVENT_ENCROACHED_UPON + "_refresh";

// EVENT_ENCROACHED_UPON = "encroached_upon";

function randint(min, max) {
    // min and max inclusive
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function euclidian_between_points(p1, p2) {
    debug("euclidian_between_points");
    const d = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    return d;
}

function parse_steps_from_events(events) {
    const steps = [];
    events.forEach((event) => {
        switch (event.type) {
            case EVENT_ENCROACHED_UPON:
                steps.push({
                    type: STEP_ENCROACHED_UPON_CHECK,
                    new_point: event.new_point,
                    offending_point: event.offending_point,
                    segment: event.segment
                });
                steps.push({
                    type: STEP_ENCROACHED_UPON_NEW,
                    new_point: event.new_point
                });
                steps.push({
                    type: STEP_ENCROACHED_UPON_REFRESH,
                    new_point: event.new_point
                });
                break;
        }
    });
    return steps;
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

class Circle {
    constructor(center_point, radius_px) {
        this.center = center_point;
        this.radius = radius_px;
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

    draw_circle(p, r, fill, c=COLOR_BLACK) {
        // debug("Canvas.draw_circle");
        // debug({p, r, fill, c});
        this.ctx.strokeStyle = c;
        this.ctx.fillStyle = c;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, r, 0, 2*Math.PI);
        if (fill) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    draw_circles(circles, fill, c=COLOR_BLACK) {
        debug("Canvas.draw_circles");
        // debug({circles, fill, c});
        circles.forEach(cir => {
            this.draw_circle(cir.center, cir.radius, fill, c);
        });
    }

    draw_edge(e, c=COLOR_BLACK) {
        this.ctx.strokeStyle = c;
        this.ctx.beginPath();
        this.ctx.moveTo(e.p0.x, e.p0.y);
        this.ctx.lineTo(e.pf.x, e.pf.y);
        this.ctx.stroke();
    }

    draw_triangle(t, c=COLOR_BLACK) {
        this.draw_edge(new Edge(t.v0, t.v1), c);
        this.draw_edge(new Edge(t.v1, t.v2), c);
        this.draw_edge(new Edge(t.v2, t.v0), c);
    }
    
    draw_points(points, r, c=COLOR_BLACK) {
        // debug("Canvas.draw_points");
        // debug({points, r, c});
        points.forEach(p => {
            this.draw_circle(p, r, true, c);
        });
    }
    
    draw_edges(edges, c=COLOR_BLACK) {
        edges.forEach(e => {
            this.draw_edge(e, c);
        });
    }

    draw_triangles(triangles, c=COLOR_BLACK) {
        triangles.forEach(t => {
            this.draw_triangle(t, c);
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

        this.setup_manual_btn            = document.getElementById(CTRLS_MANUAL_ENTRY_MODE_BTN_ELEMENT_ID);
        this.setup_random_btn            = document.getElementById(CTRLS_RANDOM_MODE_BTN_ELEMENT_ID);
        this.setup_random_input          = document.getElementById(CTRLS_RANDOM_INPUT_ELEMENT_ID);
        this.setup_clear_btn             = document.getElementById(CTRLS_CLEAR_ELEMENT_ID);

        this.triangulate_btn             = document.getElementById(CTRLS_TRIANGULATE_ELEMENT_ID);

        this.run_step_btn       = document.getElementById(CTRLS_STEP_ELEMENT_ID);
        this.run_speed_input    = document.getElementById(CTRLS_SPEED_ELEMENT_ID);
        this.run_play_btn       = document.getElementById(CTRLS_PLAY_ELEMENT_ID);
        this.run_pause_btn      = document.getElementById(CTRLS_PAUSE_ELEMENT_ID);
        this.run_reset_btn      = document.getElementById(CTRLS_RESTART_ELEMENT_ID);

        // grab code lines
        this.code_lines = [null]; // first element "line 0" is empty to allow for semantic indexing
        for (let line_num = 1; line_num < CODE_NUM_LINES + 1; line_num++) {
            let line_span_element = document.getElementById(CODE_LINE_ID_PREFIX + line_num);
            this.code_lines.push(line_span_element);
        }
        this.run_refine_angle_input      = document.getElementById(CTRLS_REFINE_ANGLE_INPUT);
        this.run_refine_length_input     = document.getElementById(CTRLS_REFINE_LENGTH_INPUT);
        this.run_refine_btn              = document.getElementById(CTRLS_REFINE_BTN_ELEMENT);
        this.run_step_btn                = document.getElementById(CTRLS_STEP_ELEMENT_ID);
        this.run_speed_input             = document.getElementById(CTRLS_SPEED_ELEMENT_ID);
        this.run_play_btn                = document.getElementById(CTRLS_PLAY_ELEMENT_ID);
        this.run_pause_btn               = document.getElementById(CTRLS_PAUSE_ELEMENT_ID);
        this.run_reset_btn               = document.getElementById(CTRLS_RESTART_ELEMENT_ID);
        this.run_complete_refinement_btn = document.getElementById(CTRLS_COMPLETE_REFINEMENT_BTN_ID);
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
        
        // angle input field
        this.run_refine_angle_input.oninput = () => {this.event_angle_input()};

        // threshold length field
        this.run_refine_length_input.oninput = () => {this.event_length_input()};

        // compute refinement button
        this.run_refine_btn.onclick = () => {this.event_refine()};

        // visualization step button
        this.run_step_btn.onclick = () => {this.event_step()};
        
        // complete refinement button
        this.run_complete_refinement_btn.onclick = () => {this.event_complete_refinement()};
    }

    clear_code() {
        // clean code area
        for (let line_num = 1; line_num < CODE_NUM_LINES + 1; line_num++) {
            this.code_lines[line_num].classList.remove(STYLE_CLASS_CODE_BOLD);
        }
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

        // clean code area
        this.clear_code();

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
        this.clear_code();
        this.canvas.clear();
        this.draw_state();
    }

    event_clear() {
        // clear button
        debug("UserInterface.event_clear");
        this.vis.reset_state();
        this.clear_code();
        this.canvas.clear();
        this.triangulate_btn.disabled = true;
        this.run_refine_btn.disabled = true;
        this.run_step_btn.disabled = true;
    }

    event_triangulate() {
        debug("UserInterface.event_triangulate");
        this.vis.triangulate();
        this.code_lines[CODE_TRIANGULATE_LINE].classList.add(STYLE_CLASS_CODE_BOLD);
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
        this.vis.compute_refinement(angle_val, length_val);
        this.canvas.clear();
        this.draw_state();
        this.run_step_btn.disabled = false;
        this.run_complete_refinement_btn.disabled = false; // TODO more sophistocated check for disabled
        this.run_refine_btn.disabled = true;

    }

    event_step() {
        debug("UserInterface.event_step");
        this.vis.step();
        if (this.vis.refinement_complete) {
            this.event_complete_refinement();
            return;
        }
        this.canvas.clear();
        this.draw_state();
    }

    event_complete_refinement() {
        debug("UserInterface.event_complete_refinement");
        this.vis.complete_refinement();
        this.canvas.clear();
        this.draw_state();
        this.run_step_btn.disabled = true;
        this.run_complete_refinement_btn.disabled = true; // TODO more sophistocated check for disabled
    }

    draw_state() {

        const edge_color = (this.vis.refinement_complete) ? COLOR_GREEN : COLOR_BLACK;

        this.canvas.draw_triangles(this.vis.triangles, edge_color);
        this.canvas.draw_points(this.vis.points, POINT_SIZE);
        this.canvas.draw_points(this.vis.green_points, POINT_SIZE, COLOR_GREEN);
        this.canvas.draw_points(this.vis.red_points, POINT_SIZE, COLOR_RED);
        this.canvas.draw_circles(this.vis.green_circles, false, COLOR_GREEN); // circles
        this.canvas.draw_circles(this.vis.red_circles, false, COLOR_RED); // circles

        if (this.vis.refinement_computed) {
            this.run_step_btn.innerHTML = "Step (" + (this.vis.total_steps - this.vis.steps.length) + "/" + this.vis.total_steps + ")";
        } else {
            this.run_step_btn.innerHTML = "Step (--/--)";
        }
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
        this.green_points = [];
        this.red_points = [];
        this.green_circles = [];
        this.red_circles = [];

        // saved hidden state
        this.input_points = [];
        this.delaunay_points = [];
        this.delaunay_triangles = [];
        this.step_points = [];
        this.step_triangles = [];
        this.refined_points = [];
        this.refined_triangles = [];
        this.events = [];
        this.steps = [];
        this.total_steps = 0;

        // setup state
        this.populated = false;
        this.triangulation_complete = false;
        this.refinement_complete = false;
        this.refinement_computed = true;
    }

    reset_color_state() {
        this.green_points = [];
        this.red_points = [];
        this.green_circles = [];
        this.red_circles = [];
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

    _request_triangulation(request_points) {
        
        const input_points = request_points.map(function(point) {
            return [point.x, point.y];
        });
        
        // request delaunay triangulation
        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", BACKEND_ADDRESS + "/getTriangulation?points=" + input_points + "&refine=0", false);
        xhttp.send();
        const str_response = xhttp.responseText;
        const parsed_response = JSON.parse(JSON.parse(str_response));
        const parsed_triangulation = JSON.parse(parsed_response["triangulation"])
        const triangles_to_add = parsed_triangulation[0];

        // convert the triangles from raw to our format
        const new_triangles = [];
        for (let i=0; i < triangles_to_add.length; i += 1) {
            const new_triangle = new Triangle(
                request_points[triangles_to_add[i][0]],
                request_points[triangles_to_add[i][1]],
                request_points[triangles_to_add[i][2]]
            );
            new_triangles.push(new_triangle);
        }

        return new_triangles;
    }

    triangulate() {
        // assumes populated
        if (!this.triangulation_complete) {
            this.input_points = [...this.points]; // save original points if re-triangulation is desired
        }

        // request delaunay triangulation
        const new_triangles = this._request_triangulation(this.input_points);

        // update saved state
        this.delaunay_points = [...this.input_points];
        this.delaunay_triangles = new_triangles;

        // update visualization state
        this.points = [...this.delaunay_points];
        this.triangles = [...this.delaunay_triangles];
        this.triangulation_complete = true;
        this.refinement_complete = false;
        this.refinement_computed = false;
    }

    compute_refinement(angle, length) {
        // assumes populated
        const input_points = this.delaunay_points.map(function(point) {
            return [point['x'], point['y']];
        });

        const xhttp = new XMLHttpRequest();
        xhttp.open("GET", BACKEND_ADDRESS + "/getTriangulation?points=" + input_points + "&refine=1&angle=" + angle + "&length=" + length, false);
        xhttp.send();
        const str_response = xhttp.responseText;
        const parsed_response = JSON.parse(JSON.parse(str_response));
        const parsed_triangulation = JSON.parse(parsed_response["triangulation"])
        const triangles_to_add = parsed_triangulation[0];
        const points_to_add = parsed_triangulation[1];
        const events =  parsed_response["events"];
        // debug(events);

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

        // parse steps
        const new_steps = parse_steps_from_events(events);

        // update saved state
        this.refined_points = new_points;
        this.refined_triangles = new_triangles;
        this.events = events;
        this.refinement_computed = true;
        this.refinement_complete = false;

        // setup step process
        this.step_points = [...new_points];
        this.step_triangles = [...new_triangles];
        this.steps = new_steps;
        this.total_steps = this.steps.length;
        // debug(this.steps);
    }

    step() {
        // reset temp state
        this.reset_color_state();

        if (this.steps.length == 0) {
            this.complete_refinement();
            return;
        }
        let step = this.steps.shift();
        // debug(this.refined_points);
        switch(step.type) {
            case STEP_ENCROACHED_UPON_CHECK:
                this.green_points = [this.refined_points[step.segment[0]], this.refined_points[step.segment[1]]];
                this.red_points = [this.refined_points[step.offending_point]];
                this.green_circles = [
                    new Circle(this.refined_points[step.new_point], euclidian_between_points(this.refined_points[step.segment[0]], this.refined_points[step.segment[1]]) / 2)
                ];
                break;
            case STEP_ENCROACHED_UPON_NEW:
                this.green_points = [this.refined_points[step.new_point]];
                break;
            case STEP_ENCROACHED_UPON_REFRESH:
                this.green_points = [this.refined_points[step.new_point]];
                this.points.push(this.refined_points[step.new_point]);
                this.triangles = this._request_triangulation(this.points);
                break;
        }
    }

    complete_refinement() {
        // update visualization state
        this.points = [...this.refined_points];
        this.triangles = [...this.refined_triangles];
        this.refinement_complete = true;
        this.reset_color_state();
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