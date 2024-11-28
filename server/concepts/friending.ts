import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "../framework/errors";

export interface FriendshipDoc extends BaseDoc {
  user1: ObjectId;
  user2: ObjectId;
}

export interface FriendRequestDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  status: "pending" | "rejected" | "accepted";
}

/**
 * concept: Friending [User]
 */
export default class FriendingConcept {
  public readonly friends: DocCollection<FriendshipDoc>;
  public readonly requests: DocCollection<FriendRequestDoc>;

  /**
   * Make an instance of Friending.
   */
  constructor(collectionName: string) {
    this.friends = new DocCollection<FriendshipDoc>(collectionName);
    this.requests = new DocCollection<FriendRequestDoc>(collectionName + "_requests");
  }

  /**
   * Get the friendship requests that include `user`.
   * @param {ObjectId} user
   * @returns {Promise<FriendRequestDoc[]>}
   */
  async getRequests(user: ObjectId): Promise<FriendRequestDoc[]> {
    return await this.requests.readMany({
      $or: [{ from: user }, { to: user }],
    });
  }

  /**
   * Create new friendship request.
   * @param {ObjectId} from The `User` initiating the request.
   * @param {ObjectId} to The `User` receiving the request.
   * @returns {Promise<ObjectId>} The Id of the `Request`.
   */
  async createRequest(from: ObjectId, to: ObjectId): Promise<ObjectId> {
    await this.canSendRequest(from, to);
    return await this.requests.createOne({ from, to, status: "pending" });
  }

  /**
   * Accept a friendship request.
   * @param {ObjectId} from The `User` that initiated the request.
   * @param {ObjectId} to The `User` that received the request.
   * @returns {Promise<[ObjectId, ObjectId]>} A tuple [requestId, friendId].
   */
  async acceptRequest(from: ObjectId, to: ObjectId): Promise<[ObjectId, ObjectId]> {
    await this.removePendingRequest(from, to);
    return await Promise.all([this.requests.createOne({ from, to, status: "accepted" }), this.addFriend(from, to)]);
  }

  /**
   * Reject a friendship request.
   * @param {ObjectId} from The `User` that initiated the request.
   * @param {ObjectId} to The `User` that received the request.
   * @returns {ObjectId} The Id of a new "rejected" request.
   */
  async rejectRequest(from: ObjectId, to: ObjectId): Promise<ObjectId> {
    await this.removePendingRequest(from, to);
    return await this.requests.createOne({ from, to, status: "rejected" });
  }

  /**
   * Remove a friendship request.
   * @param {ObjectId} from The `User` that initiated the request.
   * @param {ObjectId} to The `User` that received the request.
   */
  async removeRequest(from: ObjectId, to: ObjectId): Promise<void> {
    await this.removePendingRequest(from, to);
  }

  /**
   * Remove a freindship, initiated by `user`.
   * @param {ObjectId} user The `User` initiating the removal.
   * @param {ObjectId} friend The friend that is being removed.
   */
  async removeFriend(user: ObjectId, friend: ObjectId): Promise<void> {
    try {
      await this.friends.popOne({
        $or: [
          { user1: user, user2: friend },
          { user1: friend, user2: user },
        ],
      });
    } catch (e) {
      throw e instanceof NotFoundError ? new FriendNotFoundError(user, friend) : e;
    }
  }

  /**
   * Get the list of `Friend`s of `user`.
   * @param {ObjectId} user
   * @returns {ObjectId[]}
   */
  async getFriends(user: ObjectId): Promise<ObjectId[]> {
    const friendships = await this.friends.readMany({
      $or: [{ user1: user }, { user2: user }],
    });
    // Making sure to compare ObjectId using toString()
    return friendships.map((friendship) => (friendship.user1.toString() === user.toString() ? friendship.user2 : friendship.user1));
  }

  private async addFriend(user1: ObjectId, user2: ObjectId): Promise<ObjectId> {
    return this.friends.createOne({ user1, user2 });
  }

  private async removePendingRequest(from: ObjectId, to: ObjectId) {
    try {
      return await this.requests.popOne({ from, to, status: "pending" });
    } catch (e) {
      throw e instanceof NotFoundError ? new FriendRequestNotFoundError(from, to) : e;
    }
  }

  private async assertNotFriends(u1: ObjectId, u2: ObjectId) {
    const friendship = await this.friends.readOne({
      $or: [
        { user1: u1, user2: u2 },
        { user1: u2, user2: u1 },
      ],
    });
    if (friendship !== null || u1.toString() === u2.toString()) {
      throw new AlreadyFriendsError(u1, u2);
    }
  }

  private async canSendRequest(u1: ObjectId, u2: ObjectId) {
    await this.assertNotFriends(u1, u2);
    // check if there is pending request between these users
    const request = await this.requests.readOne({
      from: { $in: [u1, u2] },
      to: { $in: [u1, u2] },
      status: "pending",
    });
    if (request !== null) {
      throw new FriendRequestAlreadyExistsError(u1, u2);
    }
  }
}

export class FriendRequestNotFoundError extends NotFoundError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request from {0} to {1} does not exist!", from, to);
  }
}

export class FriendRequestAlreadyExistsError extends NotAllowedError {
  constructor(
    public readonly from: ObjectId,
    public readonly to: ObjectId,
  ) {
    super("Friend request between {0} and {1} already exists!", from, to);
  }
}

export class FriendNotFoundError extends NotFoundError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("Friendship between {0} and {1} does not exist!", user1, user2);
  }
}

export class AlreadyFriendsError extends NotAllowedError {
  constructor(
    public readonly user1: ObjectId,
    public readonly user2: ObjectId,
  ) {
    super("{0} and {1} are already friends!", user1, user2);
  }
}
