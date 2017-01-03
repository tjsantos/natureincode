

/* --- Genetic Drift --- */

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
        // obtain arguments from form
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


/* --- Migration --- */

/* a grid is a 2d-array with properties: `A1A1`, `A1A2`, and `A2A2` to count alleles,
*  and an additional property: `generation_counter`
*/
let grid_length = 75;
let p = 0.5;
let mating_distance = 1;
let interval = 1000;

let grid = init_grid(grid_length, p);
d3.select(`#migrationGrid`)
    .call(render_grid, grid);

function simulate_and_visualize() {
    // update the grid
    grid = run_generation(grid, mating_distance);
    // render/visualize
    d3.select(`#migrationGrid`)
        .call(render_grid, grid);
}
setInterval(simulate_and_visualize, interval);


function render_grid(selection, grid) {
    "use strict";
    if (grid.generation_counter === 0) {
        draw_grid(selection, grid);
    } else {
        update_grid(selection, grid);
    }
}

function init_grid(grid_length, p) {
    let grid = [];
    let A1A1 = 0;
    let A1A2 = 0;
    let A2A2 = 0;
    for (let i = 0; i < grid_length; i = i + 1) {
        grid[i] = [];
        for (let ii = 0; ii < grid_length; ii = ii + 1) {
            const random_number = Math.random();
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
    grid.A1A1 = A1A1;
    grid.A1A2 = A1A2;
    grid.A2A2 = A2A2;
    grid.generation_counter = 0;

    print_data(grid);
    return grid;
}

function run_generation(grid, mating_distance) {
    const new_grid = [];
    let A1A1 = 0;
    let A1A2 = 0;
    let A2A2 = 0;
    for (let i = 0; i < grid.length; i = i + 1) {
        new_grid[i] = [];
        for (let j = 0; j < grid.length; j = j + 1) {
            const mating_partner = pick_mating_partner(grid, i, j, mating_distance);
            const offspring = get_offspring(grid[i][j], mating_partner);
            new_grid[i][j] = offspring;

            // update count
            if (offspring === "A1A1") {
                A1A1 = A1A1 + 1;
            } else if (offspring === "A1A2") {
                A1A2 = A1A2 + 1;
            } else /* offspring === "A2A2" */ {
                A2A2 = A2A2 + 1;
            }
        }
    }
    new_grid.A1A1 = A1A1;
    new_grid.A1A2 = A1A2;
    new_grid.A2A2 = A2A2;
    new_grid.generation_counter = grid.generation_counter + 1;

    print_data(new_grid);
    return new_grid;
}

function get_random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function get_bounded_index(index, modulus) {
    let bounded_index = index;
    if (index < 0) {
        bounded_index = index + modulus;
    }
    if (index >= modulus) {
        bounded_index = index - modulus;
    }
    return bounded_index;
}

function pick_mating_partner(grid, i, j, mating_distance) {
    let new_i = get_random_int(i - mating_distance, i + mating_distance);
    let new_j = get_random_int(j - mating_distance, j + mating_distance);
    new_i  = get_bounded_index(new_i, grid.length);
    new_j = get_bounded_index(new_j, grid.length);
    return grid[new_i][new_j];
}

function get_offspring(parent1, parent2) {
    const p1 = parent1;
    const p2 = parent2;
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
        const random_number = Math.random();
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

function calculateF(A1A1, A1A2, A2A2) {
    "use strict";
    const N = A1A1 + A1A2 + A2A2;
    const h_o = A1A2 / N;
    const p = ((2 * A1A1) + A1A2) / (2 * N);
    const h_e = 2 * p * (1 - p);
    const F = (h_e - h_o) / h_e;
    return F;
}

 function print_data(grid) {
    const {A1A1, A1A2, A2A2} = grid;
    const F = calculateF(A1A1, A1A2, A2A2);
    console.log("generation " + grid.generation_counter + ":");
    console.log(A1A1, A1A2, A2A2);
    console.log("F = " + F);
}