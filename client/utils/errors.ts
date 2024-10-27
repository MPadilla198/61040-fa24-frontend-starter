/**
 * A formattable error. Use `{0}`, `{1}`, etc. in the error message to format it with the arguments passed to the constructor.
 * The `formatWith` method can be used to create a new error with the same format but different arguments.
 *
 * Example:
 * ```
 * let error = new FormattableError("{0} is not the author of post {1}!", author, _id);
 * let errorWithUsername = e.formatWith(username, _id);
 * ```
 */
export class FormattableError extends Error {
  public HTTP_CODE: number = 500;

  constructor(
    public readonly format: string,
    ...args: unknown[]
  ) {
    super(
      format.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== "undefined" ? (args[number] as string) : match;
      }),
    );
  }

  formatWith(...args: unknown[]) {
    const e = new FormattableError(this.format, ...args);
    e.HTTP_CODE = this.HTTP_CODE;
    return e;
  }
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
