/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { LabelNotAllowedError, LabelNotFoundError, NotAllowedError, NotFoundError, NotImplementedError } from "./errors";
import { Label } from "./types";

export interface SortingOptions {}

export interface SortDoc extends BaseDoc {
  user: ObjectId;
  weights: Map<Label, number>;
  options?: SortingOptions;
}

/**
 * concept: Sorting [Target]
 */
export default class SortingConcept {
  public readonly sorts: DocCollection<SortDoc>;

  /**
   * Make an instance of Sorting.
   */
  constructor(collectionName: string) {
    this.sorts = new DocCollection<SortDoc>(collectionName);
  }

  async sort(sortId: ObjectId, feed: Set<ObjectId>): Promise<Array<ObjectId>> {
    const sort = await this.sorts.readOne(sortId);
    if (sort == null) {
      throw new SortNotFoundError(sortId);
    }
    return SortingConcept.Sort(sort, feed);
  }

  async add(sortId: ObjectId, label: Label, weight: number, user: ObjectId): Promise<void> {
    // system add(label: String, w: float)
    //     label not in labelIDs
    //     labelIDs += label
    //     label.weights := w
    const sort = await this.sorts.readOne(sortId);
    if (sort == null) {
      throw new SortNotFoundError(sortId);
    }
    if (sort.weights.has(label)) {
      throw new LabelNotAllowedError(label);
    }
    await this.sorts.partialUpdateOne(sortId, { user: user, weights: sort.weights.set(label, weight) });
  }

  async remove(sortId: ObjectId, label: Label): Promise<void> {
    // system remove(label: String)
    //     label in labelIDs
    //     label.weights := none
    //     labelIDs -= label
    const sort = await this.sorts.readOne(sortId);
    if (sort == null) {
      throw new SortNotFoundError(sortId);
    }
    if (!sort.weights.has(label)) {
      throw new LabelNotFoundError(label);
    }
    sort.weights.delete(label);
    await this.sorts.partialUpdateOne(sortId, { weights: sort.weights });
  }

  async set(sortId: ObjectId, label: Label, weight: number, user: ObjectId): Promise<void> {
    // system set(label: String, w: float)
    //     label in labelIDs
    //     label.weights := w
    const sort = await this.sorts.readOne(sortId);
    if (sort == null) {
      throw new SortNotFoundError(sortId);
    }
    if (!sort.weights.has(label)) {
      throw new LabelNotAllowedError(label);
    }
    await this.sorts.partialUpdateOne(sortId, { weights: sort.weights.set(label, weight) });
  }

  async get(sortId: ObjectId, label: Label): Promise<number> {
    // system get(label: String, out w: float)
    //     label in labelIDs
    //     w := label.weights
    const sort = await this.sorts.readOne(sortId);
    if (sort == null) {
      throw new SortNotFoundError(sortId);
    }
    const result = sort.weights.get(label);
    if (result == undefined) {
      throw new LabelNotAllowedError(label);
    }
    return result;
  }

  private static Sort(sort: SortDoc, feed: Set<ObjectId>): Array<ObjectId> {
    throw new NotImplementedError();
  }
}

export class SortNotFoundError extends NotFoundError {
  constructor(public readonly sort: ObjectId) {
    super("{0}: Sort of ID {1} not found!", NotFoundError.HTTP_CODE, sort);
  }
}

export class SortNotAllowedError extends NotAllowedError {
  constructor(public readonly sort: ObjectId) {
    super("{0}: Sort of ID {1} is not allowed!", NotAllowedError.HTTP_CODE, sort);
  }
}
