import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

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
    const feed = await this.feeds.readOne({ name });
    if (feed != null) {
      throw new FeedNotAllowedError({ name });
    }
    return await this.feeds.createOne({ name: name, posts: new DocCollection<PostDoc>(name) });
  }

  async unregister(id: ObjectId): Promise<void> {
    // id in feedIDs
    // id.name := none
    // id.feed := none
    // feedIDs -= id
    const feed = await this.feeds.readOne(id);
    if (feed == null) {
      throw new FeedNotFoundError(id);
    }
    await this.feeds.deleteOne(id);
  }

  async post(feedId: ObjectId, author: ObjectId, content: ObjectId, options?: PostOptions): Promise<void> {
    // fID in feedIDs
    // rID not in fID.feed
    // fID.feed += rID
    const feed = await this.feeds.readOne(feedId);
    if (feed == null) {
      throw new FeedNotFoundError(feedId);
    }
    await feed.posts.createOne({ author, content, options });
  }

  async unpost(feedId: ObjectId, postId: ObjectId) {
    // unpost(fID: String, rID: String)
    //   fID in feedIDs
    //   rID in fID.feed
    //   fID.feed -= rID
    const feed = await this.feeds.readOne(feedId);
    if (feed == null) {
      throw new FeedNotFoundError(feedId);
    }
    const post = await feed.posts.readOne(postId);
    if (post == null) {
      throw new PostNotFoundError(postId);
    }
    await this.feeds.deleteOne(postId);
  }

  async get(feedId: ObjectId): Promise<Set<PostDoc>> {
    // get(id: String, out f: set String)
    //   id in feedIDs
    //   f := id.feed
    const feed = await this.feeds.readOne(feedId);
    if (feed == null) {
      throw new FeedNotFoundError(feedId);
    }
    const posts = await feed.posts.readMany({});

    return new Set<PostDoc>(posts);
  }
}

export class FeedNotFoundError extends NotFoundError {
  constructor(public readonly _filter: Filter<FeedDoc>) {
    super("{0}: Feed with filter {1} is not found!", NotFoundError.HTTP_CODE, _filter);
  }
}

export class FeedNotAllowedError extends NotAllowedError {
  constructor(public readonly _filter: Filter<FeedDoc>) {
    super("{0}: Feed with filter {1} is not allowed, as it already exists!", NotFoundError.HTTP_CODE, _filter);
  }
}

export class PostNotFoundError extends NotFoundError {
  constructor(public readonly _filter: Filter<PostDoc>) {
    super("{0}: Post with filter {1} is not found!", NotFoundError.HTTP_CODE, _filter);
  }
}

export class PostNotAllowedError extends NotAllowedError {
  constructor(public readonly _filter: Filter<PostDoc>) {
    super("{0}: Post with filter {1} is not allowed, as it already exists!", NotFoundError.HTTP_CODE, _filter);
  }
}
