

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
    document.querySelector(`#geneticDriftChart`).innerHTML = ``;
    const legendValues = [`Population Size:`, populationSize, `Generations:`, generations];
    drawLineChart(`#geneticDriftChart`, data, `Generation`, `p`, legendValues);
}

let runButton = document.querySelector(`#geneticDrift button[name="run"]`);
runButton.addEventListener(`click`, (event) => {
    let form = event.currentTarget.form;
    let valid = form.reportValidity();
    if (valid) {
        let data = new FormData(form);
        geneticDrift(+data.get(`populationSize`), +data.get(`generations`));
    }
});
runButton.click();