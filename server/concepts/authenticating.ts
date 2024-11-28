import { DeleteResult, Filter, ObjectId, UpdateResult } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "../framework/errors";

export interface UserDoc extends BaseDoc {
  username: string;
  password: string;
}

/**
 * concept: Authenticating
 */
export default class AuthenticatingConcept {
  public readonly users: DocCollection<UserDoc>;

  /**
   * Make an instance of Authenticating.
   */
  constructor(collectionName: string) {
    this.users = new DocCollection<UserDoc>(collectionName);

    // Create index on username to make search queries for it performant
    void this.users.collection.createIndex({ username: 1 });
  }

  /**
   * Register a new `User`.
   * @param {string} username The new, user-supplied name
   * @param {string} password The associated, user-supplied password.
   * @returns {Promise<ObjectId>} The Id associated to the newly created `User`.
   * @throws {BadValuesError} If either the `username` or `password` are empty.
   * @throws {UserNotAllowedError} If the `username` already exists as a registered `User`
   */
  async register(username: string, password: string): Promise<ObjectId> {
    await this.assertGoodCredentials(username, password);
    return await this.users.createOne({ username, password });
  }

  /**
   * Redacts password from given `UserDoc` for public requests.
   * @param {UserDoc} user
   * @returns {Omit<UserDoc, "password">}
   */
  private redactPassword(user: UserDoc): Omit<UserDoc, "password"> {
    // eslint-disable-next-line
    const { password, ...rest } = user;
    return rest;
  }

  /**
   * Gets the `User` instance from its `ObjectId`.
   * @param {ObjectId} _id
   * @returns {Promise<Omit<UserDoc, "password">>} A password-less `UserDoc`.
   * @throws {UserNotFoundError} If a `User` with `_id` does not exist.
   */
  async getUserById(_id: ObjectId): Promise<Omit<UserDoc, "password">> {
    let user = await this.users.readOne({ _id });
    try {
      user = await this.users.assertDoesExist(user);
    } catch (e) {
      throw e instanceof NotFoundError ? new UserNotFoundError({ _id }) : e;
    }
    return this.redactPassword(user);
  }

  /**
   * @param {string} username The name of a registered `User`.
   * @returns {Promise<Omit<UserDoc, "password">>}
   * @throws {UserNotFoundError} If the given `username` does not exist as a registered `User`.
   */
  async getUserByUsername(username: string): Promise<Omit<UserDoc, "password">> {
    let user = await this.users.readOne({ username });
    try {
      user = await this.users.assertDoesExist(user);
    } catch (e) {
      throw e instanceof NotFoundError ? new UserNotFoundError({ username }) : e;
    }
    return this.redactPassword(user);
  }

  /**
   * @param {ObjectId[]} ids The Ids of registered `User`s.
   * @returns {Promise<string[]>} The associated usernames. Invalid Ids will be dropped from the list.
   */
  async idsToUsernames(ids: ObjectId[]): Promise<string[]> {
    const users = await this.users.readMany({ _id: { $in: ids } });

    // Store strings in Map because ObjectId comparison by reference is wrong
    const idToUser = new Map(users.map((user) => [user._id.toString(), user]));
    return ids.map((id) => idToUser.get(id.toString())?.username ?? "DELETED_USER");
  }

  /**
   * @param {string} username If given, the scope of the search is limited to a search for `username`.
   * @returns {Promise<Omit<UserDoc, "password">[]>} If `username` is undefined, return all registered `User`s.
   */
  async getUsers(username?: string): Promise<Omit<UserDoc, "password">[]> {
    const filter = username ? { username } : {};
    return (await this.users.readMany(filter)).map(this.redactPassword);
  }

  /**
   * Authenticates the given credentials.
   * @param {string} username The name of a `User`.
   * @param {string} password The password of `User`.
   * @returns {Promise<object>} An object describing what was updated.
   * @throws {UserNotFoundError} If the given `username` and `password` do not match to a registered `User`.
   */
  async authenticate(username: string, password: string): Promise<ObjectId> {
    let user = await this.users.readOne({ username, password });
    try {
      user = await this.users.assertDoesExist(user);
    } catch (e) {
      throw e instanceof NotFoundError ? new UserNotFoundError({ username, password }) : e;
    }
    return user._id;
  }

  /**
   * @param {ObjectId} _id The `ObjectId` of the `User` to update.
   * @param {string} username The new username for the `User`.
   * @returns {Promise<UpdateResult<UserDoc>>} An object describing what was updated.
   * @throws {UserNotAllowedError} If `username` is not unique.
   */
  async updateUsername(_id: ObjectId, username: string): Promise<UpdateResult<UserDoc>> {
    try {
      await this.assertUsernameUnique(username);
    } catch (e) {
      throw e instanceof NotAllowedError ? new UserNotAllowedError({ username }) : e;
    }

    return await this.users.partialUpdateOne({ _id }, { username });
  }

  /**
   * Updates the password of a `User` from `currentPassword` to `newPassword`.
   * @param _id The `ObjectId` of the `User` to update.
   * @param currentPassword The current password of the `User`.
   * @param newPassword The password the `User` wishes to update to.
   * @returns {Promise<UpdateResult<UserDoc>>} An object containing a `msg` field.
   * @throws {UserNotFoundError} If the supplied `_id` and `currentPassword` do not match to a user.
   */
  async updatePassword(_id: ObjectId, currentPassword: string, newPassword: string): Promise<UpdateResult<UserDoc>> {
    const filter = { _id, currentPassword };
    const user = await this.users.readOne(filter);
    try {
      await this.users.assertDoesExist(user);
    } catch (e) {
      throw e instanceof NotFoundError ? new UserNotFoundError(filter) : e;
    }

    return await this.users.partialUpdateOne({ _id }, { password: newPassword });
  }

  /**
   * Deletes the `User` with `_id`.
   * @param {ObjectId} _id The `ObjectId` of the `User` to delete.s
   * @returns {Promise<DeleteResult>} The result of the delete.
   */
  async delete(_id: ObjectId): Promise<DeleteResult> {
    return await this.users.deleteOne({ _id });
  }

  /**
   * Verifies the given credentials as suitable for a new `User`.
   * @param {string} username The name of the new User.
   * @param {string} password The password of the new User.
   * @throws {BadValuesError} If `username` or `password` are non-empty.
   * @throws {UserNotAllowedError} If the `username` is not unique.
   */
  private async assertGoodCredentials(username: string, password: string): Promise<void> {
    if (!username || !password) {
      throw new BadValuesError("Username and password must be non-empty!");
    }
    await this.assertUsernameUnique(username);
  }

  /**
   * Checks if the `username` currently exists as the name of a `User`.
   * @param {string} username The name of the `User` to check.
   * @throws {UserNotAllowedError} If a `User` with name `username` does not exist.
   */
  private async assertUsernameUnique(username: string): Promise<void> {
    const filter = { username };
    try {
      await this.users.assertDoesNotExist(await this.users.readOne(filter));
    } catch (e) {
      throw e instanceof NotAllowedError ? new UserNotAllowedError(filter) : e;
    }
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(public readonly filter: Filter<UserDoc>) {
    super(`${NotFoundError.HTTP_CODE}: User with filter ${filter} not found!`);
  }
}

export class UserNotAllowedError extends NotAllowedError {
  constructor(public readonly filter: Filter<UserDoc>) {
    super(`${NotAllowedError.HTTP_CODE}: User with filter ${filter} not allowed!`);
  }
}
