"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const child_process_1 = require("child_process");
// defining the Express app
const app = (0, express_1.default)();
// defining an array to work as the database (temporary solution)
const ads = [
    { title: 'Hello, world (again)!' }
];
// adding Helmet to enhance your API's security
app.use((0, helmet_1.default)());
// using bodyParser to parse JSON bodies into JS objects
app.use(body_parser_1.default.json());
// enabling CORS for all requests
app.use((0, cors_1.default)());
// adding morgan to log HTTP requests
app.use((0, morgan_1.default)('combined'));
const DBT_PROJECT_PATH = '/home/michael/jaffle_shop'; // TODO: refactor this into an env variable or config
const DBT_TARGET = 'dev'; // TODO: refactor this into an optional env variable
/* Lists all available metrics */
app.get('/', (req, res) => {
    res.send(ads);
});
/* Runs a given metric */
app.post('/run', (req, res) => {
    const { metric_name, grain, dimensions, start_date, end_date } = req.body;
    let format;
    switch (req.accepts(['json', 'csv'])) {
        case 'csv':
            format = 'csv';
            res.type('text/csv');
            break;
        default:
            format = 'json';
            res.type('application/json');
    }
    if (!metric_name) {
        res.status(400).send({ error: "metric_name is a required property; no metric_name given" });
    }
    if (!grain) {
        res.status(400).send({ error: "grain is a required property; no grain given" });
    }
    try {
        const raw_output = (0, child_process_1.execSync)(`cd ${DBT_PROJECT_PATH} &&\
            dbt run-operation run_metric --args '${JSON.stringify({ metric_name, grain, dimensions, start_date, end_date, format })}'
        `, { encoding: 'utf-8' });
        const output = raw_output.slice(raw_output.indexOf('\n') + 1);
        res.send(output);
    }
    catch (error) {
        console.error(error);
        res.status(404).send(error);
    }
});
// starting the server
app.listen(3001, () => {
    console.log('listening on port 3001');
});
//# sourceMappingURL=index.js.map