import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {Kable} from 'kable-node-express';
import {graphqlHTTP} from 'express-graphql';
import {
  printSchema,
  FieldNode,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import {
  DBTResource,
  Grain,
  listMetrics,
  queryMetric,
} from './services/metricService';

dotenv.config({path: `.env.${process.env.NODE_ENV || 'local'}`});

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production' ? undefined : false,
  })
);

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// Kable for authentication
const kable =
  process.env.KABLE_CLIENT_ID &&
  new Kable({
    clientId: process.env.KABLE_CLIENT_ID,
    clientSecret: process.env.KABLE_CLIENT_SECRET,
    environment: process.env.KABLE_ENV === 'LIVE' ? 'LIVE' : 'TEST',
    baseUrl:
      process.env.KABLE_ENV === 'LIVE'
        ? 'https://live.kable.io'
        : 'https://test.kable.io',
    debug: process.env.KABLE_ENV === 'LIVE',
    recordAuthentication: true,
  });

kable && app.use(kable.authenticate);

/* Lists all available metrics */
app.get('/metrics', (req, res) => {
  res.type('application/json');
  const {name, type, model, package_name} = req.query as Record<string, string>;
  try {
    const output = JSON.stringify(
      listMetrics(name, {type, model, package_name})
    );
    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

/* Gets a metric's information */
app.get('/metrics/:name', (req, res) => {
  const {name} = req.params;
  try {
    const [metric] = listMetrics(name);
    const output = JSON.stringify(metric);
    res.send(output);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

/* Runs a given metric */
app.post('/metrics/:metric_name', (req, res) => {
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
    const output = queryMetric({
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

/* GraphQL methods */

const metricToGraphQLType = (metric: DBTResource) =>
  new GraphQLObjectType({
    name: metric.name,
    fields: {
      period: {type: GraphQLString}, // TODO: should this be date?
      [metric.name]: {type: GraphQLFloat},
      // eslint-disable-next-line node/no-unsupported-features/es-builtins
      ...Object.fromEntries(
        metric.dimensions.map(dimension => [dimension, {type: GraphQLString}]) // TODO: they might be other things
      ),
    },
  });

const availableMetrics = listMetrics();

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    ...Object.fromEntries(
      availableMetrics.map(metric => [
        metric.name,
        {
          type: new GraphQLList(metricToGraphQLType(metric)),
          args: {
            grain: {type: new GraphQLNonNull(GraphQLString)},
            start_date: {type: GraphQLString},
            end_date: {type: GraphQLString},
          },
        },
      ])
    ),
  },
});

const schema = new GraphQLSchema({
  query: QueryType,
});

console.info(printSchema(schema));

interface MetricArgs {
  grain: Grain;
  start_date?: string;
  end_date?: string;
}

function metricResolver(
  args: MetricArgs,
  _context: never,
  {fieldName, fieldNodes}: {fieldName: string; fieldNodes: FieldNode[]}
) {
  const NON_DIMENSION_FIELDS = [fieldName, 'period'];
  const [node] = fieldNodes;
  return JSON.parse(
    queryMetric({
      metric_name: fieldName,
      dimensions: node.selectionSet?.selections
        .map(selection => (selection as FieldNode).name.value)
        .filter(field => !NON_DIMENSION_FIELDS.includes(field)),
      ...args,
    })
  );
}

const metrics = availableMetrics.map(metric => [metric.name, metricResolver]);
// eslint-disable-next-line node/no-unsupported-features/es-builtins
const root = Object.fromEntries(metrics);

console.debug(`available: ${JSON.stringify(metrics)}`);

app.use(
  '/graphql',
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

// starting the server
const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
