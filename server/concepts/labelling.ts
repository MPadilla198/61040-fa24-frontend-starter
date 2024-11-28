import { DeleteResult, Filter, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "../framework/errors";
import { LabelNotAllowedError, LabelNotFoundError } from "./errors";
import { Label } from "./types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LabelingOptions {}

export interface LabelDoc extends BaseDoc {
  user: ObjectId;
  label: Label;
  resources: Set<ObjectId>;
}

/**
 * concept: Labelling
 */
export default class LabellingConcept {
  public readonly labels: DocCollection<LabelDoc>;

  /**
   * Make an instance of Labelling.
   */
  constructor(collectionName: string) {
    this.labels = new DocCollection<LabelDoc>(collectionName);
  }

  /**
   * Registers a new `Label` for `User` of `ObjectId`.
   * @param {Label} label The name of the `LabelDoc`
   * @param {ObjectId} user The ID of the `User` registering the new `Label`.
   * @returns {Promise<ObjectId>} The `ObjectId` of the new `LabelDoc` created.
   * @throws {LabelNotAllowedError} If the `label` is not unique.
   */
  async register(label: Label, user: ObjectId): Promise<ObjectId> {
    const filter = { label, user };
    try {
      await this.labels.assertDoesNotExist(await this.labels.readOne(filter));
    } catch (e) {
      throw e instanceof NotAllowedError ? new LabelNotAllowedError(filter) : e;
    }
    return await this.labels.createOne({ user: user, label: label, resources: new Set<ObjectId>() });
  }

  async unregister(label: Label, user: ObjectId): Promise<DeleteResult> {
    const filter = { label, user };
    try {
      await this.labels.assertDoesExist(await this.labels.readOne(filter));
    } catch (e) {
      throw e instanceof NotFoundError ? new LabelNotFoundError(filter) : e;
    }
    return await this.labels.deleteOne(filter);
  }

  async lookup(label: Label, user: ObjectId): Promise<LabelDoc> {
    const filter = { label, user };
    try {
      return await this.labels.assertDoesExist(await this.labels.readOne(filter));
    } catch (e) {
      throw e instanceof NotFoundError ? new LabelNotFoundError(filter) : e;
    }
  }

  async add(resource: ObjectId, label: Label, user: ObjectId): Promise<void> {
    const _label: LabelDoc = await this.labels.assertDoesExist(await this.labels.readOne({ label, user }));
    await this.labels.assertDoesNotExist(await this.labels.readOne({ label, resource, user }));
    _label.resources.add(resource);
    await this.lookup(label, user);
  }

  async remove(resource: ObjectId, label: Label, user: ObjectId): Promise<void> {
    // l in labels
    // r in l.resources
    // l.resources -= r
    // r.labelled -= l
    await this.assertLabelExists(label, user);
    await this.assertResourceExists(label, resource, user);

    const _label = await this.labels.readOne({ label, user });
    _label?.resources.delete(resource);
  }

  async get(resource: ObjectId): Promise<Set<Label>> {
    // r in labelled
    // l := r.labelled
    const result: Set<Label> = new Set<Label>();

    const labels = await this.labels.readMany({});
    labels.forEach((element) => {
      if (element.resources.has(resource)) {
        result.add(element.label);
      }
    });

    return result;
  }
}

export class ResourceNotAllowedError extends NotAllowedError {
  constructor(public readonly filter: Filter<LabelDoc>) {
    super(`${NotAllowedError.HTTP_CODE}: resource with name "${filter}" is not allowed!`);
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(public readonly filter: Filter<LabelDoc>) {
    super(`${NotFoundError.HTTP_CODE}: resource of ID ${filter} not found!`);
  }
}
