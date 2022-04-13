/* GraphQL methods */
import { graphqlHTTP } from 'express-graphql';
import { GraphQLFloat, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, printSchema, } from 'graphql';
import { listMetrics, queryMetric, } from '../services/metricService.js';
import express from 'express';
const router = express.Router();
export const graphqlInit = () => {
    const metricToGraphQLType = (metric) => new GraphQLObjectType({
        name: metric.name,
        fields: Object.assign({ period: { type: GraphQLString }, [metric.name]: { type: GraphQLFloat } }, Object.fromEntries(metric.dimensions.map(dimension => [dimension, { type: GraphQLString }]) // TODO: they might be other things
        )),
    });
    let availableMetrics = [];
    try {
        availableMetrics = listMetrics();
    }
    catch (error) {
        console.warn(error);
    }
    const QueryType = new GraphQLObjectType({
        name: 'Query',
        fields: Object.assign({}, Object.fromEntries(availableMetrics.map(metric => [
            metric.name,
            {
                type: new GraphQLList(metricToGraphQLType(metric)),
                args: {
                    grain: { type: new GraphQLNonNull(GraphQLString) },
                    start_date: { type: GraphQLString },
                    end_date: { type: GraphQLString },
                },
            },
        ]))),
    });
    const schema = new GraphQLSchema({
        query: QueryType,
    });
    console.info(printSchema(schema));
    function metricResolver(args, _context, { fieldName, fieldNodes }) {
        var _a;
        const NON_DIMENSION_FIELDS = [fieldName, 'period'];
        const [node] = fieldNodes;
        return JSON.parse(queryMetric(Object.assign({ metric_name: fieldName, dimensions: (_a = node.selectionSet) === null || _a === void 0 ? void 0 : _a.selections.map(selection => selection.name.value).filter(field => !NON_DIMENSION_FIELDS.includes(field)) }, args)));
    }
    const metrics = availableMetrics.map(metric => [metric.name, metricResolver]);
    // eslint-disable-next-line node/no-unsupported-features/es-builtins
    const root = Object.fromEntries(metrics);
    console.debug(`available: ${JSON.stringify(metrics)}`);
    router.use('/', graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }));
};
router.post('/refresh', (_req, res) => {
    graphqlInit();
    res.status(200).end();
});
export default router;
//# sourceMappingURL=graphql.js.map