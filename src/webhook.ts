import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleApiExecution } from './wrappers/handlerWrapper';
import { logger } from './utils/logger';
import { Message, PhotoData, VoiceData } from './model';
import { SNS } from 'aws-sdk';
import { property } from './utils/property';

const sns = new SNS();
const MESSAGE_TOPIC_ARN = property('MESSAGE_TOPIC_ARN');

/**
 * Processes incoming messages from Telegram and dispatches them for further handling via SNS.
 * @param {APIGatewayProxyEvent} event - The event object representing the incoming message from Telegram.;
 */
export const consume = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> =>
  await handleApiExecution(async () => {
    const body: any = JSON.parse(event.body || '{}');
    logger.debug({
      message: 'Capturing message.',
      body,
    });

    const message: Message = body?.message || body?.callback_query?.message
    const text: string | undefined = message?.text || body?.callback_query?.data;
    const photo: PhotoData[] | undefined = message.photo;
    const voice: VoiceData | undefined = message.voice;
    if (!text && !(photo && photo.length > 0) && !voice) {
      logger.warn('Invoked with empty message or text');
      return;
    }

    await sns.publish({
      TopicArn: MESSAGE_TOPIC_ARN,
      Message: JSON.stringify({ message, text }),
    }).promise();
  });

