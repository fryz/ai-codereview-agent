import { Chunk, File } from 'parse-diff';
import { AIReviewComment, ReviewAgent } from '../interfaces/reviewAgent.interface.js';
declare class OpenAIReviewAgent implements ReviewAgent {
    private openai;
    constructor(apiKey: string);
    createPrompt(file: File, chunk: Chunk, title: string, description: string): string;
    reviewCodeForFile(file: File, prompt: string): Promise<Array<AIReviewComment[]>>;
}
export default OpenAIReviewAgent;
