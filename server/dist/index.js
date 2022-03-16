"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
const kable_node_express_1 = require("kable-node-express");
const express_graphql_1 = require("express-graphql");
const graphql_1 = require("graphql");
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV || 'local'}` });
// defining the Express app
const app = (0, express_1.default)();
// adding Helmet to enhance your API's security
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
// using bodyParser to parse JSON bodies into JS objects
app.use(body_parser_1.default.json());
// enabling CORS for all requests
app.use((0, cors_1.default)());
// adding morgan to log HTTP requests
app.use((0, morgan_1.default)('combined'));
// Kable for authentication
const kable = process.env.KABLE_CLIENT_ID &&
    new kable_node_express_1.Kable({
        clientId: process.env.KABLE_CLIENT_ID,
        clientSecret: process.env.KABLE_CLIENT_SECRET,
        environment: process.env.KABLE_ENV === 'LIVE' ? 'LIVE' : 'TEST',
        baseUrl: process.env.KABLE_ENV === 'LIVE'
            ? 'https://live.kable.io'
            : 'https://test.kable.io',
        debug: process.env.KABLE_ENV === 'LIVE',
        recordAuthentication: true,
    });
kable && app.use(kable.authenticate);
const listMetrics = (name, selectors = {}) => {
    console.debug(`called listMetrics with params ${JSON.stringify({ name, selectors })}`);
    const { type, model, package_name } = selectors;
    // TODO: added some basic replacement to prevent bash injection, but I should clean this up here and elsewhere
    const select = name ? `--select "metric:${name.replace(/"/g, '')}"` : '';
    let metrics = JSON.parse('[' +
        (0, child_process_1.execSync)(`cd ${process.env.DBT_PROJECT_PATH} &&\
        dbt ls --resource-type metric --output json \
        --output-keys "name model label description type time_grains dimensions filters unique_id package_name" \
        ${select}`, { encoding: 'utf-8' })
            .trimEnd()
            .replace(/\n/g, ',') +
        ']');
    if (type) {
        metrics = metrics.filter(metric => metric.type === type);
    }
    if (model) {
        metrics = metrics.filter(metric => metric.model === model);
    }
    if (package_name) {
        metrics = metrics.filter(metric => metric.package_name === package_name);
    }
    return metrics;
};
const queryMetric = (params) => {
    console.debug(`called queryMetric with params ${JSON.stringify(params)}`);
    const { metric_name, grain, dimensions, start_date, end_date, format = 'json', } = params;
    const raw_output = (0, child_process_1.execSync)(`cd ${process.env.DBT_PROJECT_PATH} &&\
          dbt run-operation --target ${process.env.DBT_TARGET} dbt_metrics_api.run_metric --args '${JSON.stringify({
        metric_name,
        grain,
        dimensions,
        start_date,
        end_date,
        format,
    })}'
      `, { encoding: 'utf-8' });
    console.debug(raw_output);
    const BREAK_STRING = '<<<MAPI-BEGIN>>>\n';
    return raw_output.slice(raw_output.indexOf(BREAK_STRING) + BREAK_STRING.length);
};
/* Lists all available metrics */
app.get('/metrics', (req, res) => {
    res.type('application/json');
    const { name, type, model, package_name } = req.query;
    try {
        const output = JSON.stringify(listMetrics(name, { type, model, package_name }));
        res.send(output);
    }
    catch (error) {
        console.error(error);
        res.status(404).send(error);
    }
});
/* Gets a metric's information */
app.get('/metrics/:name', (req, res) => {
    const { name } = req.params;
    try {
        const [metric] = listMetrics(name);
        const output = JSON.stringify(metric);
        res.send(output);
    }
    catch (error) {
        console.error(error);
        res.status(404).send(error);
    }
});
/* Runs a given metric */
app.post('/metrics/:metric_name', (req, res) => {
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
        const output = queryMetric({
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
/* GraphQL methods */
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
const availableMetrics = listMetrics();
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
    return JSON.parse(queryMetric({
        metric_name: fieldName,
        dimensions: (_a = node.selectionSet) === null || _a === void 0 ? void 0 : _a.selections.map(selection => selection.name.value).filter(field => !NON_DIMENSION_FIELDS.includes(field)),
        ...args,
    }));
}
const metrics = availableMetrics.map(metric => [metric.name, metricResolver]);
// eslint-disable-next-line node/no-unsupported-features/es-builtins
const root = Object.fromEntries(metrics);
console.debug(`available: ${JSON.stringify(metrics)}`);
app.use('/graphql', (0, express_graphql_1.graphqlHTTP)({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
// starting the server
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3001;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
//# sourceMappingURL=index.js.map