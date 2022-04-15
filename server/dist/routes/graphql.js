/* GraphQL methods */
import { graphqlHTTP } from 'express-graphql';
import { GraphQLFloat, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, printSchema, } from 'graphql';
import { listMetrics, queryMetric, } from '../services/metricService.js';
import express from 'express';
const router = express.Router();
export function graphqlInit() {
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
    let root = availableMetrics.reduce((prev, current) => {
        console.info(`current: ${JSON.stringify(current)}`);
        console.info(`prev: ${JSON.stringify(prev)}`);
        return Object.assign(Object.assign({}, prev), { [current.name]: metricResolver });
    }, {});
    Object.keys(root).length > 0 && router.use('/', graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    }));
}
;
router.post('/refresh', (_req, res) => {
    graphqlInit();
    res.status(200).end();
});
export default router;
//# sourceMappingURL=graphql.js.map