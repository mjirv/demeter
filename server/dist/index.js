"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: `.env.${process.env.NODE_ENV || 'local'}` });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const kable_node_express_1 = require("kable-node-express");
const simple_git_1 = __importDefault(require("simple-git"));
const graphql_1 = __importStar(require("./routes/graphql"));
const metrics_1 = __importDefault(require("./routes/metrics"));
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
console.info(`repo: ${process.env.GITHUB_REPOSITORY}`);
// Copy and initialize the dbt repo from Github if needed
if (process.env.GITHUB_REPOSITORY) {
    const githubUrl = `https://${process.env.GITHUB_ACCESS_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`;
    const GITHUB_DIR = '/home/michael/github/';
    console.info('made it');
    console.info(githubUrl);
    try {
        (0, simple_git_1.default)().env('GIT_TERMINAL_PROMPT', '1').clone(githubUrl, GITHUB_DIR);
    }
    catch (error) {
        console.error('found an error!');
        console.error(error);
    }
}
(0, graphql_1.graphqlInit)();
app.use('/metrics', metrics_1.default);
app.use('/graphql', graphql_1.default);
// starting the server
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3001;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
//# sourceMappingURL=index.js.map