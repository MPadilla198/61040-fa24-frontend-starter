/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Labelling, Sessioning, Sorting, Sourcing } from "./app";
import { PostOptions } from "./concepts/posting";
import { SessionDoc } from "./concepts/sessioning";
import Responses, { BaseResponse } from "./responses";

import { StatusCodes } from "http-status-codes";

import { SourceTarget } from "./concepts/types";

import { z } from "zod";

class Schema {
  static readonly ObjectId = z.string();
  static readonly Session = z.object({
    cookie: z.object({
      originalMaxAge: z.number().nullable(),

      maxAge: z.number().optional(),
      signed: z.boolean().optional(),
      expires: z.date().nullable().optional(),
      httpOnly: z.boolean().optional(),
      path: z.string().optional(),
      domain: z.string().optional(),
      secure: z.union([z.boolean(), z.enum(["auto"])]).optional(),
      sameSite: z.union([z.boolean(), z.enum(["lax", "strict", "none"])]).optional(),
    }),
    user: Schema.ObjectId.optional(),
  });
  static readonly Username = z.string().min(1);
  static readonly Password = z.string();
  static readonly PostAuthor = z.string();
  static readonly PostContent = z.string();
  static readonly URI = z.string();
  static readonly SourceTarget = z.nativeEnum(SourceTarget);
  static readonly Label = z.string();
  static readonly LabelWeight = z.number();
}

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  @Router.validate(z.object({ session: Schema.Session }).strict())
  async getSessionUser(session: SessionDoc): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return { HTTP_CODE: StatusCodes.OK, body: await Authing.getUserById(user) };
  }

  @Router.get("/users")
  @Router.validate(z.never())
  async getUsers(): Promise<BaseResponse> {
    return { HTTP_CODE: StatusCodes.OK, body: await Authing.getUsers() };
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: Schema.Username }).strict())
  async getUser(username: string): Promise<BaseResponse> {
    return { HTTP_CODE: StatusCodes.OK, body: await Authing.getUserByUsername(username) };
  }

  @Router.post("/users")
  @Router.validate(z.object({ session: Schema.Session, username: Schema.Username, password: Schema.Password }).strict())
  async createUser(session: SessionDoc, username: string, password: string): Promise<BaseResponse> {
    Sessioning.isLoggedOut(session);
    return { HTTP_CODE: StatusCodes.CREATED, msg: "User created successfully!", body: await Authing.register(username, password) };
  }

  @Router.patch("/users/username")
  @Router.validate(z.object({ session: Schema.Session, username: Schema.Username }).strict())
  async updateUsername(session: SessionDoc, username: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return { HTTP_CODE: StatusCodes.OK, msg: "Username updated successfully!", body: await Authing.updateUsername(user, username) };
  }

  @Router.patch("/users/password")
  @Router.validate(z.object({ session: Schema.Session, currentPassword: Schema.Password, newPassword: Schema.Password }).strict())
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return { HTTP_CODE: StatusCodes.OK, msg: "Password updated successfully!", body: await Authing.updatePassword(user, currentPassword, newPassword) };
  }

  @Router.delete("/users")
  @Router.validate(z.object({ session: Schema.Session }).strict())
  async deleteUser(session: SessionDoc): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return { HTTP_CODE: StatusCodes.OK, body: await Authing.delete(user) };
  }

  @Router.post("/login")
  @Router.validate(z.object({ session: Schema.Session, username: Schema.Username, password: Schema.Password }).strict())
  async logIn(session: SessionDoc, username: string, password: string): Promise<BaseResponse> {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u);
    return { HTTP_CODE: StatusCodes.OK, msg: "Logged in!" };
  }

  @Router.post("/logout")
  @Router.validate(z.object({ session: Schema.Session }).strict())
  async logOut(session: SessionDoc): Promise<BaseResponse> {
    Sessioning.end(session);
    return { HTTP_CODE: StatusCodes.OK, msg: "Logged out!" };
  }

  /*****
   * Posting
   */

  @Router.get("/posts")
  @Router.validate(z.object({ author: Schema.PostAuthor.optional() }))
  async getPosts(author?: string): Promise<BaseResponse> {
    return;
  }

  @Router.post("/posts")
  @Router.validate(z.object({ session: Schema.Session, content: Schema.PostContent }))
  async createPost(session: SessionDoc, content: string, options?: PostOptions): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return;
  }

  @Router.patch("/posts/:postId")
  @Router.validate(z.object({ session: Schema.Session, postId: Schema.ObjectId, content: Schema.PostContent.optional() }))
  async updatePost(session: SessionDoc, postId: string, content?: string, options?: PostOptions): Promise<BaseResponse> {
    return;
  }

  @Router.delete("/posts/:postId")
  @Router.validate(z.object({ session: Schema.Session, postId: Schema.ObjectId }))
  async deletePost(session: SessionDoc, postId: string): Promise<BaseResponse> {
    return;
  }

  /*****
   * Friending
   */

  @Router.get("/friends")
  @Router.validate(z.object({ session: Schema.Session }))
  async getFriends(session: SessionDoc): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  @Router.validate(z.object({ session: Schema.Session, friend: Schema.Username }))
  async deleteFriendship(session: SessionDoc, friend: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  @Router.validate(z.object({ session: Schema.Session }))
  async getRequests(session: SessionDoc): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  @Router.validate(z.object({ session: Schema.Session, to: Schema.Username }))
  async createFriendRequest(session: SessionDoc, to: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.createRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  @Router.validate(z.object({ session: Schema.Session, to: Schema.Username }))
  async deleteFriendRequest(session: SessionDoc, to: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  @Router.validate(z.object({ session: Schema.Session, from: Schema.Username }))
  async acceptFriendRequest(session: SessionDoc, from: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  @Router.validate(z.object({ session: Schema.Session, from: Schema.Username }))
  async rejectFriendRequest(session: SessionDoc, from: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  /*****
   * Sourcing
   */

  @Router.post("/source/:target")
  @Router.validate(z.object({ session: Schema.Session, pathUri: Schema.URI, target: Schema.SourceTarget }))
  async addSource(session: SessionDoc, pathUri: string, target: SourceTarget): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Sourcing.register(target, pathUri, user);
  }

  @Router.get("/source")
  @Router.validate(z.object({ session: Schema.Session }))
  async getSources(session: SessionDoc): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Sourcing.lookupMany(user);
  }

  @Router.get("/source/:sourceId")
  @Router.validate(z.object({ session: Schema.Session, sourceId: Schema.ObjectId }))
  async getSourceContent(session: SessionDoc, sourceId: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Sourcing.lookupOne(new ObjectId(sourceId), user);
  }

  @Router.delete("/source/:sourceId")
  @Router.validate(z.object({ session: Schema.Session, sourceId: Schema.ObjectId }))
  async deleteSource(session: SessionDoc, sourceId: string): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Sourcing.unregister(new ObjectId(sourceId), user);
  }

  /*****
   * Labelling
   */

  @Router.post("/label/:label/:weight")
  @Router.validate(z.object({ session: Schema.Session, label: Schema.Label, weight: Schema.LabelWeight }))
  async newLabel(session: SessionDoc, label: string, weight: number): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const labelId = await Labelling.register(label, user);
    await Sorting.add(sortId, label, weight, user);
  }

  @Router.put("/label/:label/:weight")
  @Router.validate(z.object({ session: Schema.Session, label: Schema.Label, weight: Schema.LabelWeight }))
  async setLabel(session: SessionDoc, label: string, weight: number): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    const labelId = (await Labelling.lookup(label, user))._id;
    await Sorting.set(labelId, label, weight, user);
  }

  @Router.delete("/label/:label")
  @Router.validate(z.object({ session: Schema.Session, label: Schema.Label }))
  async deleteLabel(session: SessionDoc, label: string) {}

  @Router.put("/label/:label/:postID")
  @Router.validate(z.object({ session: Schema.Session, label: Schema.Label, postId: Schema.ObjectId }))
  async addLabel(session: SessionDoc, label: string, postID: ObjectId): Promise<BaseResponse> {
    const user = Sessioning.getUser(session);
    return await Labelling.add(postID, label, user);
  }

  /*****
   * Templating
   */

  @Router.put("/template/:targets")
  async addTemplate(session: SessionDoc, targets: SourceTarget[]): Promise<BaseResponse> {}

  /*****
   * Sorting
   */

  @Router.put("/template/remove/:id")
  async removeTemplate(session: SessionDoc, id: string): Promise<BaseResponse> {}
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
