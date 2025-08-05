import { CommonModule } from "@angular/common";
import { Component, forwardRef, input, signal } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export const CUSTOM_CONROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NullableSwitch),
  multi: true,
};
@Component({
  selector: "app-nullable-switch",
  templateUrl: "./nullable-switch.html",
  standalone: true,
  imports: [CommonModule],
  providers: [CUSTOM_CONROL_VALUE_ACCESSOR],
})
export class NullableSwitch implements ControlValueAccessor {
  // Input properties for customizing colors
  trueColor = input<string>("bg-green-500");
  falseColor = input<string>("bg-red-500");

  value = signal<boolean | null>(null);
  disabled = signal<boolean>(false);
  onChanged = (_: boolean | null) => {};
  onTouched = () => {};

  writeValue(value: boolean | null): void {
    this.value.set(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onValueChange(newValue: boolean | null): void {
    if (this.disabled()) return;
    this.value.set(newValue);
    this.onChanged(newValue);
    this.onTouched();
  }

  cycleValue(): void {
    if (this.disabled()) return;

    const currentValue = this.value();
    let newValue: boolean | null;

    if (currentValue === false) {
      newValue = null;
    } else if (currentValue === null) {
      newValue = true;
    } else {
      newValue = false;
    }

    this.onValueChange(newValue);
  }

  registerOnChange(fn: (value: boolean | null) => void): void {
    this.onChanged = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
