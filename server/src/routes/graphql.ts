/* GraphQL methods */

import {graphqlHTTP} from 'express-graphql';
import {
  FieldNode,
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  printSchema,
} from 'graphql';
import {
  DBTResource,
  Grain,
  listMetrics,
  queryMetric,
} from '../services/metricService.js';
import express from 'express';

const router = express.Router();

export function graphqlInit() {
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

  let availableMetrics: DBTResource[] = [];

  try {
    availableMetrics = listMetrics();
  } catch (error) {
    console.warn(error);
  }

  const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
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

  let root = availableMetrics.reduce((prev, current) => {
    console.info(`current: ${JSON.stringify(current)}`);
    console.info(`prev: ${JSON.stringify(prev)}`);
    return { ...prev, [current.name]: metricResolver}
  }, {});

  Object.keys(root).length > 0 && router.use(
    '/',
    graphqlHTTP({
      schema: schema,
      rootValue: root,
      graphiql: true,
    })
  );
};

router.post('/refresh', (_req, res) => {
  graphqlInit();
  res.status(200).end();
});

export default router;
