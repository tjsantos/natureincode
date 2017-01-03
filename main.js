

function geneticDrift(populationSize, generations) {
    const data = [];
    let p = 0.5;
    for (let i = 0; i < generations; i += 1) {
        const draws = 2 * populationSize;
        let a1 = 0;
        for (let j = 0; j < draws; j += 1) {
            if (Math.random() < p) a1 += 1;
        }
        p = a1 / draws;
        data.push(p);
    }

    return data;
}

let runButton = document.querySelector(`#geneticDrift button[name="run"]`);
runButton.addEventListener(`click`, (event) => {
    // validate the form
    let form = event.currentTarget.form;
    let valid = form.reportValidity();
    if (valid) {
        // obtain parameters from form
        const formData = new FormData(form);
        const populationSize = +formData.get(`populationSize`);
        const generations = +formData.get(`generations`);

        // run the simulation
        let driftData = geneticDrift(populationSize, generations);

        // render/visualize the results
        const legendValues = [`Population Size:`, populationSize, `Generations:`, generations];
        d3.select(`#geneticDriftChart`)
            .call(drawLineChart, driftData, `Generation`, `p`, legendValues)
    }
});
runButton.click();


var grid_length = 75;
// Note that grid_length in the book is 100.
// I reduced it here for smooth performance on mobile devices.
var p = 0.5;
var grid = [];
var max_mating_distance = 1; // change to 50 for global mating
var A1A1 = 0;
var A1A2 = 0;
var A2A2 = 0;
var generation_counter = 0;

function init_grid() {
    for (var i = 0; i < grid_length; i = i + 1) {
        grid[i] = [];
        for (var ii = 0; ii < grid_length; ii = ii + 1) {
            var random_number = Math.random();
            if (random_number < p*p) {
                grid[i][ii] = "A1A1";
                A1A1 = A1A1 + 1;
            }
            else if (random_number > 1 - (1-p) * (1-p)) {
                grid[i][ii] = "A2A2";
                A2A2 = A2A2 + 1;
            }
            else {
                grid[i][ii] = "A1A2";
                A1A2 = A1A2 + 1;
            }
        }
    }
    console.log(A1A1, A1A2, A2A2);
}

init_grid();

draw_grid(`#migrationGrid`, grid);

function simulate_and_visualize() {
    run_generation();
    update_grid(`#migrationGrid`, grid);
}
setInterval(simulate_and_visualize, 1000);

function run_generation() {
    var temp_grid = [];
    for (var i = 0; i < grid_length; i = i + 1) {
        temp_grid[i] = [];
        for (var ii = 0; ii < grid_length; ii = ii + 1) {
            var mating_partner = pick_mating_partner(i,ii);
            temp_grid[i][ii] = get_offspring(grid[i][ii],mating_partner);
        }
    }
    for (i = 0; i < grid_length; i = i + 1) {
        for (ii = 0; ii < grid_length; ii = ii + 1) {
            grid[i][ii] = temp_grid[i][ii];
        }
    }
    print_data();
    generation_counter = generation_counter + 1;
}

function get_random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function get_bounded_index(index) {
    var bounded_index = index;
    if (index < 0) {
        bounded_index = index + grid_length;
    }
    if (index >= grid_length) {
        bounded_index = index - grid_length;
    }
    return bounded_index;
}

function pick_mating_partner(i, ii) {
    var j   = get_random_int(i-max_mating_distance, i+max_mating_distance);
    var jj  = get_random_int(ii-max_mating_distance, ii+max_mating_distance);
    j  = get_bounded_index(j);
    jj = get_bounded_index(jj);
    return grid[j][jj];
}

function get_offspring(parent1, parent2) {
    var p1 = parent1;
    var p2 = parent2;
    if (p1 == "A1A1" && p2 == "A1A1") {
        return "A1A1";
    }
    else if ((p1 == "A1A1" && p2 == "A1A2") || (p1 == "A1A2" && p2 == "A1A1")) {
        if (Math.random() < 0.5) {
            return "A1A1";
        }
        else {
            return "A1A2";
        }
    }
    else if ((p1 == "A1A1" && p2 == "A2A2") || (p1 == "A2A2" && p2 == "A1A1")) {
        return "A1A2";
    }
    else if (p1 == "A1A2" && p2 == "A1A2") {
        var random_number = Math.random();
        if (random_number < 0.25) {
            return "A1A1";
        }
        else if (random_number > 0.75){
            return "A2A2";
        }
        else {
            return "A1A2";
        }
    }
    else if ((p1 == "A1A2" && p2 == "A2A2") || (p1 == "A2A2" && p2 == "A1A2")) {
        if (Math.random() < 0.5) {
            return "A1A2";
        }
        else {
            return "A2A2";
        }
    }
    else if (p1 == "A2A2" && p2 == "A2A2") {
        return "A2A2";
    }
 }

 function print_data() {
    A1A1 = 0;
    A1A2 = 0;
    A2A2 = 0;
    for (var i = 0; i < grid_length; i = i + 1) {
        for (var ii = 0; ii < grid_length; ii = ii + 1) {
            if (grid[i][ii] == "A1A1") {
                A1A1 = A1A1 + 1;
            }
            else if (grid[i][ii] == "A1A2") {
                A1A2 = A1A2 + 1;
            }
            else {
                A2A2 = A2A2 + 1;
            }
        }
    }
    console.log("generation " + generation_counter + ":");
    console.log(A1A1, A1A2, A2A2);
    var N = A1A1 + A1A2 + A2A2;
    var h_o = A1A2 / N;
    var p = ((2 * A1A1) + A1A2) / (2 * N);
    var h_e = 2 * p * (1-p);
    var F = (h_e - h_o) / h_e;
    console.log("F = " + F);
}