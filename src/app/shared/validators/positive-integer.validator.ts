import { AbstractControl, ValidatorFn, ValidationErrors } from "@angular/forms";

export function positiveIntegerValidator(): ValidatorFn {
  const positiveIntegerRegex = /^[1-9]\d*$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { positiveInteger: true };
    }
    const stringValue = value.toString();
    return positiveIntegerRegex.test(stringValue)
      ? null
      : { positiveInteger: true };
  };
}
