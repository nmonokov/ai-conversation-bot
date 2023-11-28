import { S3 } from 'aws-sdk';
import { Context } from './context';
import { ContextConfiguration } from '../model';

/**
 * Class to persist user context in the S3 bucket, so we are not relying on lambda
 * uptime and can carry user-bot session from lambda instance to lambda instance.
 */
export abstract class UserRegistry {
  protected readonly _cachedContexts: { [username: string]: Context };
  protected readonly _bucketName: string;
  protected _config: ContextConfiguration;
  protected _s3: S3;

  constructor(bucketName: string, config: ContextConfiguration) {
    this._cachedContexts = {};
    this._bucketName = bucketName;
    this._config = config;
    this._s3 = new S3();
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
    let cachedContext: Context | undefined = this.readFromMemory(username);
    if (cachedContext) {
      return cachedContext;
    }

    cachedContext = await this.readFromBucket(username);
    if (cachedContext) {
      return cachedContext;
    }

    return this.createNewContext(username);
  }

  protected readFromMemory(username: string): Context | undefined {
    return this._cachedContexts[username];
  }

  /**
   * Read user context from the file store in the S3 bucket.
   * @param username as a file name and a key in a cache map.
   */
  abstract readFromBucket(username: string): Promise<Context | undefined>;

  /**
   * Create new user context and store it into the memory cache.
   * @param username as a key in the cache map.
   */
  abstract createNewContext(username: string): Context;

  /**
   * File path on the S3 bucket.
   * @param username will be the file name of the user context.
   */
  abstract getFilePath(username: string): string;

  /**
   * Saves user context to a file. Overrides it if new changes occurs.
   * Basically will be saving on each conversation unit and behaviour change.
   *
   * @param userContext user's context with conversation and bot behaviour.
   */
  async storeUserContext(userContext: Context): Promise<void> {
    await this._s3.putObject({
      Bucket: this._bucketName,
      Key: this.getFilePath(userContext.username),
      Body: JSON.stringify(userContext),
    }).promise();
  }
}