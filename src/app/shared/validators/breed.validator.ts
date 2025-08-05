import { AbstractControl, ValidatorFn, ValidationErrors } from "@angular/forms";

export function breedValidator(): ValidatorFn {
  const breedRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    return breedRegex.test(value) ? null : { breedFormat: true };
  };
}
