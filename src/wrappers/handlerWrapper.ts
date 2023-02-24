import { logger } from '../utils/logger';
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Wrapper for a Lambda function to prevent constant retries on unhandled errors.
 * @param callback Lambda function
 */
export const handleExecution = async (callback: () => Promise<void>): Promise<APIGatewayProxyResult> => {
  try {
    await callback();
  } catch (error) {
    logger.error('Lambda execution failed', error);
  }
  return { body: '', statusCode: 200 };
}