import { Pipe, PipeTransform } from "@angular/core";
import moment from "moment";

@Pipe({
  name: "daysAgo",
  standalone: true,
})
export class DaysAgoPipe implements PipeTransform {
  transform(date: Date | null | undefined): string {
    if (!date) {
      return "Unknown";
    }
    const daysDiff = moment().diff(moment(date), "days");
    if (daysDiff === 0) {
      return "Today";
    } else if (daysDiff === 1) {
      return "Yesterday";
    } else {
      return `${daysDiff} days ago`;
    }
  }
}
