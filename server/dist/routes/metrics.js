"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metricService_1 = require("../services/metricService");
const router = express_1.default.Router();
/* Lists all available metrics */
router.get('/', (req, res) => {
    res.type('application/json');
    const { name, type, model, package_name } = req.query;
    try {
        const output = JSON.stringify((0, metricService_1.listMetrics)(name, { type, model, package_name }));
        res.send(output);
    }
    catch (error) {
        console.error(error);
        res.status(404).send(error);
    }
});
/* Gets a metric's information */
router.get('/:name', (req, res) => {
    const { name } = req.params;
    try {
        const [metric] = (0, metricService_1.listMetrics)(name);
        const output = JSON.stringify(metric);
        res.send(output);
    }
    catch (error) {
        console.error(error);
        res.status(404).send(error);
    }
});
/* Runs a given metric */
router.post('/:metric_name', (req, res) => {
    const { metric_name } = req.params;
    const { grain, dimensions, start_date, end_date } = req.body;
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
        res.status(400).send({
            error: 'metric_name is a required property; no metric_name given',
        });
    }
    if (!grain) {
        res
            .status(400)
            .send({ error: 'grain is a required property; no grain given' });
    }
    try {
        const output = (0, metricService_1.queryMetric)({
            metric_name,
            grain,
            dimensions,
            start_date,
            end_date,
            format,
        });
        res.send(output);
    }
    catch (error) {
        console.error(error);
        res.status(404).send(error);
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map