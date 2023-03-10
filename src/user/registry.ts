import { Context } from '../model';
import { S3 } from 'aws-sdk';
import { UserContext } from './context';
import { logger } from '../utils/logger';

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

    try {
      const userObject = await s3.getObject({
        Bucket: this._bucketName,
        Key: `${username}.json`
      }).promise();
      const objectBody: string = userObject.Body?.toString() || `{ username: ${username} }`;
      const parsedContext: any = JSON.parse(objectBody);
      this._cachedContexts[username] = UserContext.from(parsedContext);
      return this._cachedContexts[username];
    } catch (error) {
      logger.error({ message: 'Failed to get user context', error });
    }

    logger.debug('Creating new user context.');
    this._cachedContexts[username] = UserContext.new(username);
    return this._cachedContexts[username]
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
      Body: JSON.stringify(userContext),
    }).promise();
  }
}