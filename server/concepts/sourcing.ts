/* eslint-disable @typescript-eslint/no-unused-vars */
import { Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, NotImplementedError } from "./errors";
import { SourceTarget } from "./types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SourcingOptions {}

export interface SourceDoc extends BaseDoc {
  user: ObjectId;
  path_uri: string;
  target: SourceTarget;
  contentIDs: Set<ObjectId>;
  options?: SourcingOptions;
}

export interface ContentDoc extends BaseDoc {
  user: ObjectId;
  contentID: ObjectId;
  data: ObjectId;
}

/**
 * concept: Sourcing [Target]
 */
export default class SourcingConcept {
  public readonly sources: DocCollection<SourceDoc>;
  public readonly content: DocCollection<ContentDoc>;

  /**
   * Make an instance of Sourcing.
   */
  constructor(collectionName: string) {
    this.sources = new DocCollection<SourceDoc>(collectionName);
    this.content = new DocCollection<ContentDoc>(collectionName);
  }

  async register(target: SourceTarget, uri: string, user: ObjectId): Promise<ObjectId> {
    // id not in sourceIDs
    // sourceIDs += id
    // id.source := t
    await this.assertSourceDoesNotExist({ target, uri, user });
    const source = await this.sources.createOne({
      target: target,
      path_uri: uri,
      user: user,
      contentIDs: new Set<ObjectId>(),
    });
    return source;
  }

  async unregister(sourceID: ObjectId, user: ObjectId): Promise<void> {
    // id in sourceIDs
    // sourceIDs -= id
    // id.source := none
    // id.content.data := none
    // id.content := none
    const result = await this.sources.readOne(sourceID);
    if (result == null) {
      throw new SourceNotFoundError(sourceID);
    }
    await this.assertUserOwns(result, user);
    await this.sources.deleteOne(sourceID);
  }

  async lookupSource(sourceID: ObjectId, user: ObjectId): Promise<SourceDoc> {
    // id in sourceIDs
    // t := id.sources
    await this.assertSourceExists(sourceID); // When uncommented, the linter does not recognize the assert
    const result = await this.sources.readOne({ sourceID, user });
    if (result == null) {
      throw new SourceNotFoundError(sourceID);
    }

    await this.assertUserOwns(result, user);
    return result;
  }

  async lookupSources(user: ObjectId): Promise<SourceDoc[]> {
    const result = await this.sources.readMany({ user });
    if (result == null) {
      throw new SourceNotFoundError({ user });
    }

    return result;
  }

  async get(contentID: ObjectId, user: ObjectId): Promise<ContentDoc> {
    // id in contentIDs
    // t := id.content

    const result = await this.content.readOne(contentID);
    if (result == null) {
      throw new SourceNotFoundError(contentID);
    }

    await this.assertUserOwns(result, user);
    return result;
  }

  async update(sourceID: ObjectId) {
    // id in sourceIDs
    // contentID not in contentIDs
    // id.content += contentID
    // contentID.data := Get(id.source)
    await this.assertSourceExists(sourceID);
    const source = await this.sources.readOne(sourceID);
    const newContent = SourcingConcept.Get(source?.target, source?.path_uri);
    for (const id of newContent.values()) {
      throw new NotImplementedError(); // todo
    }
  }

  private static Get(target: SourceTarget | undefined, uri: string | undefined): Set<ContentDoc> {
    throw new NotImplementedError(); // TODO
  }

  private async assertUserOwns(source: SourceDoc | ContentDoc, user: ObjectId) {
    if (!source.user.equals(user)) {
      throw new SourceNotAllowedError(source._id);
    }
  }

  private async assertSourceExists(filter: Filter<SourceDoc>) {
    const result = await this.sources.readOne(filter);
    if (result == null) {
      throw new SourceNotAllowedError(filter);
    }
  }

  private async assertSourceDoesNotExist(filter: Filter<SourceDoc>) {
    const result = await this.sources.readOne(filter);
    if (result != null) {
      throw new SourceNotFoundError(filter);
    }
  }

  private async assertContentExists(filter: Filter<ContentDoc>) {
    const result = await this.content.readOne(filter);
    if (result == null) {
      throw new ContentNotAllowedError(filter);
    }
  }

  private async assertContentDoesNotExist(filter: Filter<ContentDoc>) {
    const result = await this.content.readOne(filter);
    if (result != null) {
      throw new ContentNotFoundError(filter);
    }
  }
}

export class SourceNotFoundError extends NotFoundError {
  constructor(public readonly _filter: Filter<SourceDoc>) {
    super("{0}: Source with filter {1} is not found!", NotFoundError.HTTP_CODE, _filter);
  }
}

export class SourceNotAllowedError extends NotAllowedError {
  constructor(public readonly _filter: Filter<SourceDoc>) {
    super("{0}: Source with filter {1} is not allowed, as it already exists!", NotFoundError.HTTP_CODE, _filter);
  }
}

export class ContentNotFoundError extends NotFoundError {
  constructor(public readonly _filter: Filter<ContentDoc>) {
    super("{0}: Content with filter {1} is not found!", NotFoundError.HTTP_CODE, _filter);
  }
}

export class ContentNotAllowedError extends NotAllowedError {
  constructor(public readonly _filter: Filter<ContentDoc>) {
    super("{0}: Content with filter {1} is not allowed, as it already exists!", NotFoundError.HTTP_CODE, _filter);
  }
}
