import type { Conversation, Vehicle, MaintenanceStatus } from '@/types/domain';

export interface MaintenanceReminder {
  vehicleId: string;
  stock: string;
  label: string;
  status: MaintenanceStatus;
  reasons: string[];
  dueDate?: string;
  dueMileage?: number;
}

export interface OutboundEligibilityInput {
  conversation?: Conversation | null;
  reminder?: MaintenanceReminder | null;
}

export interface OutboundEligibilityResult {
  allowed: boolean;
  reason: string;
  dryRun: true;
}

function parseMileage(mileage?: string): number | undefined {
  if (!mileage) return undefined;
  const parsed = Number(mileage.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function daysUntil(now: Date, iso?: string): number | undefined {
  if (!iso) return undefined;
  const due = new Date(iso).getTime();
  if (!Number.isFinite(due)) return undefined;
  return Math.ceil((due - now.getTime()) / 86_400_000);
}

export function getMaintenanceStatus(vehicle: Vehicle, now: Date = new Date()): MaintenanceStatus {
  const dateDelta = daysUntil(now, vehicle.nextServiceDueDate);
  const currentMileage = parseMileage(vehicle.mileage);
  const mileageDelta = vehicle.nextServiceDueMileage !== undefined && currentMileage !== undefined
    ? vehicle.nextServiceDueMileage - currentMileage
    : undefined;

  if ((dateDelta !== undefined && dateDelta < 0) || (mileageDelta !== undefined && mileageDelta <= 0)) return 'overdue';
  if ((dateDelta !== undefined && dateDelta <= 14) || (mileageDelta !== undefined && mileageDelta <= 500)) return 'due_soon';
  return vehicle.maintenanceStatus ?? 'ok';
}

export function getMaintenanceReminders(vehicles: Vehicle[], now: Date = new Date()): MaintenanceReminder[] {
  return vehicles
    .map(vehicle => {
      const status = getMaintenanceStatus(vehicle, now);
      const reasons: string[] = [];
      const dateDelta = daysUntil(now, vehicle.nextServiceDueDate);
      const currentMileage = parseMileage(vehicle.mileage);
      const mileageDelta = vehicle.nextServiceDueMileage !== undefined && currentMileage !== undefined
        ? vehicle.nextServiceDueMileage - currentMileage
        : undefined;

      if (dateDelta !== undefined) reasons.push(dateDelta < 0 ? `${Math.abs(dateDelta)} days overdue` : `due in ${dateDelta} days`);
      if (mileageDelta !== undefined) reasons.push(mileageDelta <= 0 ? `${Math.abs(mileageDelta)} miles overdue` : `${mileageDelta} miles remaining`);

      return {
        vehicleId: vehicle.id,
        stock: vehicle.stock,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        status,
        reasons: reasons.length ? reasons : ['no service threshold configured'],
        dueDate: vehicle.nextServiceDueDate,
        dueMileage: vehicle.nextServiceDueMileage,
      } satisfies MaintenanceReminder;
    })
    .filter(reminder => reminder.status !== 'ok');
}

export function evaluateOutboundEligibility(input: OutboundEligibilityInput): OutboundEligibilityResult {
  const conversation = input.conversation;
  if (!conversation) return { allowed: false, reason: 'No conversation available for outbound reminder.', dryRun: true };
  if (conversation.optedOut || conversation.suppressionActive) return { allowed: false, reason: 'Blocked by opt-out or suppression.', dryRun: true };
  if (conversation.restricted || conversation.status === 'restricted') return { allowed: false, reason: 'Blocked because conversation is restricted.', dryRun: true };
  if (!conversation.aiDisclosureSent) return { allowed: false, reason: 'Blocked until AI disclosure is sent.', dryRun: true };
  if (!input.reminder || input.reminder.status === 'ok') return { allowed: false, reason: 'No due maintenance reminder.', dryRun: true };
  return { allowed: true, reason: 'Eligible for local dry-run maintenance reminder.', dryRun: true };
}
