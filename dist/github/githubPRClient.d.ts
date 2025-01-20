import { PRClient, PRDetails, PRLocator } from '../interfaces/prClient.interface.js';
import { AIReviewComment } from '../interfaces/reviewAgent.interface.js';
export interface GithubPRLocator extends PRLocator {
    owner: string;
    repo: string;
    prNumber: number;
}
export declare class GithubPRClient implements PRClient<GithubPRLocator> {
    private octokit;
    constructor(token: string);
    getPRDetails(locator: GithubPRLocator): Promise<PRDetails<GithubPRLocator>>;
    getDiff(locator: GithubPRLocator): Promise<string | null>;
    writeReview(locator: GithubPRLocator, reviewComments: Array<AIReviewComment>): Promise<void>;
}
