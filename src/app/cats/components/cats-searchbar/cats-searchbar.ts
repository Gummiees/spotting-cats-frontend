import {
  Component,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  SimpleChanges,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Subscription } from "rxjs";

@Component({
  selector: "app-cats-searchbar",
  templateUrl: "./cats-searchbar.html",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CatsSearchbar implements OnInit, OnChanges, OnDestroy {
  search = input<string>("");
  searchChange = output<string>();
  onSearch = output<string>();
  private searchSubscription!: Subscription;

  searchForm = new FormGroup({
    search: new FormControl(""),
  });

  ngOnChanges(changes: SimpleChanges): void {
    const search = changes["search"];
    if (search && search.currentValue !== search.previousValue) {
      this.searchForm.patchValue(
        { search: search.currentValue },
        { emitEvent: false }
      );
    }
  }

  ngOnInit(): void {
    this.searchSubscription = this.searchForm.valueChanges.subscribe(
      (value) => {
        this.searchChange.emit(value.search ?? "");
      }
    );
  }

  onReset() {
    this.searchForm.reset();
  }

  onSearchClick() {
    this.onSearch.emit(this.searchForm.value.search ?? "");
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }
}
