import { logger } from '../utils/logger';
import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Wrapper for a Lambda function to prevent constant retries on unhandled errors.
 * @param callback Lambda function
 */
export const handleApiExecution = async (callback: () => Promise<void>): Promise<APIGatewayProxyResult> => {
  await handleExecution(callback);
  return { body: '', statusCode: 200 };
}

export const handleSnsExecution = async (callback: () => Promise<void>): Promise<void> => {
  await handleExecution(callback);
};

const handleExecution = async (callback: () => Promise<void>): Promise<void> => {
  try {
    await callback();
  } catch (error: any) {
    logger.error({
      message: 'Lambda execution failed',
      error,
      errorMessage: error.message,
    });
  }
}