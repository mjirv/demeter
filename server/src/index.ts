import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import {Kable} from 'kable-node-express';
import graphql from './routes/graphql';
import metrics from './routes/metrics';

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

app.use('/metrics', metrics);
app.use('/graphql', graphql);

// starting the server
const port = process.env.PORT ?? 3001;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
