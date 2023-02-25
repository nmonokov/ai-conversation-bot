import { Configuration, OpenAIApi } from 'openai';
import sharp from 'sharp';
import {
  CreateCompletionResponse,
  CreateCompletionResponseChoicesInner,
  CreateModerationResponseResultsInner
} from 'openai/api';
import { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

/**
 * Wrapper class for OpenAI API. Contains all configurations that are set up by a builder inner class.
 * Wraps methods used in this bot and uses the stored configurations
 */
export class OpenAi {
  private readonly _api: OpenAIApi;
  private readonly _textModel: string;
  private readonly _temperature: number;
  private readonly _maxTokens: number;
  private readonly _frequencyPenalty: number;
  private readonly _presencePenalty: number;

  private constructor(
    apiKey: string,
    textModel: string,
    temperature: number,
    maxTokens: number,
    frequencyPenalty: number,
    presencePenalty: number,
  ) {
    this._api = new OpenAIApi(new Configuration({ apiKey }));
    this._textModel = textModel;
    this._temperature = temperature;
    this._maxTokens = maxTokens;
    this._frequencyPenalty = frequencyPenalty;
    this._presencePenalty = presencePenalty;
  }

  /**
   * Moderation endpoint to check whether prompt is safe or not.
   * Returns true if entry is not safe.
   *
   * @param prompt to check.
   */
  async isProhibited(prompt: string): Promise<boolean> {
    const moderationResponse = await this._api.createModeration({
      model: 'text-moderation-latest',
      input: prompt,
    });
    const found: CreateModerationResponseResultsInner | undefined = moderationResponse.data.results
      .find((result: CreateModerationResponseResultsInner) => result.flagged);
    logger.debug({
      message: 'Moderation endpoint',
      found,
      url: moderationResponse.request.url,
    });
    return found !== undefined;
  }

  /**
   * Receives an answer from the full dialogue sequence in prompt.
   * Configuration are loaded on the lambda startup from the env variables.
   *
   * @param prompt full dialogue sequence.
   * @param username of the user who is chatting.
   */
  async generateAnswer(prompt: string, username: string): Promise<string> {
    const completionResponse: AxiosResponse<CreateCompletionResponse> = await this._api.createCompletion({
      model: this._textModel,
      prompt,
      max_tokens: this._maxTokens,
      temperature: this._temperature,
      user: username,
      frequency_penalty: this._frequencyPenalty,
      presence_penalty: this._presencePenalty,
    });
    return  this._pickChoice(completionResponse.data.choices);
  }

  /**
   * Generate an image based on prompt.
   *
   * @param prompt with image description.
   */
  async generateImage(prompt: string): Promise<string> {
    const imageCreateResponse = await this._api.createImage({ prompt, n: 1, size: '1024x1024' });
    return imageCreateResponse.data.data[0].url || 'Not generated';
  }

  /**
   * Generates an image based on another image.
   *
   * @param imageData buffer of the source image.
   */
  async generateVariation(imageData: any): Promise<string> {
    const buffer: any = await this._convertToPng(imageData);
    const imageVariationResponse = await this._api.createImageVariation(buffer, 1, '1024x1024');
    return imageVariationResponse.data.data[0].url || '';
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

  private async _convertToPng(data: Buffer): Promise<any> {
    const buffer: any = await sharp(data)
      .resize(1024, 1024)
      .png()
      .toBuffer();
    buffer.name = 'image.png';
    return buffer;
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
      return new OpenAi(
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


