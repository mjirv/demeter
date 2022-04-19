import { Warehouse } from '../DbtLocalMetricService.js';
const getProfileVariablesFromEnv = () => {
    const CREDENTIAL_KEYS = [
        'USER',
        'PASSWORD',
        'TYPE',
        'PROJECT_ID',
        'PRIVATE_KEY_ID',
        'PRIVATE_KEY',
        'CLIENT_EMAIL',
        'CLIENT_ID',
        'AUTH_URI',
        'TOKEN_URI',
        'AUTH_PROVIDER_X509_CERT_URL',
        'CLIENT_X509_CERT_URL',
    ];
    const profileVariables = Object.fromEntries(Object.entries(process.env)
        .filter(([key]) => key.startsWith('DBT_PROFILE_') &&
        !CREDENTIAL_KEYS.includes(key.replace('DBT_PROFILE_', '')))
        .map(([key, value]) => [
        key.replace('DBT_PROFILE_', '').toLowerCase(),
        Number(value) || value,
    ]));
    const credentials = Object.fromEntries(Object.entries(process.env)
        .filter(([key]) => key.startsWith('DBT_PROFILE_') &&
        CREDENTIAL_KEYS.includes(key.replace('DBT_PROFILE_', '')))
        .map(([key, value]) => [
        key.replace('DBT_PROFILE_', '').toLowerCase(),
        value,
    ]));
    return Object.assign(Object.assign({}, profileVariables), { type: profileVariables.type || Warehouse.POSTGRES, credentials: Object.assign({}, credentials) });
};
export default getProfileVariablesFromEnv;
//# sourceMappingURL=getProfileVariablesFromEnvironment.js.map