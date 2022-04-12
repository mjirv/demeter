interface IGitService {
    dir: string;
    clone: (repository: string) => void;
}
export declare class GithubService implements IGitService {
    #private;
    dir: string;
    constructor(accessToken?: string);
    clone(repository: string): void;
}
declare const instance: GithubService;
export default instance;
