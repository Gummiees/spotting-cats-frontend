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

    const now = moment();
    const targetDate = moment(date);
    const diffInMinutes = now.diff(targetDate, "minutes");
    const diffInHours = now.diff(targetDate, "hours");
    const diffInDays = now.diff(targetDate, "days");

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    } else {
      return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    }
  }
}
