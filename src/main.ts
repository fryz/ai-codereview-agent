import * as core from '@actions/core'
import { readFileSync } from 'fs'
import { minimatch } from 'minimatch'
import parseDiff from 'parse-diff'
import { GithubPRClient, GithubPRLocator } from './github/githubPRClient.js'
import { AIReviewComment } from './interfaces/reviewAgent.interface.js'
import OpenAIReviewAgent from './openAI/openAIReviewAgent.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    console.log('Get authentication keys')
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN')
    const OPENAI_API_KEY = core.getInput('OPENAI_API_KEY')

    const githubClient = new GithubPRClient(GITHUB_TOKEN)
    const openAIReviewAgent = new OpenAIReviewAgent(OPENAI_API_KEY)

    console.log('Get PR details')
    const { repository, prNumber } = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH || '', 'utf-8')
    )

    const prLocator: GithubPRLocator = {
      id: repository.id,
      owner: repository.owner.login,
      repo: repository.name,
      prNumber: prNumber
    }

    const prDetails = await githubClient.getPRDetails(prLocator)

    console.log('Get PR diff')
    const diff = await githubClient.getDiff(prLocator)
    if (!diff) {
      console.log('No diff found for PR')
      return
    }
    const parsedDiff = parseDiff(diff)

    console.log('Filter diff and remove excluded files')
    const excludedFiles = [
      'package.lock',
      '*.json',
      '*.md',
      '*.yaml',
      '*.yml',
      '*.lock',
      '*.lock.json',
      '*.lock.yaml',
      '*.lock.yml'
    ]

    const filteredDiff = parsedDiff.filter(
      (file) =>
        !excludedFiles.some((pattern) => minimatch(file.to ?? '', pattern))
    )

    console.log('Review the PR diff')
    const comments: Array<AIReviewComment> = []
    for (const file of filteredDiff) {
      const isDeleted = file.to === '/dev/null'
      if (!file.to || isDeleted) continue

      for (const chunk of file.chunks) {
        const prompt = openAIReviewAgent.createPrompt(
          file,
          chunk,
          prDetails.title,
          prDetails.description
        )
        const commentsForChunk = await openAIReviewAgent.reviewCodeForFile(
          file,
          prompt
        )
        if (commentsForChunk.length > 0) {
          comments.push(...commentsForChunk.flat())
        }
      }
    }

    console.log('Write review')
    if (comments.length > 0) {
      await githubClient.writeReview(prLocator, comments)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
