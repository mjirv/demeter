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
const dotenv_1 = __importDefault(require("dotenv"));
const kable_node_express_1 = require("kable-node-express");
const graphql_1 = __importDefault(require("./routes/graphql"));
const metrics_1 = __importDefault(require("./routes/metrics"));
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
app.use('/metrics', metrics_1.default);
app.use('/graphql', graphql_1.default);
// starting the server
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3001;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
//# sourceMappingURL=index.js.map