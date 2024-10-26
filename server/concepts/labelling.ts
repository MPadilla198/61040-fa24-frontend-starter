import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { LabelNotAllowedError, LabelNotFoundError, NotAllowedError, NotFoundError } from "./errors";
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

  async register(label: Label, user: ObjectId): Promise<ObjectId> {
    // l not in labels
    // labels += l
    // l.resources := {}
    await this.assertLabelDoesNotExist(label, user);

    return await this.labels.createOne({ user: user, label: label, resources: new Set<ObjectId>() });
  }

  async unregister(label: Label, user: ObjectId): Promise<void> {
    // l in labels
    // l.resources := none
    // labels -= l
    // labels.resources -= l
    await this.assertLabelExists(label, user);
    void (await this.labels.deleteOne({ label, user }));
  }

  async lookup(label: Label, user: ObjectId): Promise<LabelDoc> {
    // l in labels
    // r := l.resources
    const result = await this.labels.readOne({ label, user });
    if (result === null) {
      throw new LabelNotFoundError(label);
    }

    return result;
  }

  async add(resource: ObjectId, label: Label, user: ObjectId): Promise<void> {
    // l in labels
    // r not in l.resources
    // l.resources += r
    // r.labelled += l
    await this.assertLabelExists(label, user);
    await this.assertResourceDoesNotExist(label, resource, user);

    const _label = await this.labels.readOne({ label, user });
    _label?.resources.add(resource);
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

  private async assertLabelExists(label: Label, user: ObjectId) {
    const result = await this.labels.readOne({ label, user });
    if (result === null) {
      throw new LabelNotFoundError(label);
    }
  }

  private async assertLabelDoesNotExist(label: Label, user: ObjectId) {
    const result = await this.labels.readOne({ label, user });
    if (result !== null) {
      throw new LabelNotAllowedError(label);
    }
  }

  private async assertResourceExists(label: Label, resource: ObjectId, user: ObjectId) {
    await this.assertLabelExists(label, user);
    const result = await this.labels.readOne({ label, user });
    if (!result?.resources.has(resource)) {
      throw new ResourceNotFoundError(resource);
    }
  }

  private async assertResourceDoesNotExist(label: Label, resource: ObjectId, user: ObjectId) {
    await this.assertLabelExists(label, user);
    const result = await this.labels.readOne({ label, user });
    if (result?.resources.has(resource)) {
      throw new ResourceNotAllowedError(resource);
    }
  }
}

export class ResourceNotAllowedError extends NotAllowedError {
  constructor(public readonly resource: ObjectId) {
    super('resource with name "{0}" is not allowed!', resource);
  }
}

export class ResourceNotFoundError extends NotFoundError {
  constructor(public readonly resource: ObjectId) {
    super("resource of ID {0} not found!", resource);
  }
}
