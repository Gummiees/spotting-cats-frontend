import { CommonModule } from "@angular/common";
import { Component, input, computed, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AdminProfileUser } from "@models/admin-profile-user";
import { IconButton } from "../icon-button/icon-button";
import { v4 as uuidv4 } from "uuid";

export type TimelineItemType =
  | "ban"
  | "ban-ip"
  | "unban"
  | "unban-ip"
  | "demote-to-user"
  | "promote-to-superadmin"
  | "promote-to-admin"
  | "promote-to-moderator"
  | "inactive"
  | "activate"
  | "create-account"
  | "update-email"
  | "update-username"
  | "update-avatar"
  | "update-profile"
  | "note";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  username: string;
  avatarUrl: string;
  date: Date;
  text?: string;
  doneBy?: string;
  isEditable?: boolean;
}

export const DELETED_USER = "deleted-user";

export function transformUserToTimelineItem(
  user: AdminProfileUser,
  loggedInUser?: string
): TimelineItem[] {
  const items: TimelineItem[] = [
    {
      id: uuidv4(),
      type: "create-account",
      username: user.username,
      avatarUrl: user.avatarUrl,
      date: user.createdAt,
    },
  ];
  if (user.isBanned && !!user.bannedAt) {
    switch (user.banType) {
      case "ip":
        items.push({
          id: uuidv4(),
          type: "ban-ip",
          username: user.username,
          avatarUrl: user.avatarUrl,
          date: user.bannedAt!,
          doneBy: user.bannedBy ?? DELETED_USER,
          text: user.banReason,
        });
        break;
      default:
        items.push({
          id: uuidv4(),
          type: "ban",
          username: user.username,
          avatarUrl: user.avatarUrl,
          date: user.bannedAt!,
          text: user.banReason,
          doneBy: user.bannedBy ?? DELETED_USER,
        });
        break;
    }
  }
  if (user.isInactive && !!user.deactivatedAt) {
    items.push({
      id: uuidv4(),
      type: "inactive",
      username: user.username,
      avatarUrl: user.avatarUrl,
      date: user.deactivatedAt,
    });
  }
  if (!!user.roleUpdatedAt) {
    if (user.role === "admin") {
      items.push({
        id: uuidv4(),
        type: "promote-to-admin",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.roleUpdatedAt!,
        doneBy: user.roleUpdatedBy ?? DELETED_USER,
      });
    }
    if (user.role === "moderator") {
      items.push({
        id: uuidv4(),
        type: "promote-to-moderator",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.roleUpdatedAt!,
        doneBy: user.roleUpdatedBy ?? DELETED_USER,
      });
    }
    if (user.role === "superadmin") {
      items.push({
        id: uuidv4(),
        type: "promote-to-superadmin",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.roleUpdatedAt!,
        doneBy: user.roleUpdatedBy ?? DELETED_USER,
      });
    } else {
      items.push({
        id: uuidv4(),
        type: "demote-to-user",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.roleUpdatedAt!,
        doneBy: user.roleUpdatedBy ?? DELETED_USER,
      });
    }
  }
  if (!!user.updatedAt) {
    if (user.avatarUpdatedAt) {
      items.push({
        id: uuidv4(),
        type: "update-avatar",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.avatarUpdatedAt,
      });
    }
    if (user.emailUpdatedAt) {
      items.push({
        id: uuidv4(),
        type: "update-email",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.emailUpdatedAt,
      });
    }
    if (user.usernameUpdatedAt) {
      items.push({
        id: uuidv4(),
        type: "update-username",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.usernameUpdatedAt,
      });
    } else {
      items.push({
        id: uuidv4(),
        type: "update-profile",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: user.updatedAt,
      });
    }
  }
  if (!!user.notes) {
    user.notes.forEach((note) => {
      items.push({
        id: note.id,
        type: "note",
        username: user.username,
        avatarUrl: user.avatarUrl,
        date: note.createdAt,
        text: note.note,
        doneBy: note.fromUser ?? DELETED_USER,
        isEditable: !!note.fromUser && note.fromUser === loggedInUser,
      });
    });
  }

  return items;
}

@Component({
  selector: "app-timeline",
  templateUrl: "./timeline.html",
  standalone: true,
  imports: [CommonModule, RouterLink, IconButton],
})
export class Timeline {
  items = input.required<TimelineItem[]>();
  onDelete = output<TimelineItem>();
  onEdit = output<TimelineItem>();

  sortedItems = computed(() => {
    return this.items().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  isDeletedUser(doneBy: string | undefined): boolean {
    return doneBy === DELETED_USER;
  }

  onEditClick(item: TimelineItem) {
    this.onEdit.emit(item);
  }

  onDeleteClick(item: TimelineItem) {
    this.onDelete.emit(item);
  }
}
