import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleApiExecution } from './wrappers/handlerWrapper';
import { logger } from './utils/logger';
import { Message, PhotoData, UserAcl, VoiceData } from './model';
import { SNS } from 'aws-sdk';
import { property } from './utils/property';
import { Authorization } from './user/authorization';

const sns = new SNS();
const MESSAGE_TOPIC_ARN = property('MESSAGE_TOPIC_ARN');
const BUCKET_NAME = property('BUCKET_NAME');
const RESTRICT_USERS = property('RESTRICT_USERS') === 'true';

const authorization: Authorization = new Authorization(BUCKET_NAME);

/**
 * Processes incoming messages from Telegram and dispatches them for further handling via SNS.
 *
 * This function is designed to be used as a webhook handler for incoming messages from Telegram.
 * It captures and logs the incoming message details, including text, photos, and voice data.
 * If the message is not empty and contains relevant content (text, photo, or voice), it publishes the message
 * to an SNS topic for further processing by other components of the system.
 *
 * Additionally, if user restrictions are enabled, it checks the authorization of the user based on their username
 * before publishing the message. If the user is not authorized, the message is skipped.
 *
 * @param {APIGatewayProxyEvent} event - The event object representing the incoming message from Telegram.
 */
export const consume = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> =>
  await handleApiExecution(async () => {
    const body: any = JSON.parse(event.body || '{}');
    logger.debug({
      message: 'Capturing message.',
      body,
    });

    const message: Message = body?.message || body?.callback_query?.message
    const text: string | undefined = message?.text || message?.caption || body?.callback_query?.data;
    const photo: PhotoData[] | undefined = message.photo;
    const voice: VoiceData | undefined = message.voice;
    if (!text && !(photo && photo.length > 0) && !voice) {
      logger.warn('Invoked with empty message or text');
      return;
    }

    let userAcl: UserAcl | undefined;
    if (RESTRICT_USERS) {
      userAcl = await authorization.isAuthorized(message.chat.username);
      if (!userAcl) {
        logger.warn({ message: 'Unregistered user. Skipping conversation.'});
        return;
      }
    }

    await sns.publish({
      TopicArn: MESSAGE_TOPIC_ARN,
      Message: JSON.stringify({ message, role: userAcl?.role }),
    }).promise();
  });

