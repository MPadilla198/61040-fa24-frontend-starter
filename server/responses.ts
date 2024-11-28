import { ObjectId } from "mongodb";
import { Authing } from "./app";
import { LabelNotAllowedError, LabelNotFoundError } from "./concepts/errors";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { ResourceNotAllowedError, ResourceNotFoundError } from "./concepts/labelling";
import { FeedNotAllowedError, FeedNotFoundError, PostDoc, PostNotAllowedError, PostNotFoundError } from "./concepts/posting";
import { SortNotAllowedError, SortNotFoundError } from "./concepts/sorting";
import { ContentNotAllowedError, ContentNotFoundError, SourceNotAllowedError, SourceNotFoundError } from "./concepts/sourcing";
import { RenderNotAllowedError, RenderNotFoundError, TemplateNotAllowedError, TemplateNotFoundError } from "./concepts/templating";
import { Router } from "./framework/router";

export type BaseResponse = {
  HTTP_CODE: number;
  msg?: string;
  body?: unknown;
  location?: ObjectId;
  [key: string]: unknown;
};

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   * @param {PostDoc} post
   * @returns {Promise<BaseResponse>} With JSON `body` including `author` and `Post` components.
   * @throws {UserNotFoundError} If `post.author` does not exist as a registered `User`.
   */
  static async post(post: PostDoc): Promise<BaseResponse> {
    const author = await Authing.getUserById(post.author);
    return {
      HTTP_CODE: 200,
      body: {
        ...post,
        author: author.username,
      },
    };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   * @param {PostDoc[]} posts
   * @returns {Promise<BaseResponse>}
   */
  static async posts(posts: PostDoc[]): Promise<BaseResponse> {
    const authors = await Authing.idsToUsernames(posts.map((post) => post.author));
    return {
      HTTP_CODE: 200,
      body: posts.map((post, i) => ({ ...post, author: authors[i] })),
    };
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   * @param {FriendRequestDoc[]} requests
   * @returns {Promise<BaseResponse>} With `body` being a list of requests
   */
  static async friendRequests(requests: FriendRequestDoc[]): Promise<BaseResponse> {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await Authing.idsToUsernames(from.concat(to));
    return {
      HTTP_CODE: 200,
      body: requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] })),
    };
  }
}

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.from), Authing.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([Authing.getUserById(e.user1), Authing.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FeedNotFoundError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(FeedNotAllowedError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(PostNotFoundError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(PostNotAllowedError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(LabelNotAllowedError, async (e) => {
  return e.formatWith(e.filter);
});

Router.registerError(LabelNotFoundError, async (e) => {
  return e.formatWith(e.filter);
});

Router.registerError(ResourceNotAllowedError, async (e) => {
  return e.formatWith(e.filter);
});

Router.registerError(ResourceNotFoundError, async (e) => {
  return e.formatWith(e.filter);
});

Router.registerError(SourceNotFoundError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(SourceNotAllowedError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(ContentNotFoundError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(ContentNotAllowedError, async (e) => {
  return e.formatWith(e._filter);
});

Router.registerError(TemplateNotAllowedError, async (e) => {
  return e.formatWith(e._id);
});

Router.registerError(TemplateNotFoundError, async (e) => {
  return e.formatWith(e._id);
});

Router.registerError(RenderNotFoundError, async (e) => {
  return e.formatWith(e._id);
});

Router.registerError(RenderNotAllowedError, async (e) => {
  return e.formatWith(e._id);
});

Router.registerError(SortNotFoundError, async (e) => {
  return e.formatWith(e.sort);
});

Router.registerError(SortNotAllowedError, async (e) => {
  return e.formatWith(e.sort);
});
