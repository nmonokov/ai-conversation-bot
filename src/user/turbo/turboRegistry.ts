import { UserRegistry } from '../registry';
import { Context } from '../context';
import { logger } from '../../utils/logger';
import { TurboContext } from './turboContext';

/**
 * User registry using a new open ai model.
 */
export class TurboRegistry extends UserRegistry {

  async readFromBucket(username: string): Promise<Context | undefined> {
    try {
      const userObject = await this._s3.getObject({
        Bucket: this._bucketName,
        Key: this.getFilePath(username)
      }).promise();
      const objectBody: string = userObject.Body?.toString() || `{ username: ${username} }`;
      const parsedContext: any = JSON.parse(objectBody);
      const turboContext = new TurboContext(
        username,
        parsedContext._conversationContext,
        parsedContext._tokensThreshold,
        parsedContext._spliceThreshold,
        parsedContext._behaviour,
      );
      this._cachedContexts[username] = turboContext;
      return turboContext;
    } catch (error: any) {
      if (error?.code === 'NoSuchKey') {
        logger.warn({ message: 'No user context present.', username });
      } else {
        logger.error({ message: 'Failed to get user context', error });
      }
    }
    return undefined;
  }

  createNewContext(username: string): Context {
    logger.debug({ message: 'Creating new user context.', username });
    const turboContext = new TurboContext(
      username,
      [],
      this._config.tokensThreshold,
      this._config.spliceThreshold,
    );
    this._cachedContexts[username] = turboContext;
    return turboContext;
  }

  getFilePath(username: string): string {
    return `turbo/${username}.json`;
  }
}