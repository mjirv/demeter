var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _GithubService_accessToken, _GithubService_client;
import simpleGit from 'simple-git';
// eslint-disable-next-line node/no-extraneous-import
import tempy from 'tempy';
export class GithubService {
    constructor(accessToken) {
        _GithubService_accessToken.set(this, void 0);
        _GithubService_client.set(this, void 0);
        if (!accessToken) {
            console.debug('no access token provided. initializing blank GithubService instance');
        }
        __classPrivateFieldSet(this, _GithubService_accessToken, accessToken, "f");
        __classPrivateFieldSet(this, _GithubService_client, simpleGit(), "f");
        this.dir = accessToken ? tempy.directory({ prefix: '_github' }) : undefined;
    }
    async clone(repository) {
        if (!__classPrivateFieldGet(this, _GithubService_accessToken, "f") || !this.dir) {
            throw Error('Cannot clone, no access token was provided in the environment');
        }
        const url = `https://${__classPrivateFieldGet(this, _GithubService_accessToken, "f")}@github.com/${repository}.git`;
        await __classPrivateFieldGet(this, _GithubService_client, "f").env('GIT_TERMINAL_PROMPT', '0').clone(url, this.dir);
    }
}
_GithubService_accessToken = new WeakMap(), _GithubService_client = new WeakMap();
const instance = new GithubService(process.env.GITHUB_ACCESS_TOKEN);
export default instance;
//# sourceMappingURL=gitService.js.map