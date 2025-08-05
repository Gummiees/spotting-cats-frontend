import { AbstractControl, ValidatorFn, ValidationErrors } from "@angular/forms";

export function breedValidator(breeds: string[]): ValidatorFn {
  const breedRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (!breedRegex.test(value)) {
      return { breedFormat: true };
    }

    if (!breeds.includes(value)) {
      return { breedInvalid: true };
    }

    return null;
  };
}
