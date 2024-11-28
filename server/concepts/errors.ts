import { Filter } from "mongodb";
import { NotAllowedError, NotFoundError } from "../framework/errors";
import { LabelDoc } from "./labelling";

export class LabelNotFoundError extends NotFoundError {
  constructor(public readonly filter: Filter<LabelDoc>) {
    super(`${NotFoundError.HTTP_CODE}: Label with filter ${filter} not found!`);
  }
}

export class LabelNotAllowedError extends NotAllowedError {
  constructor(public readonly filter: Filter<LabelDoc>) {
    super(`${NotAllowedError.HTTP_CODE}: Label with filter ${filter} not allowed!`);
  }
}
