import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Cat } from "@models/cat";

interface BadgeConfig {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  ringColor: string;
  iconColor: string;
}

@Component({
  selector: "app-cat-badges",
  templateUrl: "cat-badges.html",
  standalone: true,
  imports: [CommonModule],
})
export class CatBadges {
  cat = input.required<Cat>();

  private getBadgeConfigs(): BadgeConfig[] {
    const configs: BadgeConfig[] = [];

    if (this.cat().isDomestic === true) {
      configs.push({
        label: "Domestic",
        icon: "home",
        bgColor: "bg-blue-50",
        textColor: "text-blue-800",
        ringColor: "ring-blue-600/20",
        iconColor: "text-blue-500",
      });
    } else if (this.cat().isDomestic === false) {
      configs.push({
        label: "Wild",
        icon: "park",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-800",
        ringColor: "ring-emerald-600/20",
        iconColor: "text-emerald-500",
      });
    }

    if (this.cat().isMale === true) {
      configs.push({
        label: "Male",
        icon: "male",
        bgColor: "bg-cyan-50",
        textColor: "text-cyan-800",
        ringColor: "ring-cyan-600/20",
        iconColor: "text-cyan-500",
      });
    } else if (this.cat().isMale === false) {
      configs.push({
        label: "Female",
        icon: "female",
        bgColor: "bg-fuchsia-50",
        textColor: "text-fuchsia-800",
        ringColor: "ring-fuchsia-600/20",
        iconColor: "text-fuchsia-500",
      });
    }

    if (this.cat().isSterilized === true) {
      configs.push({
        label: "Sterilized",
        icon: "cardiology",
        bgColor: "bg-green-50",
        textColor: "text-green-800",
        ringColor: "ring-green-600/20",
        iconColor: "text-green-500",
      });
    } else if (this.cat().isSterilized === false) {
      configs.push({
        label: "Not sterilized",
        icon: "pulse_alert",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-800",
        ringColor: "ring-yellow-600/20",
        iconColor: "text-yellow-500",
      });
    }

    if (this.cat().isFriendly === true) {
      configs.push({
        label: "Friendly",
        icon: "waving_hand",
        bgColor: "bg-violet-50",
        textColor: "text-violet-800",
        ringColor: "ring-violet-600/20",
        iconColor: "text-violet-500",
      });
    } else if (this.cat().isFriendly === false) {
      configs.push({
        label: "Spicy",
        icon: "local_fire_department",
        bgColor: "bg-red-50",
        textColor: "text-red-800",
        ringColor: "ring-red-600/20",
        iconColor: "text-red-500",
      });
    }

    return configs;
  }

  getBadges(): BadgeConfig[] {
    return this.getBadgeConfigs();
  }
}
