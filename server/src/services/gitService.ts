import simpleGit, {SimpleGit} from 'simple-git';
// eslint-disable-next-line node/no-extraneous-import
import tempy from 'tempy';

interface IGitService {
  dir: string;
  clone: (repository: string) => void;
}

export class GithubService implements IGitService {
  #accessToken: string;
  #client: SimpleGit;
  dir: string;

  constructor(accessToken?: string) {
    if (!accessToken) {
      throw new Error('no github access token provided');
    }
    this.#accessToken = accessToken;
    this.#client = simpleGit();
    this.dir = tempy.directory({
      prefix: 'git_',
    });
  }

  clone(repository: string) {
    const url = `https://${this.#accessToken}@github.com/${repository}.git`;
    this.#client.env('GIT_TERMINAL_PROMPT', '0').clone(url, this.dir);
  }
}

const instance = new GithubService(process.env.GITHUB_ACCESS_TOKEN);
export default instance;
