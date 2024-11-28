/* eslint-disable @typescript-eslint/no-unused-vars */
import { DeleteResult, ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, NotImplementedError } from "../framework/errors";

export enum TemplateType {
  Markdown,
}

export enum ResourceType {
  Text,
  Image,
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TemplatingOptions {}

export interface TemplateDoc extends BaseDoc {
  user: ObjectId;
  type: TemplateType;
  resources: Set<ResourceType>;
  template: ObjectId;
  options?: TemplatingOptions;
}

export interface RenderDoc extends BaseDoc {
  user: ObjectId;
  template: ObjectId;
  data: Map<string, ObjectId>;
}

/**
 * concept: Templating [Template]
 */
export default class TemplatingConcept {
  public readonly templates: DocCollection<TemplateDoc>;
  public readonly renders: DocCollection<RenderDoc>;

  /**
   * Make an instance of Templating.
   */
  constructor(collectionName: string) {
    this.templates = new DocCollection<TemplateDoc>(collectionName);
    this.renders = new DocCollection<RenderDoc>(collectionName);
  }

  async add(template: ObjectId, type: TemplateType, resources: Set<ResourceType>, user: ObjectId): Promise<ObjectId> {
    // id not in templateIDs
    // templateIDs += id
    // id.templates := t
    const _id = await this.templates.createOne({ user, type, resources, template });
    return _id;
  }

  async remove(template: ObjectId, user: ObjectId): Promise<DeleteResult> {
    // id in templateIDs
    // id.templates := none
    // templateIDs -= id
    const request = await this.templates.readOne(template);
    if (request == null) {
      throw new TemplateNotFoundError(template);
    } else if (!request.user.equals(user)) {
      throw new TemplateNotAllowedError(template);
    }
    return await this.templates.deleteOne(template);
  }

  async render(template: ObjectId, data: Map<string, ObjectId>): Promise<ObjectId> {
    // id in templateIDs
    // r not in renderIDs
    // renderIDs += r
    // r.renders := Render(id.templates, d)
    await this.assertTemplateExists(template);
    return await this.Render(template, data);
  }

  async getRender(render: ObjectId): Promise<RenderDoc> {
    // id in renderIDs
    // r := id.renders
    const request = await this.renders.readOne(render);
    if (request === null) {
      throw new RenderNotFoundError(render);
    }
    return request;
  }

  private async Render(template: ObjectId, data: Map<string, ObjectId>): Promise<ObjectId> {
    throw new NotImplementedError(); // todo
  }

  private async assertTemplateExists(template: ObjectId): Promise<void> {
    const result = await this.templates.readOne(template);
    if (result == null) {
      throw new TemplateNotFoundError(template);
    }
  }
}

export class TemplateNotAllowedError extends NotAllowedError {
  constructor(public readonly _id: ObjectId) {
    super("{0}: Template of ID {1} not allowed!", NotAllowedError.HTTP_CODE, _id);
  }
}

export class TemplateNotFoundError extends NotFoundError {
  constructor(public readonly _id: ObjectId) {
    super("{0}: Template of ID {1} not found!", NotFoundError.HTTP_CODE, _id);
  }
}

export class RenderNotAllowedError extends NotAllowedError {
  constructor(public readonly _id: ObjectId) {
    super("{0}: Render of ID {1} is not allowed!", NotAllowedError.HTTP_CODE, _id);
  }
}

export class RenderNotFoundError extends NotFoundError {
  constructor(public readonly _id: ObjectId) {
    super("{0}: Render of ID {1} not found!", NotFoundError.HTTP_CODE, _id);
  }
}
