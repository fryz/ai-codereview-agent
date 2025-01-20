import { Chunk, File } from 'parse-diff'

export type AIReviewComment = {
  comment: string
  filePath: string
  lineNumber: number
}

export interface ReviewAgent {
  createPrompt: (
    file: File,
    chunk: Chunk,
    title: string,
    description: string
  ) => string
  reviewCodeForFile: (
    file: File,
    prompt: string
  ) => Promise<Array<AIReviewComment[]>>
}
