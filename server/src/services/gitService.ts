import simpleGit, {SimpleGit} from 'simple-git';
// eslint-disable-next-line node/no-extraneous-import
import tempy from 'tempy';

interface IGitService {
  dir: string | undefined;
  clone: (repository: string) => void;
}

export class GithubService implements IGitService {
  #accessToken?: string;
  #client: SimpleGit;
  dir: string | undefined;

  constructor(accessToken?: string) {
    if (!accessToken) {
      console.debug(
        'no access token provided. initializing blank GithubService instance'
      );
    }
    this.#accessToken = accessToken;
    this.#client = simpleGit();
    this.dir = accessToken ? tempy.directory() : undefined;
  }

  clone(repository: string) {
    if (!this.#accessToken || !this.dir) {
      throw Error(
        'Cannot clone, no access token was provided in the environment'
      );
    }
    const url = `https://${this.#accessToken}@github.com/${repository}.git`;
    this.#client.env('GIT_TERMINAL_PROMPT', '0').clone(url, this.dir);
  }
}

const instance = new GithubService(process.env.GITHUB_ACCESS_TOKEN);
export default instance;
