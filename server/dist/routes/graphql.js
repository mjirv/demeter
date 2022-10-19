/* GraphQL methods */
import { graphqlHTTP } from 'express-graphql';
import { GraphQLEnumType, GraphQLFloat, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, } from 'graphql';
import metricService from '../services/MetricService/index.js';
import express from 'express';
const router = express.Router();
const refreshSchema = (_req, res) => {
    graphqlInit();
    res.status(200).end();
};
let graphqlMiddleware = (req, res, next) => {
    var _a;
    if ((_a = graphqlInit()) === null || _a === void 0 ? void 0 : _a.success) {
        graphqlMiddleware(req, res, next);
    }
    next();
};
export function graphqlInit() {
    const metricToGraphQLType = (metric) => new GraphQLObjectType({
        name: metric.name,
        fields: Object.assign({ period: { type: GraphQLString }, [metric.name]: { type: GraphQLFloat } }, Object.fromEntries(metric.dimensions.map(dimension => [dimension, { type: GraphQLString }]) // TODO: they might be other things
        )),
    });
    let availableMetrics = [];
    try {
        availableMetrics = metricService.listMetrics();
    }
    catch (error) {
        console.warn(error);
    }
    const GrainType = new GraphQLEnumType({ name: "Grain", values: Object.fromEntries(["day", "week", "month", "quarter", "year"].map(grain => [grain, { value: grain }])) });
    const QueryType = new GraphQLObjectType({
        name: 'Query',
        fields: Object.assign({}, Object.fromEntries(availableMetrics.map(metric => [
            metric.name,
            {
                type: new GraphQLList(metricToGraphQLType(metric)),
                args: {
                    grain: {
                        type: new GraphQLNonNull(GrainType)
                    },
                    start_date: { type: GraphQLString },
                    end_date: { type: GraphQLString },
                },
            },
        ]))),
    });
    const schema = new GraphQLSchema({
        query: QueryType,
    });
    function metricResolver(args, _context, { fieldName, fieldNodes }) {
        var _a;
        const NON_DIMENSION_FIELDS = [fieldName, 'period'];
        const [node] = fieldNodes;
        const res = metricService.queryMetric(Object.assign({ metric_name: fieldName, dimensions: (_a = node.selectionSet) === null || _a === void 0 ? void 0 : _a.selections.map(selection => selection.name.value).filter(field => !NON_DIMENSION_FIELDS.includes(field)) }, args));
        res.period = res.date_day || res.date_week || res.date_month || res.date_quarter || res.date_year;
        return res;
    }
    const root = availableMetrics.reduce((prev, current) => {
        return Object.assign(Object.assign({}, prev), { [current.name]: metricResolver });
    }, {});
    if (Object.keys(root).length > 0) {
        graphqlMiddleware = graphqlHTTP({
            schema: schema,
            rootValue: root,
            graphiql: true,
        });
        return { success: true };
    }
    return { success: false };
}
router.use('/', (req, res, next) => graphqlMiddleware(req, res, next));
router.post('/refresh', refreshSchema);
export default router;
//# sourceMappingURL=graphql.js.map