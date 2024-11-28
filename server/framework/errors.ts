import { FormattableError } from "./router";

/**
 * Corresponds to an action attempted by a user that contains bad values for parameters.
 * If this action was an HTTP request, status code for this error would be 400 Bad Request.
 */
export class BadValuesError extends FormattableError {
  public static readonly HTTP_CODE = 400;
}

/**
 * Corresponds to an action attempted by a user that is not authenticated.
 * If this action was an HTTP request, status code for this error would be 401 Unauthorized.
 */
export class UnauthenticatedError extends FormattableError {
  public static readonly HTTP_CODE = 401;
}

/**
 * Corresponds to a forbidden action attempted by a user.
 * If this action was an HTTP request, status code for this error would be 403 Forbidden.
 */
export class NotAllowedError extends FormattableError {
  public static readonly HTTP_CODE = 403;
}

/**
 * Corresponds to an action that attempts to access a resource that doesn't exist.
 * If this action was an HTTP request, status code for this error would be 404 Not Found.
 */
export class NotFoundError extends FormattableError {
  public static readonly HTTP_CODE = 404;
}

/**
 * Corresponds to an action that attempts to access a resource that has yet to be implemented in the backend.
 * If this action was an HTTP request, status code for this error would be 501 Not Implemented.
 */
export class NotImplementedError extends FormattableError {
  public static readonly HTTP_CODE = 501;

  constructor() {
    super("{0}: Functionality not yet implemented!", NotImplementedError.HTTP_CODE);
  }
}
