import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { Chunk, File } from 'parse-diff'
import { z } from 'zod'
import {
  AIReviewComment,
  ReviewAgent
} from '../interfaces/reviewAgent.interface.js'

const OpenAIAgentReviewComment = z.object({
  reviews: z.array(
    z.object({
      comment: z.string(),
      filePath: z.string(),
      lineNumber: z.number()
    })
  )
})

class OpenAIReviewAgent implements ReviewAgent {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  createPrompt(
    file: File,
    chunk: Chunk,
    title: string,
    description: string
  ): string {
    return `Your task is to review pull requests. Instructions:
    - Provide response in JSON Format
    - Do not give positive comments or compliments.
    - Provide comments and suggestions ONLY if there is something to improve, otherwise "reviews" should be an empty array.
    - Write the comment in GitHub Markdown format.
    - Use the given description only for the overall context and only comment the code.
    - IMPORTANT: NEVER suggest adding comments to the code.
    
    Review the following code diff in the file "${
      file.to
    }" and take the pull request title and description into account when writing the response.
      
    Pull request title: ${title}
    Pull request description:
    
    ---
    ${description}
    ---
    
    Git diff to review:
    
    \`\`\`diff
    ${chunk.content}
    ${chunk.changes
      // @ts-expect-error - ln and ln2 exists where needed
      .map((c) => `${c.ln ? c.ln : c.ln2} ${c.content}`)
      .join('\n')}
    \`\`\`
    `
  }

  async reviewCodeForFile(
    file: File,
    prompt: string
  ): Promise<Array<AIReviewComment[]>> {
    const queryConfig = {
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 700,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    }

    try {
      const response = await this.openai.chat.completions.create({
        ...queryConfig,
        messages: [{ role: 'system', content: prompt }],
        response_format: zodResponseFormat(OpenAIAgentReviewComment, 'reviews')
      })

      const rawReviews = response.choices[0].message?.content?.trim() || '{}'
      const reviews = JSON.parse(rawReviews).reviews

      return reviews
    } catch (error) {
      console.error('Error while reviewing code for file:', file.to, error)
      throw error
    }
  }
}

export default OpenAIReviewAgent
