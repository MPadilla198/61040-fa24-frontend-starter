import { DeleteResult, Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "../framework/errors";

export interface PostOptions {
  backgroundColor?: string;
}

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: ObjectId;
  options?: PostOptions;
}

export interface FeedDoc extends BaseDoc {
  name: string;
  posts: DocCollection<PostDoc>;
}

/**
 * concept: Posting [Author]
 */
export default class PostingConcept {
  public readonly feeds: DocCollection<FeedDoc>;

  /**
   * Make an instance of Posting.
   */
  constructor(collectionName: string) {
    this.feeds = new DocCollection<FeedDoc>(collectionName);
  }

  async register(name: string): Promise<ObjectId> {
    // id not in feedIDs
    // n not in feedIDs.name
    // feedIDs += id
    // id.feed := {}
    // id.name := n
    try {
      await this.feeds.assertDoesNotExist(await this.feeds.readOne({ name }));
    } catch (e) {
      if (e instanceof NotAllowedError) {
        throw new FeedNotAllowedError({ name });
      } else {
        throw e;
      }
    }
    return await this.feeds.createOne({ name: name, posts: new DocCollection<PostDoc>(name) });
  }

  async unregister(id: ObjectId): Promise<DeleteResult> {
    // id in feedIDs
    // id.name := none
    // id.feed := none
    // feedIDs -= id
    try {
      await this.feeds.assertDoesExist(await this.feeds.readOne(id));
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new FeedNotFoundError(id);
      } else {
        throw e;
      }
    }
    return await this.feeds.deleteOne(id);
  }

  async post(feedId: ObjectId, author: ObjectId, content: ObjectId, options?: PostOptions): Promise<ObjectId> {
    // fID in feedIDs
    // rID not in fID.feed
    // fID.feed += rID
    try {
      const feed = await this.feeds.assertDoesExist(await this.feeds.readOne(feedId));
      return await feed.posts.createOne({ author, content, options });
    } catch (e) {
      throw e instanceof NotFoundError ? new FeedNotFoundError(feedId) : e;
    }
  }

  async unpost(feedId: ObjectId, postId: ObjectId): Promise<DeleteResult> {
    // unpost(fID: String, rID: String)
    //   fID in feedIDs
    //   rID in fID.feed
    //   fID.feed -= rID
    try {
      const feed = await this.feeds.assertDoesExist(await this.feeds.readOne(feedId));
      await feed.posts.assertDoesExist(await feed.posts.readOne(postId));
      return await this.feeds.deleteOne(postId);
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new FeedNotFoundError(feedId);
      } else if (e instanceof PostNotFoundError) {
        throw new PostNotFoundError(postId);
      } else {
        throw e;
      }
    }
  }

  async get(feedId: ObjectId): Promise<Set<PostDoc>> {
    // get(id: String, out f: set String)
    //   id in feedIDs
    //   f := id.feed
    try {
      const feed = await this.feeds.assertDoesExist(await this.feeds.readOne(feedId));
      const posts = await feed.posts.readMany({});
      return new Set<PostDoc>(posts);
    } catch (e) {
      throw e instanceof NotFoundError ? new FeedNotFoundError(feedId) : e;
    }
  }
}

export class FeedNotFoundError extends NotFoundError {
  constructor(public readonly _filter: Filter<FeedDoc>) {
    super(`${NotFoundError.HTTP_CODE}: Feed with filter ${_filter} is not found!`);
  }
}

export class FeedNotAllowedError extends NotAllowedError {
  constructor(public readonly _filter: Filter<FeedDoc>) {
    super(`${NotAllowedError.HTTP_CODE}: Feed with filter ${_filter} is not allowed, as it already exists!`);
  }
}

export class PostNotFoundError extends NotFoundError {
  constructor(public readonly _filter: Filter<PostDoc>) {
    super(`${NotFoundError.HTTP_CODE}: Post with filter ${_filter} is not found!`);
  }
}

export class PostNotAllowedError extends NotAllowedError {
  constructor(public readonly _filter: Filter<PostDoc>) {
    super(`${NotFoundError.HTTP_CODE}: Post with filter ${_filter} is not allowed, as it already exists!`);
  }
}
