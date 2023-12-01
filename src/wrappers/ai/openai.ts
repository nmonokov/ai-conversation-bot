import OpenAI from 'openai';
import { logger } from '../../utils/logger';
import Moderation = OpenAI.Moderation;
import { ChatCompletion } from 'openai/resources';

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

  async analyseImage(imageUrl: string, caption: string): Promise<string> {
    const completionResponse: ChatCompletion = await this._api.chat.completions.create({
      model: 'gpt-4-vision-preview',
      max_tokens: this._maxTokens,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: caption,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      }],
    });
    const answer = completionResponse.choices.find((choice: any) => choice.finish_details?.type === 'stop');
    return answer?.message?.content || '';
  }

  async speechToText(voiceData: any): Promise<string> {
    const transcription = await this._api.audio.transcriptions.create({
      model: 'whisper-1',
      response_format: "text",
      file: voiceData,
    });
    return transcription as unknown as string;
  }

}


