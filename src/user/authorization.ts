import { S3 } from 'aws-sdk';
import { logger } from '../utils/logger';
import { UserAcl } from '../model';

const USER_ACL_FILE_NAME = 'user-acl.json';

/**
 * The `Authorization` class is responsible for handling user authorization by checking user access control lists (ACLs) stored in an Amazon S3 bucket.
 * It interacts with the S3 service to retrieve the ACL file and determine whether a given username has the required authorization.
 */
export class Authorization {
  private readonly _bucketName: string;
  private readonly _cachedAcls: { [username: string]: UserAcl };
  private readonly _s3: S3;

  /**
   * Creates an instance of the `Authorization` class.
   * @param {string} bucketName - The name of the S3 bucket where user access control lists are stored.
   */
  constructor(bucketName: string) {
    this._bucketName = bucketName;
    this._cachedAcls = {};
    this._s3 = new S3();
  }

  /**
   * Checks whether a user is authorized based on their username.
   * This method first attempts to retrieve the user's access control list (ACL) from an in-memory cache.
   * If the ACL is found in the cache, it is returned. Otherwise, it retrieves the ACL from the specified
   * Amazon S3 bucket, determines the user's role, and updates the cache for future use.
   *
   * @param {string} username - The username for which authorization is being checked.
   */
  async isAuthorized (username: string): Promise<UserAcl | undefined> {
    const userAcl: UserAcl | undefined = this.readFromMemory(username);
    if (userAcl) {
      return userAcl;
    }
    return await this.readFromBucket(username);
  }

  private readFromMemory(username: string): UserAcl | undefined {
    return this._cachedAcls[username];
  }

  private async readFromBucket(username: string): Promise<UserAcl | undefined> {
    const s3Response = await this._s3.getObject({
      Bucket: this._bucketName,
      Key: USER_ACL_FILE_NAME,
    }).promise();
    const objectBody: string = s3Response.Body?.toString() || '[]';
    const userAcls: UserAcl[] = JSON.parse(objectBody);
    logger.debug({
      message: 'Fetched user acls',
      userAcls,
    });
    const acl: UserAcl | undefined = userAcls.find((userAcl: UserAcl) => userAcl.username === username);
    if (acl) {
      this._cachedAcls[username] = acl;
    }
    return acl;
  }
}