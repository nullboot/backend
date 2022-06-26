import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { Client as MinioClient } from 'minio';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { FileEntity } from './file.entity';
import { Connection, Repository } from 'typeorm';
import { ConfigService } from '../config/config.service';
import { URL } from 'url';
import { v4 as UUID } from 'uuid';
import { FileInfoDto, SignedFileUploadRequestDto } from './dto';
import { DoneFileUploadError } from './dto';

const SECOND = 1000;
const Minute = 60;
const Hour = 60 * Minute;
const Day = 24 * Hour;

const FILE_UPLOAD_EXPIRE_TIME = 10 * Minute;
const FILE_DOWNLOAD_EXPIRE_TIME = 10 * Hour;

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
function encodeRFC5987ValueChars(str: string) {
  return (
    encodeURIComponent(str)
      // Note that although RFC3986 reserves "!", RFC5987 does not,
      // so we do not need to escape it
      .replace(/['()]/g, encodeURI) // i.e., %27 %28 %29
      .replace(/\*/g, '%2A')
      // The following are not required for percent-encoding per RFC5987,
      // so we can allow for a little better readability over the wire: |`^
      .replace(/%(?:7C|60|5E)/g, decodeURI)
  );
}

interface MinioEndpointConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
}

function parseEndpointUrl(endpoint: string): MinioEndpointConfig {
  const url = new URL(endpoint);
  if (url.pathname !== '/')
    throw new Error('MinIO endpoint URL of a sub-directory is not supported.');
  if (url.username || url.password || url.hash || url.search) {
    throw new Error(
      'Authorization, search parameters and hash are not supported for MinIO endpoint URL.',
    );
  }

  let useSSL: boolean;
  if (url.protocol === 'http:') useSSL = false;
  else if (url.protocol === 'https:') useSSL = true;
  else
    throw new Error(
      `Invalid protocol "${url.protocol}" for MinIO endpoint URL. Only HTTP and HTTPS are supported.`,
    );

  return {
    endPoint: url.hostname,
    port: url.port ? Number(url.port) : useSSL ? 443 : 80,
    useSSL,
  };
}

function parseUserEndpointUrl(
  endpoint: string,
): (originalUrl: string) => string {
  if (!endpoint) return (originalUrl) => originalUrl;

  const url = new URL(endpoint);
  if (url.hash || url.search)
    throw new Error(
      'Search parameters and hash are not supported for MinIO user endpoint URL.',
    );
  if (!url.pathname.endsWith('/'))
    throw new Error("MinIO user endpoint URL must ends with '/'.");

  return (originalUrl) => {
    const parsedOriginUrl = new URL(originalUrl);
    return new URL(
      parsedOriginUrl.pathname.slice(1) +
        parsedOriginUrl.search +
        parsedOriginUrl.hash,
      url,
    ).toString();
  };
}

@Injectable()
export class FileService implements OnModuleInit {
  private readonly minioClient: MinioClient;
  private readonly bucket: string;
  private readonly switchToUserEndpoint: (originalUrl: string) => string;

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly configService: ConfigService,
  ) {
    const minioConfig = this.configService.config.services.minio;
    this.minioClient = new MinioClient({
      ...parseEndpointUrl(minioConfig.endpoint),
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });

    this.bucket = minioConfig.bucket;
    this.switchToUserEndpoint = parseUserEndpointUrl(minioConfig.userEndpoint);
  }

  async onModuleInit(): Promise<void> {
    let bucketExists: boolean;
    try {
      bucketExists = await this.minioClient.bucketExists(this.bucket);
    } catch (e) {
      throw new Error(
        `Error initializing the MinIO client. Please check your configuration file and MinIO server. ${e}`,
      );
    }

    if (!bucketExists)
      throw new Error(
        `MinIO bucket ${this.bucket} doesn't exist. Please check your configuration file and MinIO server.`,
      );
  }

  async findById(id: number): Promise<FileEntity> {
    if (id == null) return null;
    return await this.fileRepository.findOne(id);
  }

  async validate(id: number): Promise<boolean> {
    return (await this.fileRepository.count({ id })) !== 0;
  }

  async checkExistenceByUUID(uuid: string): Promise<boolean> {
    return (await this.fileRepository.count({ uuid })) !== 0;
  }

  async create(
    uuid: string,
    size: number,
  ): Promise<[file: FileEntity, error: DoneFileUploadError]> {
    if (await this.checkExistenceByUUID(uuid))
      return [null, DoneFileUploadError.FILE_UUID_EXISTS];

    // Check file existence
    try {
      await this.minioClient.statObject(this.bucket, uuid);
    } catch (e) {
      if (e.message === 'Not Found')
        return [null, DoneFileUploadError.FILE_NOT_UPLOADED];
      throw e;
    }

    // Save to the database
    const file = await this.fileRepository.save({
      uuid,
      size,
      uploadTime: new Date(),
    });

    return [file, null];
  }

  /**
   * Sign an upload request for given size. The MinIO user endpoint will be used in the POST URL.
   */
  async sign(size?: number): Promise<SignedFileUploadRequestDto> {
    const uuid = UUID();
    const policy = this.minioClient.newPostPolicy();
    policy.setBucket(this.bucket);
    policy.setKey(uuid);
    policy.setExpires(new Date(Date.now() + FILE_UPLOAD_EXPIRE_TIME * SECOND));
    if (size != null) {
      policy.setContentLengthRange(size || 0, size || 0);
    }
    const policyResult = await this.minioClient.presignedPostPolicy(policy);

    return {
      uuid,
      url: this.switchToUserEndpoint(policyResult.postURL),
      extraFormData: policyResult.formData,
      fileFieldName: 'file',
    };
  }

  async delete(file: FileEntity): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucket, file.uuid);
    } catch (e) {
      Logger.error(`Error deleting file ${file.uuid} from MinIO. ${e}`);
    }
    await this.fileRepository.remove(file);
  }

  async deleteById(id: number) {
    const file = await this.findById(id);
    if (file == null) return;
    await this.delete(file);
  }

  private async signDownloadLink({
    uuid,
    downloadFilename,
    noExpire,
  }: {
    uuid: string;
    downloadFilename?: string;
    noExpire?: boolean;
  }): Promise<string> {
    const url = await this.minioClient.presignedGetObject(
      this.bucket,
      uuid,
      // The maximum expire time is 7 days
      noExpire ? 7 * Day : FILE_DOWNLOAD_EXPIRE_TIME,
      !downloadFilename
        ? {}
        : {
            'response-content-disposition': `attachment; filename="${encodeRFC5987ValueChars(
              downloadFilename,
            )}"`,
          },
    );

    return this.switchToUserEndpoint(url);
  }

  async getFileInfo(
    file: FileEntity,
    downloadFilename?: string,
  ): Promise<FileInfoDto> {
    return {
      id: file.id,
      uuid: file.uuid,
      size: file.size,
      uploadTime: file.uploadTime,
      downloadLink: await this.signDownloadLink({
        uuid: file.uuid,
        downloadFilename,
      }),
    };
  }

  async getFileInfoById(
    id: number,
    downloadFilename?: string,
  ): Promise<FileInfoDto> {
    const file = await this.findById(id);
    if (file == null) return null;
    return await this.getFileInfo(file, downloadFilename);
  }
}
