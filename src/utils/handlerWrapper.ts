import { logger } from './logger';
import { APIGatewayProxyResult } from 'aws-lambda';

export const handleExecution = (callback: () => void): APIGatewayProxyResult => {
  try {
    callback();
  } catch (error) {
    logger.error('Lambda execution failed', error);
  }
  return { body: '', statusCode: 200 };
}