import { OpenAi } from '../openai';
import { logger } from '../../../utils/logger';
import { ChatCompletion } from 'openai/src/resources/chat/completions';
import Choice = ChatCompletion.Choice;
import { AnswerData } from '../../../model';

/**
 * This is an instance of a new open ai version of a text model which can cater for gpt-3.5-turbo and gpt-4.
 * Preferable model to use since the Davinci is outdated.
 */
export class TurboOpenAi extends OpenAi {

  async generateAnswer(prompt: any, username: string): Promise<AnswerData> {
    const completionResponse: ChatCompletion = await this._api.chat.completions.create({
      model: this._textModel,
      messages: prompt,
      temperature: this._temperature,
      max_tokens: this._maxTokens,
      user: username,
      frequency_penalty: this._frequencyPenalty,
      presence_penalty: this._presencePenalty,
    });
    logger.debug({ response: completionResponse })
    return {
      answer: this._pickChoice(completionResponse.choices),
      totalTokens: completionResponse.usage?.total_tokens,
    }
  }

  private _pickChoice(choices: Choice[]): string {
    choices.sort((
      firstChoice: Choice,
      secondChoice: Choice
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
    return choice?.message?.content || '';
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
      return new TurboOpenAi(
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