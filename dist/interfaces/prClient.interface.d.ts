import { AIReviewComment } from './reviewAgent.interface.js';
export interface PRLocator {
    id: string;
}
export interface PRDetails<T extends PRLocator> {
    locator: T;
    title: string;
    description: string;
}
export interface PRClient<T extends PRLocator = PRLocator> {
    getPRDetails: (prLocator: T) => Promise<PRDetails<T>>;
    getDiff: (locator: T) => Promise<string | null>;
    writeReview: (locator: T, reviewComments: Array<AIReviewComment>) => Promise<void>;
}
