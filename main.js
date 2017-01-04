

/* --- Genetic Drift --- */
(function setUpGeneticDrift() {
    "use strict";
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
})();


/* --- Migration --- */
(function setUpMigration() {
    "use strict";
    // state variables

    /* a grid is a 2d-array with properties: `A1A1`, `A1A2`, and `A2A2` to count alleles,
     *  and an additional property: `generationCounter`
     */
    let grid;
    let gridLength = 75;
    let p = 0.5;
    let matingDistance;
    let interval;
    let intervalId;

    // interactive inputs

    // mating distance and interval
    document.querySelector(`#migration form`)
        .addEventListener(`input`, function (event) {
            const form = event.currentTarget;
            const fd = new FormData(form);
            const intervalSeconds = +fd.get(`interval`);
            const newInterval = intervalSeconds * 1000;
            if (interval !== newInterval) {
                clearInterval(intervalId);
                interval = newInterval;
                intervalId = setInterval(update, interval);
            }
            matingDistance = +fd.get(`matingDistance`);

            // reflect the new values on the form
            form.querySelector(`output[for="matingDistance"]`)
                .value = matingDistance;
            form.querySelector(`output[for="interval"]`)
                .value = intervalSeconds;
        });
    // restart/pause/play
    document.querySelector(`#migrationRestart`)
        .addEventListener(`click`, function (event) {
            restart(gridLength, p);
        });
    document.querySelector(`#migrationPause`)
        .addEventListener(`click`, function (event) {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            } else {
                update();
                intervalId = setInterval(update, interval);
            }
        });

    // run the simulation

    document.querySelector(`#migration form`)
        .dispatchEvent(new Event(`input`));
    restart(gridLength, p);

    // helper functions

    function restart(gridLength, p) {
        grid = initGrid(gridLength, p);
        d3.select(`#migrationGrid`)
            .call(render, grid);

        clearInterval(intervalId);
        intervalId = setInterval(update, interval);
    }

    function update() {
        grid = nextGrid(grid, matingDistance);
        d3.select(`#migrationGrid`)
            .call(render, grid);
    }

    function render(selection, grid) {
        if (grid.generationCounter === 0) {
            drawGrid(selection, grid);
        } else {
            updateGrid(selection, grid);
        }

        const {A1A1, A1A2, A2A2} = grid;
        const F = calculateF(A1A1, A1A2, A2A2);
        document.querySelector(`#migrationInfo`)
            .textContent = `Generation: ${grid.generationCounter}, F: ${roundApprox(F, 4)}`;

        console.log("generation " + grid.generationCounter + ":");
        console.log(A1A1, A1A2, A2A2);
        console.log("F = " + F);
    }

    function initGrid(gridLength, p) {
        let grid = [];
        let A1A1 = 0;
        let A1A2 = 0;
        let A2A2 = 0;
        for (let i = 0; i < gridLength; i = i + 1) {
            grid[i] = [];
            for (let ii = 0; ii < gridLength; ii = ii + 1) {
                const r = Math.random();
                if (r < p * p) {
                    grid[i][ii] = "A1A1";
                    A1A1 = A1A1 + 1;
                }
                else if (r > 1 - (1 - p) * (1 - p)) {
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
        grid.generationCounter = 0;

        return grid;
    }

    function nextGrid(grid, matingDistance) {
        const newGrid = [];
        let A1A1 = 0;
        let A1A2 = 0;
        let A2A2 = 0;
        for (let i = 0; i < grid.length; i = i + 1) {
            newGrid[i] = [];
            for (let j = 0; j < grid.length; j = j + 1) {
                const matingPartner = pickMatingPartner(grid, i, j, matingDistance);
                const offspring = getOffspring(grid[i][j], matingPartner);
                newGrid[i][j] = offspring;

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
        newGrid.A1A1 = A1A1;
        newGrid.A1A2 = A1A2;
        newGrid.A2A2 = A2A2;
        newGrid.generationCounter = grid.generationCounter + 1;

        return newGrid;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getBoundedIndex(index, modulus) {
        return ((index % modulus) + modulus) % modulus;
    }

    function pickMatingPartner(grid, i, j, matingDistance) {
        let new_i = getRandomInt(i - matingDistance, i + matingDistance);
        let new_j = getRandomInt(j - matingDistance, j + matingDistance);
        new_i = getBoundedIndex(new_i, grid.length);
        new_j = getBoundedIndex(new_j, grid.length);
        return grid[new_i][new_j];
    }

    function getOffspring(parent1, parent2) {
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
            const r = Math.random();
            if (r < 0.25) {
                return "A1A1";
            }
            else if (r > 0.75) {
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
        const N = A1A1 + A1A2 + A2A2;
        const h_o = A1A2 / N;
        const p = ((2 * A1A1) + A1A2) / (2 * N);
        const h_e = 2 * p * (1 - p);
        const F = (h_e - h_o) / h_e;
        return F;
    }

    function roundApprox(n, decimals) {
        const shifter = Math.pow(10, decimals);
        return Math.round(n * shifter) / shifter;
    }

})();