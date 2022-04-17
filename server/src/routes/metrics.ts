import express from 'express';
import metricService from '../services/MetricService/index.js';

const router = express.Router();

/* Lists all available metrics */
router.get('/', (req, res) => {
  res.type('application/json');
  const {name, type, model, package_name} = req.query as Record<string, string>;
  try {
    const output = JSON.stringify(
      metricService.listMetrics(name, {type, model, package_name})
    );
    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

/* Gets a metric's information */
router.get('/:name', (req, res) => {
  const {name} = req.params;
  try {
    const [metric] = metricService.listMetrics(name);
    const output = JSON.stringify(metric);
    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

/* Runs a given metric */
router.post('/:metric_name', (req, res) => {
  const {metric_name} = req.params;
  const {grain, dimensions, start_date, end_date} = req.body;

  let format: 'csv' | 'json';
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
      .send({error: 'grain is a required property; no grain given'});
  }
  try {
    const output = metricService.queryMetric({
      metric_name,
      grain,
      dimensions,
      start_date,
      end_date,
      format,
    });
    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

export default router;
