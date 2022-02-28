import {
  arrayMaxSize,
  arrayUnique,
  maxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsCommaSeperatedString(
  arrayMax: number,
  itemMax: number,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'IsCommaSeperatedString',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: `$property must be a comma-seprated string, must contain not more than ${arrayMax} elements, each item must be unique, and shorter than or equal to ${itemMax}`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value === 'string') {
            const items = value.split(',');
            if (!arrayMaxSize(items, arrayMax)) {
              return false;
            }
            if (!arrayUnique(items)) {
              return false;
            }
            for (let i = 0; i < items.length; i++) {
              const item = items[i];
              if (!maxLength(item, itemMax)) {
                return false;
              }
            }
            return true;
          }
          return false;
        },
      },
    });
  };
}
