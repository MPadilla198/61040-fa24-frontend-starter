import { Authing } from "./app";
import { LabelNotAllowedError, LabelNotFoundError } from "./concepts/errors";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friending";
import { ResourceNotAllowedError, ResourceNotFoundError } from "./concepts/labelling";
import { FeedNotAllowedError, FeedNotFoundError, PostDoc, PostNotAllowedError, PostNotFoundError } from "./concepts/posting";
import { SortNotAllowedError, SortNotFoundError } from "./concepts/sorting";
import { ContentNotAllowedError, ContentNotFoundError, SourceNotAllowedError, SourceNotFoundError } from "./concepts/sourcing";
import { RenderNotAllowedError, RenderNotFoundError, TemplateNotAllowedError, TemplateNotFoundError } from "./concepts/templating";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await Authing.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await Authing.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await Authing.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
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
  return e.formatWith(e.label);
});

Router.registerError(LabelNotFoundError, async (e) => {
  return e.formatWith(e.label);
});

Router.registerError(ResourceNotAllowedError, async (e) => {
  return e.formatWith(e.resource);
});

Router.registerError(ResourceNotFoundError, async (e) => {
  return e.formatWith(e.resource);
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
