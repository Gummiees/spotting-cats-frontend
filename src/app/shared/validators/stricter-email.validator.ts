import { AbstractControl, ValidatorFn, ValidationErrors } from "@angular/forms";

export function stricterEmailValidator(): ValidatorFn {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    return emailRegex.test(value) ? null : { stricterEmail: true };
  };
}
