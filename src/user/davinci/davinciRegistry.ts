import { UserRegistry } from '../registry';
import { Context } from '../context';
import { logger } from '../../utils/logger';
import { DavinciContext } from './davinciContext';

/**
 * User registry using the legacy version of the open ai model.
 */
export class DavinciRegistry extends UserRegistry {

  async readFromBucket(username: string): Promise<Context | undefined> {
    try {
      const userObject = await this._s3.getObject({
        Bucket: this._bucketName,
        Key: this.getFilePath(username)
      }).promise();
      const objectBody: string = userObject.Body?.toString() || `{ username: ${username} }`;
      const parsedContext: any = JSON.parse(objectBody);
      const davinciContext = new DavinciContext(
        username,
        parsedContext._conversationContext,
        parsedContext._tokensThreshold,
        parsedContext._spliceThreshold,
        parsedContext._behaviour,
      );
      this._cachedContexts[username] = davinciContext;
      return davinciContext;
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
    const davinciContext = new DavinciContext(
      username,
      [],
      this._config.tokensThreshold,
      this._config.spliceThreshold,
    );
    this._cachedContexts[username] = davinciContext;
    return davinciContext;
  }

  getFilePath(username: string): string {
    return `davinci/${username}.json`;
  }
}