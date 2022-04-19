interface IGitService {
    dir: string | undefined;
    clone: (repository: string) => void;
}
export declare class GithubService implements IGitService {
    #private;
    dir: string | undefined;
    constructor(accessToken?: string);
    clone(repository: string): Promise<void>;
}
declare const instance: GithubService;
export default instance;
