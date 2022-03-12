import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {execSync} from 'child_process';

// defining the Express app
const app = express();

// defining an array to work as the database (temporary solution)
const ads = [{title: 'Hello, world (again)!'}];

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

const DBT_PROJECT_PATH = '/home/michael/jaffle_shop'; // TODO: refactor this into an env variable or config
const DBT_TARGET = 'dev'; // TODO: refactor this into an optional env variable

/* Lists all available metrics */
app.get('/', (req, res) => {
  res.send(ads);
});

/* Runs a given metric */
app.post('/run', (req, res) => {
  const {metric_name, grain, dimensions, start_date, end_date} = req.body;

  let format: string;
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
    const raw_output = execSync(
      `cd ${DBT_PROJECT_PATH} &&\
            dbt run-operation --target ${DBT_TARGET} run_metric --args '${JSON.stringify(
        {metric_name, grain, dimensions, start_date, end_date, format}
      )}'
        `,
      {encoding: 'utf-8'}
    );
    const output = raw_output.slice(raw_output.indexOf('\n') + 1);
    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});
