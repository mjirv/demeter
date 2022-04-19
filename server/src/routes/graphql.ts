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
import metricService from '../services/MetricService/index.js';
import type {DBTResource, Grain} from '../services/MetricService/index.js';
import express, {NextFunction, Request, Response} from 'express';

const router = express.Router();

const refreshSchema = (_req: Request, res: Response) => {
  graphqlInit();
  res.status(200).end();
};

let graphqlMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (graphqlInit()?.success) {
    graphqlMiddleware(req, res, next);
  }
  next();
};

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
    availableMetrics = metricService.listMetrics();
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
    return metricService.queryMetric({
      metric_name: fieldName,
      dimensions: node.selectionSet?.selections
        .map(selection => (selection as FieldNode).name.value)
        .filter(field => !NON_DIMENSION_FIELDS.includes(field)),
      ...args,
    });
  }

  const root = availableMetrics.reduce((prev, current) => {
    return {...prev, [current.name]: metricResolver};
  }, {});

  if (Object.keys(root).length > 0) {
    graphqlMiddleware = graphqlHTTP({
      schema: schema,
      rootValue: root,
      graphiql: true,
    });
    return {success: true};
  }
  return {success: false};
}

router.use('/', (req, res, next) => graphqlMiddleware(req, res, next));
router.post('/refresh', refreshSchema);

export default router;
