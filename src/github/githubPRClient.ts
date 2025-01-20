import { Octokit } from 'octokit'
import {
  PRClient,
  PRDetails,
  PRLocator
} from '../interfaces/prClient.interface.js'
import { AIReviewComment } from '../interfaces/reviewAgent.interface.js'

export interface GithubPRLocator extends PRLocator {
  owner: string
  repo: string
  prNumber: number
}

export class GithubPRClient implements PRClient<GithubPRLocator> {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token })
  }

  async getPRDetails(
    locator: GithubPRLocator
  ): Promise<PRDetails<GithubPRLocator>> {
    const { owner, repo, prNumber } = locator
    const response = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    })

    return {
      locator,
      title: response.data.title,
      description: response.data.body ?? ''
    }
  }

  async getDiff(locator: GithubPRLocator): Promise<string | null> {
    const { owner, repo, prNumber } = locator

    const response = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    })

    const headSha = response.data.head.sha
    const baseSha = response.data.base.sha

    const diff = await this.octokit.rest.repos.compareCommits({
      headers: {
        accept: 'application/vnd.github.v3.diff'
      },
      owner,
      repo,
      base: baseSha,
      head: headSha
    })

    return String(diff.data)
  }

  async writeReview(
    locator: GithubPRLocator,
    reviewComments: Array<AIReviewComment>
  ): Promise<void> {
    const { owner, repo, prNumber } = locator

    const commentsPayload = reviewComments.map((comment) => ({
      body: comment.comment,
      path: comment.filePath,
      line: comment.lineNumber
    }))

    await this.octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      comments: commentsPayload,
      event: 'COMMENT'
    })
  }
}
