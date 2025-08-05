import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

export interface SearchableDropdownOption {
  id: string;
  label: string;
  value: string;
}

@Component({
  selector: "app-searchable-dropdown",
  templateUrl: "./searchable-dropdown.html",
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class SearchableDropdown {
  // Input properties
  options = input.required<SearchableDropdownOption[]>();
  placeholder = input<string>("Search...");
  buttonText = input<string>("Select option");
  selectedValue = input<string | null>(null);
  isOpen = input<boolean>(false);

  // Output events
  selectionChange = output<string | null>();
  openChange = output<boolean>();

  // Internal state
  searchQuery = signal("");
  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const options = this.options();

    if (!query) {
      return options;
    }

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query)
    );
  });

  // Computed properties
  selectedOption = computed(() => {
    const selectedValue = this.selectedValue();
    return this.options().find((option) => option.value === selectedValue);
  });

  displayText = computed(() => {
    const selected = this.selectedOption();
    return selected ? selected.label : this.buttonText();
  });

  displayTextClass = computed(() => {
    const selected = this.selectedOption();
    return selected ? "text-gray-900" : "text-gray-500";
  });

  constructor() {
    // Reset search when dropdown closes
    effect(() => {
      if (!this.isOpen()) {
        this.searchQuery.set("");
      }
    });
  }

  onToggleDropdown() {
    this.openChange.emit(!this.isOpen());
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onOptionSelect(option: SearchableDropdownOption) {
    this.selectionChange.emit(option.value);
    this.openChange.emit(false);
  }

  onClearSelection() {
    this.selectionChange.emit(null);
    this.openChange.emit(false);
  }

  trackByOption(index: number, option: SearchableDropdownOption): string {
    return option.id;
  }
}
