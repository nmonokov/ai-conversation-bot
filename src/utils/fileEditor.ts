import Ffmpeg from 'fluent-ffmpeg';
import { logger } from './logger';
import fs, { ReadStream } from 'fs';

const CHROMAKEY_IMAGE_FILTER = 'chromakey=#35C75A:0.1:0.1';
const SCALE_IMAGE_FILTER = 'scale=1024:ih*1024/iw';
const CROP_IMAGE_FILTER = 'crop=1024:1024:0:0';
const AUDIO_CODECS: { [key: string]: string} = {
  mp3: 'libmp3lame',
};

/**
 * The `FileEditor` class provides methods for converting and editing files,
 * including images and audio files, using FFmpeg and Fluent-ffmpeg.
 */
export class FileEditor {
  private readonly _filePath: string;
  private readonly _tmpFiles: string[];

  constructor(filePath: string) {
    this._filePath = filePath;
    this._tmpFiles = [];
  }

  /**
   * Converts an image to PNG format with optional filters.
   * @param imageData - The image data to be converted.
   * @returns A Promise resolving to  a ReadStream of the converted PNG file.
   */
  async convertToPng(imageData: any): Promise<ReadStream> {
    const input: string = `${this._filePath}/input.jpg`;
    const output: string = `${this._filePath}/output.png`;
    this._tmpFiles.push(...[input, output]);
    this.writeFile(input, imageData);
    const convertedImage = await this.convertImage(input, output, `${SCALE_IMAGE_FILTER},${CROP_IMAGE_FILTER}`);
    return fs.createReadStream(convertedImage);
  }

  /**
   * Converts an image to PNG format with chromakey, scale, and crop filters. Basically this is mask
   * suggested by OpenAI for the inpaint. The selected part of the image will be removed and be transparent.
   * @param imageData - The image data to be converted.
   * @returns A Promise resolving to a ReadStream of the converted PNG file with filters applied.
   */
  async convertToMask(imageData: any): Promise<ReadStream> {
    const input: string = `${this._filePath}/input_mask.jpg`;
    const output: string = `${this._filePath}/output_mask.png`;
    this._tmpFiles.push(...[input, output]);
    this.writeFile(input, imageData);
    const convertedImage = await this.convertImage(
      input,
      output,
      `${CHROMAKEY_IMAGE_FILTER},${SCALE_IMAGE_FILTER},${CROP_IMAGE_FILTER}`,
    );
    return fs.createReadStream(convertedImage);
  }

  /**
   * Converts an audio file to MP3 format.
   * @param audioData - The audio data to be converted.
   * @returns A Promise resolving to a ReadStream of the converted MP3 file.
   */
  async convertToMp3(audioData: any): Promise<ReadStream> {
    const input: string = `${this._filePath}/input.oga`;
    const output: string = `${this._filePath}/output.mp3`;
    this._tmpFiles.push(...[input, output]);
    this.writeFile(input, audioData);
    const convertedAudio = await this.convertAudio(input, output, 'mp3');
    return fs.createReadStream(convertedAudio);
  }

  removeTmpFiles(): void {
    this._tmpFiles.forEach((filePath: string) => fs.unlinkSync(filePath));
  }

  private writeFile(path: string, data: any): void {
    if (!fs.existsSync(this._filePath)) {
      fs.mkdirSync(this._filePath, { recursive: true });
    }
    fs.writeFileSync(path, data);
  }

  private convertImage(input: string, output: string, filters?: string): Promise<string> {
    return new Promise((resolve) => {
      const ffmpegCommand = this.commonCommand(input, output, resolve);
      if (filters) {
        ffmpegCommand.complexFilter(filters)
      }
      ffmpegCommand.run();
    });
  }

  private convertAudio(input: string, output: string, format: string): Promise<string> {
    return new Promise((resolve) => {
      this.commonCommand(input, output, resolve)
        .audioCodec(AUDIO_CODECS[format])
        .format(format)
        .run();
    });
  }

  private commonCommand(input: string, output: string, resolve: (value: (PromiseLike<string> | string)) => void) {
    return Ffmpeg().setFfmpegPath('/opt/ffmpeg/ffmpeg')
      .input(input)
      .output(output)
      .on('end', () => {
        logger.debug({
          message: 'Image converted',
        });
        resolve(output);
      })
      .on('error', (error: any) => {
        logger.debug({
          errorMessage: error.message,
          error,
        });
        resolve('');
      });
  }
}
