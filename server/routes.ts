/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Labelling, Sessioning, Sorting, Sourcing } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";

import { Label, SourceTarget } from "./concepts/types";

import { z } from "zod";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  /*****
   * Posting
   */

  @Router.get("/posts")
  @Router.validate(z.object({ author: z.string().optional() }))
  async getPosts(author?: string) {
    // let posts;
    // if (author) {
    //   const id = (await Authing.getUserByUsername(author))._id;
    //   posts = await Posting.getByAuthor(id);
    // } else {
    //   posts = await Posting.getPosts();
    // }
    // // return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: SessionDoc, content: string, options?: PostOptions) {
    const user = Sessioning.getUser(session);
    // const created = await Posting.create(user, content, options);
    // return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:id")
  async updatePost(session: SessionDoc, id: string, content?: string, options?: PostOptions) {
    // const user = Sessioning.getUser(session);
    // const oid = new ObjectId(id);
    // await Posting.assertAuthorIsUser(oid, user);
    // return await Posting.update(oid, content, options);
  }

  @Router.delete("/posts/:id")
  async deletePost(session: SessionDoc, id: string) {
    // const user = Sessioning.getUser(session);
    // const oid = new ObjectId(id);
    // await Posting.assertAuthorIsUser(oid, user);
    // // return Posting.delete(oid);
  }

  /*****
   * Friending
   */

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  /*****
   * Sourcing
   */

  @Router.post("/source/:target")
  async addSource(session: SessionDoc, path_uri: string, target: SourceTarget): Promise<ObjectId> {
    const user = Sessioning.getUser(session);
    return await Sourcing.register(target, path_uri, user);
  }

  @Router.get("/source")
  async getSources(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Sourcing.lookupSources(user);
  }

  @Router.get("/source/:sourceId")
  async getSourceContent(session: SessionDoc, sourceId: ObjectId) {
    const user = Sessioning.getUser(session);
    return await Sourcing.lookupSource(sourceId, user);
  }

  @Router.delete("/source/:sourceId")
  async removeSource(session: SessionDoc, sourceId: ObjectId) {
    const user = Sessioning.getUser(session);
    return await Sourcing.unregister(sourceId, user);
  }

  /*****
   * Labelling
   */

  @Router.post("/label/:label/:weight")
  @Router.validate(z.object({ label: z.string(), weight: z.number() }))
  async newLabel(session: SessionDoc, label: Label, weight: number) {
    const user = Sessioning.getUser(session);
    const labelId = await Labelling.register(label, user);
    return await Sorting.add(labelId, label, weight, user);
  }

  @Router.put("/label/:label/:weight")
  @Router.validate(z.object({ label: z.string(), weight: z.number() }))
  async setLabel(session: SessionDoc, label: Label, weight: number) {
    const user = Sessioning.getUser(session);
    const labelId = await Labelling.lookup(label, user);
    return await Sorting.set(labelId._id, label, weight, user);
  }

  // @Router.delete("/label/:label")
  // @Router.validate(z.object({ label: z.string() }))
  // async deleteLabel(session: SessionDoc, label: Label) {
  //   const user = Sessioning.getUser(session);
  //   const la
  // }

  @Router.put("/label/:label/:postID")
  @Router.validate(z.object({ label: z.string() }))
  async addLabel(session: SessionDoc, label: string, postID: ObjectId) {
    const user = Sessioning.getUser(session);
    return await Labelling.add(postID, label, user);
  }

  /*****
   * Templating
   */

  @Router.put("/template/:targets")
  async addTemplate(session: SessionDoc, targets: SourceTarget[]) {}

  /*****
   * Sorting
   */

  @Router.put("/template/remove/:id")
  async removeTemplate(session: SessionDoc, id: string) {}
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
