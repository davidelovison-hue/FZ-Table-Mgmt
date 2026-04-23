import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GuestlistConfig, GuestlistWorkspaceService } from '../guestlist/guestlist-workspace.service';

@Component({
  selector: 'app-guestlist-config',
  standalone: true,
  imports: [],
  templateUrl: './guestlist-config.component.html',
  styleUrl: './guestlist-config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestlistConfigComponent {
  private readonly w = inject(GuestlistWorkspaceService);

  readonly guestlists = this.w.guestlists;
  readonly selectedId = this.w.selectedId;
  readonly persistMessage = this.w.persistMessage;
  readonly selectedGuestlist = this.w.selectedGuestlist;
  readonly prCatalog = this.w.prCatalog;
  readonly eventLabel = this.w.eventLabel;
  readonly listColorPresets = this.w.listColorPresets;
  readonly notificationLanguageOptions = this.w.notificationLanguageOptions;

  selectGuestlist(id: string): void {
    this.w.selectGuestlist(id);
  }

  addGuestlist(): void {
    this.w.addGuestlist();
  }

  removeGuestlist(id: string): void {
    this.w.removeGuestlist(id);
  }

  setName(value: string): void {
    this.w.setName(value);
  }

  setListColor(value: string): void {
    this.w.setListColor(value);
  }

  isPresetListColor(hex: string): boolean {
    return this.w.isPresetListColor(hex);
  }

  setDescription(value: string): void {
    this.w.setDescription(value);
  }

  setVisibility(value: string): void {
    this.w.setVisibility(value === 'public' ? 'public' : 'hidden');
  }

  setOpensAt(value: string): void {
    this.w.setOpensAt(value);
  }

  setDeadlineAt(value: string): void {
    this.w.setDeadlineAt(value);
  }

  setMaxCapacity(value: string): void {
    this.w.setMaxCapacity(value);
  }

  prAssignTriggerLabel(gl: GuestlistConfig): string {
    return this.w.prAssignTriggerLabel(gl);
  }

  prShortLabel(id: string): string {
    return this.w.prShortLabel(id);
  }

  togglePrAssignee(id: string, checked: boolean): void {
    this.w.togglePrAssignee(id, checked);
  }

  toggleInternalChannel(checked: boolean): void {
    this.w.toggleInternalChannel(checked);
  }

  toggleGuestEmailConfirmation(checked: boolean): void {
    this.w.toggleGuestEmailConfirmation(checked);
  }

  setNotificationLanguage(value: string): void {
    this.w.setNotificationLanguage(value);
  }

  toggleEnableRsvpRequests(checked: boolean): void {
    this.w.toggleEnableRsvpRequests(checked);
  }

  toggleAttendeeRequired(fieldId: string, required: boolean): void {
    this.w.toggleAttendeeRequired(fieldId, required);
  }

  updateCondition(partial: Parameters<GuestlistWorkspaceService['updateCondition']>[0]): void {
    this.w.updateCondition(partial);
  }

  saveConfiguration(): void {
    this.w.saveConfiguration();
  }

  coercePrice(value: unknown): number {
    return this.w.coercePrice(value);
  }

  coerceOptionalMinAge(value: unknown): number | null {
    return this.w.coerceOptionalMinAge(value);
  }

  setConditionGender(value: string): void {
    this.w.setConditionGender(value);
  }

  navEntryWindowSummary(g: GuestlistConfig): string {
    return this.w.navEntryWindowSummary(g);
  }

  navGenderSummary(g: GuestlistConfig): string {
    return this.w.navGenderSummary(g);
  }

  navMinAgeSummary(g: GuestlistConfig): string {
    return this.w.navMinAgeSummary(g);
  }

  navTotalCapacitySummary(g: GuestlistConfig): string {
    return this.w.navTotalCapacitySummary(g);
  }
}
