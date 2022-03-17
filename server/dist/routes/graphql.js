"use strict";
/* GraphQL methods */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_graphql_1 = require("express-graphql");
const graphql_1 = require("graphql");
const metricService_1 = require("../services/metricService");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const metricToGraphQLType = (metric) => new graphql_1.GraphQLObjectType({
    name: metric.name,
    fields: {
        period: { type: graphql_1.GraphQLString },
        [metric.name]: { type: graphql_1.GraphQLFloat },
        // eslint-disable-next-line node/no-unsupported-features/es-builtins
        ...Object.fromEntries(metric.dimensions.map(dimension => [dimension, { type: graphql_1.GraphQLString }]) // TODO: they might be other things
        ),
    },
});
const availableMetrics = (0, metricService_1.listMetrics)();
const QueryType = new graphql_1.GraphQLObjectType({
    name: 'Query',
    fields: {
        // eslint-disable-next-line node/no-unsupported-features/es-builtins
        ...Object.fromEntries(availableMetrics.map(metric => [
            metric.name,
            {
                type: new graphql_1.GraphQLList(metricToGraphQLType(metric)),
                args: {
                    grain: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                    start_date: { type: graphql_1.GraphQLString },
                    end_date: { type: graphql_1.GraphQLString },
                },
            },
        ])),
    },
});
const schema = new graphql_1.GraphQLSchema({
    query: QueryType,
});
console.info((0, graphql_1.printSchema)(schema));
function metricResolver(args, _context, { fieldName, fieldNodes }) {
    var _a;
    const NON_DIMENSION_FIELDS = [fieldName, 'period'];
    const [node] = fieldNodes;
    return JSON.parse((0, metricService_1.queryMetric)({
        metric_name: fieldName,
        dimensions: (_a = node.selectionSet) === null || _a === void 0 ? void 0 : _a.selections.map(selection => selection.name.value).filter(field => !NON_DIMENSION_FIELDS.includes(field)),
        ...args,
    }));
}
const metrics = availableMetrics.map(metric => [metric.name, metricResolver]);
// eslint-disable-next-line node/no-unsupported-features/es-builtins
const root = Object.fromEntries(metrics);
console.debug(`available: ${JSON.stringify(metrics)}`);
router.use('/graphql', (0, express_graphql_1.graphqlHTTP)({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
exports.default = router;
//# sourceMappingURL=graphql.js.map