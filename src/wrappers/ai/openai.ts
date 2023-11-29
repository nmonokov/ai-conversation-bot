import OpenAI from 'openai';
import sharp from 'sharp';
import { logger } from '../../utils/logger';
import Moderation = OpenAI.Moderation;

/**
 * Wrapper class for OpenAI API. Contains all configurations that are set up by a builder inner class.
 * Wraps methods used in this bot and uses the stored configurations.
 */
export abstract class OpenAi {
  protected readonly _api: OpenAI;
  protected readonly _textModel: string;
  protected readonly _temperature: number;
  protected readonly _maxTokens: number;
  protected readonly _frequencyPenalty: number;
  protected readonly _presencePenalty: number;

  constructor(
    apiKey: string,
    textModel: string,
    temperature: number,
    maxTokens: number,
    frequencyPenalty: number,
    presencePenalty: number,
  ) {
    this._api = new OpenAI({ apiKey });
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
    const moderationResponse = await this._api.moderations.create({
      model: 'text-moderation-latest',
      input: prompt,
    });
    const found: Moderation | undefined = moderationResponse.results
      .find((response: Moderation) => response.flagged);
    const result = found !== undefined;
    if (result) {
      logger.debug({
        message: 'Moderation endpoint',
        found,
      });
    }
    return result;
  }

  /**
   * Receives an answer from the full dialogue sequence in prompt.
   * Configuration are loaded on the lambda startup from the env variables.
   *
   * @param prompt full dialogue sequence.
   * @param username of the user who is chatting.
   */
  abstract generateAnswer(prompt: any, username: string): Promise<string>;

  /**
   * Generate an image based on prompt.
   *
   * @param prompt with image description.
   */
  async generateImage(prompt: string): Promise<string> {
    const imageCreateResponse = await this._api.images.generate({
      prompt,
      n: 1,
      model: 'dall-e-3',
      size: '1024x1024',
    });
    return imageCreateResponse.data[0].url || 'Not generated';
  }

  /**
   * Generates an image based on another image.
   *
   * @param imageData buffer of the source image.
   */
  async generateVariation(imageData: any): Promise<string> {
    const buffer: any = await this._convertToPng(imageData);
    buffer.name = 'image.png';
    const imageVariationResponse = await this._api.images.createVariation({
      image: buffer,
      n: 1,
      response_format: 'url',
      size: '512x512',
    });
    return imageVariationResponse.data[0].url || '';
  }

  private async _convertToPng(data: Buffer): Promise<any> {
    const buffer: any = await sharp(data)
      .resize(1024, 1024)
      .png()
      .toBuffer();
    buffer.name = 'image.png';
    return buffer;
  }
}


