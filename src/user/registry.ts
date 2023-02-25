import { Context } from '../model';
import { S3 } from 'aws-sdk';
import { UserContext } from './context';

const s3 = new S3();

/**
 * Class to persist user context in the S3 bucket, so we are not relying on lambda
 * uptime and can carry user-bot session from lambda instance to lambda instance.
 */
export class UserRegistry {
  private readonly _cachedContexts: { [username: string]: Context };
  private readonly _bucketName: string;

  constructor(bucketName: string) {
    this._cachedContexts = {};
    this._bucketName = bucketName;
  }

  /**
   * Get user context from:
   *  1. Memory cache if present.
   *  2. Stored file on s3 bucket.
   *  3. Creates new if none present.
   *
   * @param username telegram user's name
   */
  async getUserContext(username: string): Promise<Context> {
    const cachedContext: Context = this._cachedContexts[username];
    if (cachedContext) {
      return cachedContext;
    }

    const objectBody: string | undefined = (await s3.getObject({
      Bucket: this._bucketName,
      Key: `${username}.json`
    }).promise()).Body?.toString();
    if (objectBody) {
      const userContext: Context = JSON.parse(objectBody);
      this._cachedContexts[username] = userContext;
      return userContext;
    }

    const newContext: Context = new UserContext(username);
    this._cachedContexts[username] = newContext;
    return newContext;
  }

  /**
   * Saves user context to a file. Overrides it if new changes occurs.
   * Basically will be saving on each conversation unit and behaviour change.
   *
   * @param userContext user's context with conversation and bot behaviour.
   */
  async storeUserContext(userContext: Context): Promise<void> {
    await s3.putObject({
      Bucket: this._bucketName,
      Key: `${userContext.username}.json`,
      Body: userContext,
    }).promise();
  }
}