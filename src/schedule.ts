import AWS from "aws-sdk";
import { property } from './utils/property';
import { logger } from './utils/logger';
import axios from 'axios';

const FULL_SERVICE_NAME = property('FULL_SERVICE_NAME');
const BOT_TOKEN = property('BOT_TOKEN');
const STAGE = property('STAGE');
const REGION = property('REGION');

/**
 * For some reason after 2 days of inactivity the telegram webhook disambles and fails to consume requests.
 * So in order to prevent it here's the scheduled job to reset it. Unfortunately this is the limitation
 * of working with Telegram and AWS.
 */
export const resetWebhook = async () => {
  const apiGateway = new AWS.APIGateway();
  const restApis = await apiGateway.getRestApis().promise();
  const serviceRestApi: any = restApis.items?.find((api) => api.name === FULL_SERVICE_NAME);
  if (!serviceRestApi) {
    logger.error({ message: 'Rest API was not found' })
  }

  const telegramUrl: string = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
  const webhookUrlData: { url: string } = {
    url: `https://${serviceRestApi.id}.execute-api.${REGION}.amazonaws.com/${STAGE}/conversation-webhook${BOT_TOKEN}`,
  };
  const headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
  };
  const response = await axios.post(telegramUrl, webhookUrlData, { headers });
  logger.debug({ message: response.data });
};
