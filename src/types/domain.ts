// ─── Enums ──────────────────────────────────────────────────────────────────

export type Channel = 'phone' | 'sms' | 'web' | 'facebook' | 'instagram' | 'email';

export type LeadStage =
  | 'new'
  | 'first_contact'
  | 'vehicle_interest'
  | 'quote_sent'
  | 'appointment_set'
  | 'finance_intake'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'stale';

export type LeadPriority = 'hot' | 'warm' | 'new' | 'cold';

export type LeadSource =
  | 'google_ads'
  | 'facebook'
  | 'instagram'
  | 'website'
  | 'walk_in'
  | 'referral'
  | 'phone'
  | 'email'
  | 'other';

export type ConversationStatus = 'active' | 'pending' | 'idle' | 'closed' | 'escalated';

export type MessageRole = 'customer' | 'agent' | 'system' | 'manager';

export type Sentiment = 'positive' | 'neutral' | 'frustrated' | 'angry' | 'unknown';

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'revised';

export type FinanceStatus = 'pending_consent' | 'in_progress' | 'ready' | 'submitted' | 'approved' | 'declined' | 'incomplete';

export type RoutingStatus = 'not_started' | 'pending' | 'submitted' | 'accepted' | 'rejected' | 'error';

export type IntegrationStatus = 'connected' | 'disconnected' | 'pending' | 'error' | 'degraded';

export type SyncStatus = 'synced' | 'pending' | 'error' | 'not_synced' | 'stale';

export type EscalationReason =
  | 'customer_request'
  | 'objection_detected'
  | 'sentiment_negative'
  | 'complex_negotiation'
  | 'finance_question'
  | 'compliance_flag'
  | 'ai_low_confidence';

export type AuditAction =
  | 'consent_captured'
  | 'disclosure_sent'
  | 'quote_sent'
  | 'finance_submitted'
  | 'handoff_initiated'
  | 'handoff_completed'
  | 'message_sent'
  | 'call_started'
  | 'call_ended'
  | 'appointment_booked'
  | 'document_received'
  | 'packet_routed'
  | 'opt_out_recorded'
  | 'manager_override'
  | 'stage_updated'
  | 'sentiment_changed';

// ─── Domain Models ──────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  priority: LeadPriority;
  assignedTo: string;
  crmSyncStatus: SyncStatus;
  isDuplicate: boolean;
  firstContactAt: string;
  lastActivityAt: string;
  nextFollowUp?: string;
  followUpOverdue: boolean;
  notes?: string;
  tags: string[];
  vehicleInterests: string[];
  conversationIds: string[];
}

export interface Conversation {
  id: string;
  leadId: string;
  channel: Channel;
  status: ConversationStatus;
  sentiment: Sentiment;
  currentHandler: 'ai' | 'human';
  handlerName: string;
  aiDisclosureSent: boolean;
  suppressionActive: boolean;
  optedOut: boolean;
  dealStage: LeadStage;
  objectionCount: number;
  escalationFlag: boolean;
  escalationReason?: EscalationReason;
  startedAt: string;
  lastMessageAt: string;
  duration?: string;
  unreadCount: number;
  customerName: string;
  customerPhone?: string;
  summary?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  channel: Channel;
  delivered: boolean;
  read: boolean;
  aiGenerated: boolean;
  requiresApproval: boolean;
  approved?: boolean;
}

export interface CallSession {
  id: string;
  conversationId: string;
  leadId: string;
  direction: 'inbound' | 'outbound';
  status: 'ringing' | 'active' | 'on_hold' | 'ended';
  startedAt: string;
  endedAt?: string;
  duration?: string;
  recordingUrl?: string;
  transcriptAvailable: boolean;
}

export interface Transcript {
  id: string;
  callSessionId: string;
  entries: { speaker: 'customer' | 'agent'; text: string; timestamp: string }[];
  summary?: string;
  keyTopics: string[];
  objectionsDetected: string[];
  nextActions: string[];
}

export interface CustomerProfile {
  id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  dateOfBirth?: string;
  driversLicenseNumber?: string;
  employerName?: string;
  employerPhone?: string;
  annualIncome?: number;
  monthlyHousingPayment?: number;
}

export interface Vehicle {
  id: string;
  stock: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body: string;
  exteriorColor?: string;
  interiorColor?: string;
  mileage: string;
  price: number;
  msrp?: number;
  status: 'available' | 'hold' | 'sold' | 'incoming' | 'in_transit';
  photoUrl?: string;
  features: string[];
  inventorySource: 'vauto' | 'manual' | 'feed';
  daysOnLot?: number;
  estimatedPayment?: number;
}

export interface VehicleMatch {
  id: string;
  leadId: string;
  vehicleId: string;
  matchScore: number;
  reason: string;
  presented: boolean;
  customerReaction?: 'interested' | 'not_interested' | 'considering';
}

export interface Quote {
  id: string;
  quoteNumber: string;
  leadId: string;
  conversationId?: string;
  vehicleIds: string[];
  status: QuoteStatus;
  scenarios: QuoteScenario[];
  revision: number;
  disclosureIncluded: boolean;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  expiresAt?: string;
}

export interface QuoteScenario {
  id: string;
  quoteId: string;
  label: string;
  vehicleId: string;
  vehicleSummary: string;
  sellingPrice: number;
  downPayment: number;
  tradeInValue: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  totalCost: number;
  biweeklyPayment?: number;
  taxes: number;
  fees: number;
}

export interface QuoteRevision {
  id: string;
  quoteId: string;
  revision: number;
  changedFields: string[];
  changedBy: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  leadId: string;
  conversationId?: string;
  type: 'test_drive' | 'consultation' | 'delivery' | 'finance_signing';
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  assignedTo: string;
  notes?: string;
  reminderSent: boolean;
}

export interface FinanceApplicant {
  id: string;
  leadId: string;
  profile: CustomerProfile;
  employmentStatus: 'employed' | 'self_employed' | 'retired' | 'student' | 'other';
  yearsAtEmployer?: number;
  creditScoreRange?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export interface CoApplicant {
  id: string;
  financeApplicantId: string;
  profile: CustomerProfile;
  relationship: string;
}

export interface ConsentRecord {
  id: string;
  leadId: string;
  type: 'credit_check' | 'data_sharing' | 'electronic_signature' | 'marketing';
  granted: boolean;
  grantedAt?: string;
  ipAddress?: string;
  method: 'electronic' | 'verbal' | 'written';
}

export interface DisclosureRecord {
  id: string;
  leadId: string;
  type: 'ai_disclosure' | 'privacy_policy' | 'credit_inquiry' | 'rate_disclaimer' | 'fee_schedule';
  sentAt: string;
  acknowledgedAt?: string;
  channel: Channel;
}

export interface SupportingDocument {
  id: string;
  financeApplicantId: string;
  type: 'drivers_license' | 'proof_of_income' | 'proof_of_residence' | 'insurance' | 'credit_application' | 'void_cheque' | 'other';
  label: string;
  status: 'received' | 'missing' | 'pending' | 'rejected';
  uploadedAt?: string;
  fileUrl?: string;
}

export interface FinancePacket {
  id: string;
  leadId: string;
  applicantId: string;
  coApplicantId?: string;
  quoteId: string;
  vehicleId: string;
  status: FinanceStatus;
  consentRecords: ConsentRecord[];
  disclosureRecords: DisclosureRecord[];
  documents: SupportingDocument[];
  completionPercentage: number;
  blockers: string[];
  routingStatus: RoutingStatus;
  routingTarget?: string;
  routedAt?: string;
  responseReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoutingJob {
  id: string;
  financePacketId: string;
  target: 'dealertrack' | 'pbs' | 'autovance' | 'manual';
  status: RoutingStatus;
  submittedAt?: string;
  responseAt?: string;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: string;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  provider: string;
  category: 'channel' | 'crm' | 'dms' | 'inventory' | 'ai' | 'calendar' | 'email' | 'webhook';
  status: IntegrationStatus;
  credentials: Record<string, string>;
  lastSyncAt?: string;
  syncStatus: SyncStatus;
  errorMessage?: string;
  healthCheckUrl?: string;
  webhookUrl?: string;
}

export interface AuditEvent {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedAt: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface ManagerReview {
  id: string;
  conversationId: string;
  reviewerId: string;
  reviewerName: string;
  status: 'pending' | 'approved' | 'flagged' | 'overridden';
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Escalation {
  id: string;
  conversationId: string;
  leadId: string;
  reason: EscalationReason;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'resolved' | 'dismissed';
  assignedTo?: string;
  customerName: string;
  channel: Channel;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  conversationId?: string;
  type: 'follow_up' | 'callback' | 'quote_follow_up' | 'appointment_reminder' | 'reactivation' | 'document_request';
  status: 'scheduled' | 'due' | 'overdue' | 'completed' | 'cancelled' | 'suppressed';
  scheduledFor: string;
  completedAt?: string;
  channel: Channel;
  message?: string;
  assignedTo: string;
  priority: LeadPriority;
  customerName: string;
}
