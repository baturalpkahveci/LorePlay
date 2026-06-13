import { v2 as cloudinary } from 'cloudinary';
import { hasCloudinaryConfig, serverConfig } from '../config.js';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
export const maxImageSize = 8 * 1024 * 1024;

export interface ImageUploadInput {
  buffer: Buffer;
  mimeType: string;
  size: number;
  userId: string;
}

export interface UploadedImage {
  url: string;
  publicId: string;
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export class ImageUploadError extends Error {
  constructor() {
    super('Cloudinary upload failed.');
    this.name = 'ImageUploadError';
  }
}

export class CloudinaryImageService {
  constructor() {
    cloudinary.config({
      cloud_name: serverConfig.cloudinary.cloudName!,
      api_key: serverConfig.cloudinary.apiKey!,
      api_secret: serverConfig.cloudinary.apiSecret!,
      secure: true,
    });
  }

  async upload(input: ImageUploadInput): Promise<UploadedImage> {
    if (!allowedImageTypes.has(input.mimeType)) throw new ImageValidationError('Unsupported image type.');
    if (input.size > maxImageSize) throw new ImageValidationError('Image must be 8 MB or smaller.');
    if (input.size === 0) throw new ImageValidationError('Choose an image to upload.');

    try {
      const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: `loreplay/${input.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error || !result) reject(error || new Error('Upload failed.'));
            else resolve({ secure_url: result.secure_url, public_id: result.public_id });
          },
        );
        stream.end(input.buffer);
      });

      return { url: uploaded.secure_url, publicId: uploaded.public_id };
    } catch {
      throw new ImageUploadError();
    }
  }
}

export const imageService = hasCloudinaryConfig
  ? new CloudinaryImageService()
  : undefined;
