import { AxiosResponse } from 'axios';
import {
  CreateCompletionResponse,
  CreateCompletionResponseChoicesInner
} from 'openai/api';
import { logger } from '../../../utils/logger';
import { OpenAi } from '../openai';

/**
 * Legacy text model system. Better use turbo instead.
 */
export class DavinciOpenAi extends OpenAi {

  async generateAnswer(prompt: any, username: string): Promise<string> {
    const completionResponse: AxiosResponse<CreateCompletionResponse> = await this._api.createCompletion({
      model: this._textModel,
      prompt,
      max_tokens: this._maxTokens,
      temperature: this._temperature,
      user: username,
      frequency_penalty: this._frequencyPenalty,
      presence_penalty: this._presencePenalty,
    });
    logger.debug({ response: completionResponse.data })
    return this._pickChoice(completionResponse.data.choices);
  }

  private _pickChoice(choices: CreateCompletionResponseChoicesInner[]): string {
    choices.sort((
      firstChoice: CreateCompletionResponseChoicesInner,
      secondChoice: CreateCompletionResponseChoicesInner
    ) => {
      if (firstChoice.finish_reason === 'stop') {
        return -1;
      } else if (secondChoice.finish_reason === 'stop') {
        return 1;
      }
      return 0;
    });
    const choice = choices[0];
    if (choice.finish_reason !== 'stop') {
      logger.warn({
        message: 'Failed to fully generate the message',
        reason: choice.finish_reason,
      });
    }
    return choice.text || '';
  }

  static Builder = class {
    private static _apiKey: string;
    private static _textModel: string;
    private static _temperature: number;
    private static _maxTokens: number;
    private static _frequencyPenalty: number;
    private static _presencePenalty: number;

    static apiKey(value: string) {
      this._apiKey = value;
      return this;
    }

    static textModel(value: string) {
      this._textModel = value;
      return this;
    }

    static temperature(value: string) {
      this._temperature = Number(value);
      return this;
    }

    static maxTokens(value: string) {
      this._maxTokens = Number(value);
      return this;
    }

    static frequencyPenalty(value: string) {
      this._frequencyPenalty = Number(value);
      return this;
    }

    static presencePenalty(value: string) {
      this._presencePenalty = Number(value);
      return this;
    }

    static build() {
      return new DavinciOpenAi(
        this._apiKey,
        this._textModel,
        this._temperature,
        this._maxTokens,
        this._frequencyPenalty,
        this._presencePenalty
      );
    }
  }
}