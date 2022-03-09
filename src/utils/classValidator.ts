import {
  buildMessage,
  matches,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

export const NOT_MATCHES = 'notMatches';

/**
 * Checks if string not matches the pattern. Either not matches('foo', /foo/i)
 * If given value is not a string, then it returns false.
 */
export function NotMatches(
  pattern: RegExp,
  validationOptions?: ValidationOptions,
): PropertyDecorator;
export function NotMatches(
  pattern: string,
  modifiers?: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator;
export function NotMatches(
  pattern: RegExp | string,
  modifiersOrAnnotationOptions?: string | ValidationOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  let modifiers: string;
  if (
    modifiersOrAnnotationOptions &&
    modifiersOrAnnotationOptions instanceof Object &&
    !validationOptions
  ) {
    validationOptions = modifiersOrAnnotationOptions;
  } else {
    modifiers = modifiersOrAnnotationOptions as string;
  }

  return ValidateBy(
    {
      name: NOT_MATCHES,
      constraints: [pattern, modifiers],
      validator: {
        validate: (value, args): boolean =>
          !matches(value, args.constraints[0], args.constraints[0]),
        defaultMessage: buildMessage(
          (eachPrefix, args) =>
            eachPrefix +
            '$property must not match $constraint1 regular expression',
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
