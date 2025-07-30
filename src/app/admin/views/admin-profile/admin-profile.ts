import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  computed,
  Signal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { FormControl, Validators } from "@angular/forms";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";
import { AdminService } from "src/app/admin/services/admin.service";
import {
  hasPermissionOverUser,
  isAdminOrSuperadmin,
  isPrivilegedRole,
} from "@shared/utils/role-permissions";
import { Subscription } from "rxjs";
import { AdminProfileUser } from "@models/admin-profile-user";
import {
  TimelineItem,
  transformUserToTimelineItem,
} from "@shared/components/timeline/timeline";
import { NotesService } from "../../services/notes.service";
import { v4 as uuidv4 } from "uuid";
import { Note } from "@models/note";

@Component({
  selector: "app-admin-profile",
  templateUrl: "./admin-profile.html",
  standalone: false,
})
export class AdminProfile implements OnInit, OnDestroy {
  isNotesFormOpen = signal(false);
  isBanModalOpen = signal(false);
  isBanIpModalOpen = signal(false);
  isMakeAdminModalOpen = signal(false);
  isMakeModeratorModalOpen = signal(false);
  isDeleteNoteModalOpen = signal(false);
  banReasonInput = new FormControl("", [Validators.required]);
  banIpReasonInput = new FormControl("", [Validators.required]);
  user = signal<AdminProfileUser | null>(null);
  userNotFound = signal(false);
  editingNoteText = signal<string>("");
  private currentNote = signal<Note | null>(null);
  private userSubscription!: Subscription;
  private username!: string;

  get loggedInUser() {
    return this.authStateService.user();
  }

  get timelineItems(): TimelineItem[] {
    const user = this.user();
    if (!user) {
      return [];
    }
    return transformUserToTimelineItem(user, this.loggedInUser?.username);
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService,
    private adminService: AdminService,
    private notesService: NotesService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.username = this.route.snapshot.params["username"];
    this.userSubscription = this.route.data.subscribe({
      next: (data) => {
        const user = data["user"] as AdminProfileUser | null;
        this.user.set(user);
        this.userNotFound.set(user === null);
      },
      error: (_) => this.userNotFound.set(true),
    });
  }

  onSwitchNotesForm() {
    this.currentNote.set(null);
    this.editingNoteText.set("");
    this.isNotesFormOpen.set(!this.isNotesFormOpen());
  }

  onOpenBanModal() {
    this.isBanModalOpen.set(true);
  }

  onOpenBanIpModal() {
    this.isBanIpModalOpen.set(true);
  }

  onOpenMakeAdminModal() {
    this.isMakeAdminModalOpen.set(true);
  }

  onOpenMakeModeratorModal() {
    this.isMakeModeratorModalOpen.set(true);
  }

  onOpenDeleteNoteModal() {
    this.isDeleteNoteModalOpen.set(true);
  }

  get isUserBanned(): boolean {
    return this.user()?.isBanned || false;
  }

  get isUserIpBanned(): boolean {
    return this.user()?.banType === "ip" || false;
  }

  onCancelModal() {
    this.isBanModalOpen.set(false);
    this.isBanIpModalOpen.set(false);
    this.isMakeAdminModalOpen.set(false);
    this.isMakeModeratorModalOpen.set(false);
    this.isDeleteNoteModalOpen.set(false);
  }

  hasPermissionOverUser(): boolean {
    const user = this.user();
    if (!this.loggedInUser || !user) {
      return false;
    }
    return hasPermissionOverUser({
      loggedInUserRole: this.loggedInUser.role,
      userRole: user.role,
    });
  }

  isLoggedInUserAdminOrSuperadmin(): boolean {
    if (!this.loggedInUser) {
      return false;
    }

    return isAdminOrSuperadmin(this.loggedInUser.role);
  }

  async onConfirmBanOrUnban() {
    if (this.isUserBanned) {
      await this.onConfirmUnban();
    } else {
      await this.onConfirmBan();
    }
  }

  private async onConfirmBan() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.adminService.banUser(
        user.username,
        this.banReasonInput.value,
        user.role
      );
      this.isBanModalOpen.set(false);
      this.snackbarService.show("Account banned successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to ban account", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private userActionWithoutPermission() {
    this.snackbarService.show(
      "You don't have permission to perform this action",
      "error"
    );
    this.onCancelModal();
  }

  private async onConfirmUnban() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    this.loadingService.setLoading(true);
    try {
      await this.adminService.unbanUser(user.username, user.role);
      this.onCancelModal();
      this.snackbarService.show(
        "Account unbanned successfully",
        "success",
        3000
      );
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to unban account", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async onConfirmIpBanOrUnban() {
    if (this.isUserIpBanned) {
      await this.onConfirmIpUnban();
    } else {
      await this.onConfirmIpBan();
    }
  }

  private async onConfirmIpBan() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.adminService.banIp(
        user.username,
        this.banIpReasonInput.value,
        user.role
      );
      this.isBanIpModalOpen.set(false);
      this.snackbarService.show("IP banned successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to ban IP", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private async onConfirmIpUnban() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.adminService.unbanIp(user.username, user.role);
      this.isBanIpModalOpen.set(false);
      this.snackbarService.show("IP unbanned successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to unban IP", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async onConfirmMakeOrRemoveAdmin() {
    if (this.user()?.role === "user") {
      await this.onConfirmMakeAdmin();
    } else {
      await this.onConfirmDemoteToUser();
    }
  }

  private async onConfirmMakeAdmin() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.adminService.updateRole(user.username, "admin");
      this.onCancelModal();
      this.snackbarService.show("Admin made successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to make admin", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private async onConfirmDemoteToUser() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.adminService.demoteToUser(user.username, user.role);
      this.onCancelModal();
      this.snackbarService.show(
        "User demoted to user successfully",
        "success",
        3000
      );
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to demote user", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async onConfirmMakeOrRemoveModerator() {
    if (this.user()?.role === "user") {
      await this.onConfirmMakeModerator();
    } else {
      await this.onConfirmDemoteToUser();
    }
  }

  private async onConfirmMakeModerator() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.adminService.updateRole(user.username, "moderator");
      this.onCancelModal();
      this.snackbarService.show("Moderator made successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      this.snackbarService.show("Failed to make moderator", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private async getUserProfile() {
    try {
      this.loadingService.setLoading(true);
      const user = await this.adminService.getAdminProfileUser(this.username);
      this.user.set(user);
    } catch (error) {
      this.snackbarService.show("Failed to get user profile", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async onDeleteTimelineItem(item: TimelineItem) {
    const note = this.getNoteFromTimelineItem(item);
    if (!note) {
      this.snackbarService.show("Note not found", "error");
      return;
    }

    if (!this.canWorkOnNote(note)) {
      this.userActionWithoutPermission();
      return;
    }

    this.currentNote.set(note);
    this.isDeleteNoteModalOpen.set(true);
  }

  private canWorkOnNote(note: Note): boolean {
    return !!note.fromUser && note.fromUser === this.loggedInUser?.username;
  }

  private getNoteFromTimelineItem(item: TimelineItem): Note | null {
    const user = this.user();
    return user?.notes?.find((note) => note.id === item.id) ?? null;
  }

  async onEditTimelineItem(item: TimelineItem) {
    const note = this.getNoteFromTimelineItem(item);
    if (!note) {
      this.snackbarService.show("Note not found", "error");
      return;
    }

    if (!this.canWorkOnNote(note)) {
      this.userActionWithoutPermission();
      return;
    }

    this.currentNote.set({
      id: item.id,
      forUser: item.username,
      fromUser: item.doneBy,
      note: item.text ?? "",
      createdAt: item.date,
    });
    this.editingNoteText.set(item.text ?? "");
    this.isNotesFormOpen.set(true);
  }

  async onSaveNote(note: string) {
    const user = this.user();
    const loggedInUser = this.loggedInUser;
    if (!user || !loggedInUser || !this.loggedInUserHasElevatedRole) {
      this.userActionWithoutPermission();
      return;
    }
    this.editingNoteText.set(note);
    const currentNote = this.currentNote();
    if (currentNote) {
      await this.updateNote({
        ...currentNote,
        note,
      });
    } else {
      await this.addNote({
        id: uuidv4(),
        forUser: user.username,
        fromUser: loggedInUser.username,
        note,
        createdAt: new Date(),
      });
    }
  }

  private async addNote(note: Note) {
    try {
      this.loadingService.setLoading(true);
      await this.notesService.addNote(note);
      this.afterSuccessfulNoteOperation();
      this.snackbarService.show("Note saved successfully", "success", 3000);
    } catch (error) {
      this.snackbarService.show("Failed to save note", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  private afterSuccessfulNoteOperation() {
    this.isDeleteNoteModalOpen.set(false);
    this.currentNote.set(null);
    this.editingNoteText.set("");
    this.getUserProfile();
  }

  private async updateNote(note: Note) {
    if (!this.canWorkOnNote(note)) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.notesService.updateNote(note);
      this.afterSuccessfulNoteOperation();
      this.snackbarService.show("Note updated successfully", "success", 3000);
    } catch (error) {
      this.snackbarService.show("Failed to update note", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async onConfirmDeleteNote() {
    const note = this.currentNote();
    if (!note) {
      this.snackbarService.show("Note not found", "error");
      return;
    }

    const user = this.user();
    const loggedInUser = this.loggedInUser;
    if (
      !user ||
      !loggedInUser ||
      !this.loggedInUserHasElevatedRole ||
      !this.canWorkOnNote(note)
    ) {
      this.userActionWithoutPermission();
      return;
    }

    try {
      this.loadingService.setLoading(true);
      await this.notesService.deleteNote(note.id, note.forUser);
      this.afterSuccessfulNoteOperation();
      this.snackbarService.show("Note deleted successfully", "success", 3000);
    } catch (error) {
      this.snackbarService.show("Failed to delete note", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  // UI stuff

  get shouldDisplayModeratorButton() {
    const user = this.user();
    return (
      !!user &&
      !isAdminOrSuperadmin(user.role) &&
      this.isLoggedInUserAdminOrSuperadmin()
    );
  }

  get shouldDisplayAdminButton() {
    const user = this.user();
    return (
      user?.role !== "superadmin" && this.loggedInUser?.role === "superadmin"
    );
  }

  get banButtonText() {
    return this.isUserBanned ? "Unban user" : "Ban user";
  }

  get banModalMessage() {
    return this.isUserBanned
      ? "Are you sure you want to unban this user?"
      : "Please enter the reason for banning the user.";
  }

  get banIpButtonText() {
    return this.isUserIpBanned ? "Unban IP" : "Ban IP";
  }

  get banIpModalMessage() {
    return this.isUserIpBanned
      ? "Are you sure you want to unban this IP?"
      : "Please enter the reason for banning the IP.";
  }

  get adminButtonText() {
    return this.user()?.role === "user" ? "Make admin" : "Remove admin";
  }

  get adminModalMessage() {
    return this.user()?.role === "user"
      ? "Are you sure you want to make this user an admin?"
      : "Are you sure you want to remove this user as an admin?";
  }

  get adminIcon() {
    return this.user()?.role === "user" ? "shield_person" : "remove_moderator";
  }

  get moderatorButtonText() {
    return this.user()?.role === "user" ? "Make moderator" : "Remove moderator";
  }

  get moderatorModalMessage() {
    return this.user()?.role === "user"
      ? "Are you sure you want to make this user a moderator?"
      : "Are you sure you want to remove this user as a moderator?";
  }

  get moderatorIcon() {
    return this.user()?.role === "user" ? "add_moderator" : "remove_moderator";
  }

  get isConfirmBanButtonDisabled(): boolean {
    return this.banReasonInput.invalid || this.banReasonInput.pristine;
  }

  get isConfirmIpBanButtonDisabled(): boolean {
    return this.banIpReasonInput.invalid || this.banIpReasonInput.pristine;
  }

  get loggedInUserHasElevatedRole(): boolean {
    return !!this.loggedInUser && isPrivilegedRole(this.loggedInUser.role);
  }

  get noteText(): string {
    return this.editingNoteText();
  }
  set noteText(text: string) {
    this.editingNoteText.set(text);
  }

  countryCodeToEmoji(countryCode: string): string {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }

  hasBadge(): boolean {
    const user = this.user();
    return (
      !!user &&
      (user.role === "superadmin" ||
        user.role === "admin" ||
        user.role === "moderator" ||
        user.isBanned ||
        user.isInactive)
    );
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
}
