import { logger } from './logger';
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Wrapper for a Lambda function to prevent constant retries on unhandled errors.
 * @param callback Lambda function
 */
export const handleExecution = (callback: () => void): APIGatewayProxyResult => {
  try {
    callback();
  } catch (error) {
    logger.error('Lambda execution failed', error);
  }
  return { body: '', statusCode: 200 };
}