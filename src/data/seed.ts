import type { Lead, Conversation, Message, Vehicle, Quote, FollowUpTask, FinancePacket, Appointment, AuditEvent, Escalation } from '@/types/domain';

// ─── Dynamic Timestamp Helpers ──────────────────────────────────────────────
// All timestamps are computed relative to NOW so the demo always looks fresh.

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

function fromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60000).toISOString();
}

// ─── Leads ──────────────────────────────────────────────────────────────────
export const demoLeads: Lead[] = [
  { id: 'lead-1', name: 'Sarah Mitchell', email: 'sarah.m@email.com', phone: '(416) 234-8901', source: 'google_ads', stage: 'quote_sent', priority: 'hot', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: ago(45), lastActivityAt: ago(8), nextFollowUp: fromNow(60), followUpOverdue: false, notes: 'Looking for family SUV under $40K', tags: ['suv', 'family'], vehicleInterests: ['RAV4 XLE', 'CR-V EX'], conversationIds: ['conv-1'] },
  { id: 'lead-2', name: 'James Cooper', email: 'jcooper@work.ca', phone: '(905) 876-5432', source: 'website', stage: 'first_contact', priority: 'warm', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: ago(55), lastActivityAt: ago(15), nextFollowUp: fromNow(120), followUpOverdue: false, notes: 'Trade-in inquiry for 2019 Civic', tags: ['trade-in'], vehicleInterests: ['F-150 XLT'], conversationIds: ['conv-2'] },
  { id: 'lead-3', name: 'Maria Santos', email: 'maria.santos@gmail.com', phone: '(647) 345-6789', source: 'facebook', stage: 'vehicle_interest', priority: 'new', assignedTo: 'Unassigned', crmSyncStatus: 'pending', isDuplicate: false, firstContactAt: ago(30), lastActivityAt: ago(20), nextFollowUp: fromNow(300), followUpOverdue: false, notes: 'Interested in pre-approval', tags: ['finance'], vehicleInterests: ['Equinox LT'], conversationIds: ['conv-3'] },
  { id: 'lead-4', name: 'David Chen', phone: '(416) 901-2345', source: 'instagram', stage: 'first_contact', priority: 'warm', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: ago(50), lastActivityAt: ago(25), nextFollowUp: fromNow(240), followUpOverdue: false, tags: ['truck'], vehicleInterests: ['F-150', 'Sierra'], conversationIds: ['conv-4'] },
  { id: 'lead-5', name: 'Lisa Park', email: 'lisa.p@outlook.com', phone: '(905) 567-8901', source: 'facebook', stage: 'appointment_set', priority: 'hot', assignedTo: 'Mike R.', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: ago(1440), lastActivityAt: ago(180), nextFollowUp: ago(30), followUpOverdue: true, tags: ['appointment'], vehicleInterests: ['Tucson SEL'], conversationIds: ['conv-5'] },
  { id: 'lead-6', name: 'Tom Bradley', phone: '(647) 234-5678', source: 'walk_in', stage: 'stale', priority: 'cold', assignedTo: 'Unassigned', crmSyncStatus: 'not_synced', isDuplicate: true, firstContactAt: ago(4320), lastActivityAt: ago(2880), nextFollowUp: ago(1440), followUpOverdue: true, tags: ['stale'], vehicleInterests: ['Camry'], conversationIds: [] },
  { id: 'lead-7', name: 'Jennifer Wu', email: 'jwu@company.ca', phone: '(416) 432-1098', source: 'google_ads', stage: 'finance_intake', priority: 'hot', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: ago(1500), lastActivityAt: ago(60), nextFollowUp: fromNow(30), followUpOverdue: false, tags: ['finance', 'suv'], vehicleInterests: ['Equinox LT'], conversationIds: ['conv-6'] },
  { id: 'lead-8', name: 'Amanda Torres', email: 'atorres@email.com', phone: '(905) 789-0123', source: 'phone', stage: 'negotiation', priority: 'hot', assignedTo: 'AI Agent', crmSyncStatus: 'synced', isDuplicate: false, firstContactAt: ago(120), lastActivityAt: ago(5), nextFollowUp: fromNow(45), followUpOverdue: false, tags: ['objection', 'negotiation'], vehicleInterests: ['RAV4 XLE'], conversationIds: ['conv-7'] },
];

// ─── Vehicles ───────────────────────────────────────────────────────────────
export const demoVehicles: Vehicle[] = [
  { id: 'veh-1', stock: 'T-4892', vin: '2T1BURHE0JC001234', year: 2024, make: 'Toyota', model: 'RAV4', trim: 'XLE AWD', body: 'SUV', exteriorColor: 'Lunar Rock', interiorColor: 'Black', mileage: 'New', price: 38450, msrp: 39999, status: 'available', features: ['Apple CarPlay', 'Heated Seats', 'Blind Spot Monitor', 'Dual Zone Climate', 'Toyota Safety Sense 2.5+'], inventorySource: 'vauto', daysOnLot: 12, estimatedPayment: 489 },
  { id: 'veh-2', stock: 'H-3201', vin: '5J6RW2H89NL005678', year: 2023, make: 'Honda', model: 'CR-V', trim: 'EX-L', body: 'SUV', exteriorColor: 'Crystal Black Pearl', interiorColor: 'Ivory', mileage: '12,400 km', price: 35900, status: 'available', features: ['Leather Interior', 'Sunroof', 'Honda Sensing', 'Power Liftgate', 'Wireless Charging'], inventorySource: 'vauto', daysOnLot: 8, estimatedPayment: 435 },
  { id: 'veh-3', stock: 'HY-1055', year: 2024, make: 'Hyundai', model: 'Tucson', trim: 'Preferred AWD', body: 'SUV', exteriorColor: 'Amazon Grey', mileage: 'New', price: 34500, msrp: 35999, status: 'available', features: ['SmartSense Safety', 'Wireless Charging', 'Heated Steering Wheel', 'LED Headlamps'], inventorySource: 'vauto', daysOnLot: 15, estimatedPayment: 455 },
  { id: 'veh-4', stock: 'F-7834', vin: '1FTFW1E58NF009012', year: 2023, make: 'Ford', model: 'F-150', trim: 'XLT SuperCrew', body: 'Truck', exteriorColor: 'Oxford White', mileage: '8,200 km', price: 49900, status: 'available', features: ['Pro Trailer Backup', 'SYNC 4', 'Tow Package', 'Bed Liner', 'Running Boards'], inventorySource: 'manual', daysOnLot: 22, estimatedPayment: 649 },
  { id: 'veh-5', stock: 'C-2190', year: 2024, make: 'Chevrolet', model: 'Equinox', trim: 'LT AWD', body: 'SUV', exteriorColor: 'Sterling Grey', mileage: 'New', price: 32500, msrp: 33999, status: 'available', features: ['Chevy Safety Assist', 'Infotainment 3', 'Remote Start', 'Heated Seats'], inventorySource: 'vauto', daysOnLot: 10, estimatedPayment: 415 },
  { id: 'veh-6', stock: 'T-5120', year: 2024, make: 'Toyota', model: 'Camry', trim: 'SE', body: 'Sedan', exteriorColor: 'Midnight Black', mileage: 'New', price: 33200, msrp: 34500, status: 'available', features: ['Dynamic Force Engine', 'Toyota Safety Sense', 'Sport Suspension', 'Dual Exhaust'], inventorySource: 'vauto', daysOnLot: 18, estimatedPayment: 425 },
  { id: 'veh-7', stock: 'N-8842', year: 2023, make: 'Nissan', model: 'Rogue', trim: 'SV Premium', body: 'SUV', exteriorColor: 'Champagne Silver', mileage: '19,800 km', price: 31200, status: 'available', features: ['ProPILOT Assist', 'Panoramic Sunroof', 'Quilted Leather', 'Bose Audio'], inventorySource: 'feed', daysOnLot: 30, estimatedPayment: 399 },
  { id: 'veh-8', stock: 'K-6631', year: 2024, make: 'Kia', model: 'Sportage', trim: 'X-Line AWD', body: 'SUV', exteriorColor: 'Dawning Red', mileage: 'New', price: 40900, msrp: 42500, status: 'hold', features: ['Dual Panoramic Display', 'Highway Driving Assist 2', 'Harman Kardon Audio', 'Digital Key 2.0'], inventorySource: 'vauto', daysOnLot: 5, estimatedPayment: 529 },
  { id: 'veh-9', stock: 'J-1029', vin: '1C4HJXEN4PW001234', year: 2024, make: 'Jeep', model: 'Wrangler', trim: 'Rubicon', body: 'SUV', exteriorColor: 'Firecracker Red', mileage: 'New', price: 62500, msrp: 65000, status: 'available', features: ['4x4', 'Hardtop', 'Off-Road Tires', 'Winch'], inventorySource: 'vauto', daysOnLot: 3, estimatedPayment: 899 },
  { id: 'veh-10', stock: 'M-5532', vin: '1FATP8FF0N5123456', year: 2023, make: 'Ford', model: 'Mustang', trim: 'GT Premium', body: 'Coupe', exteriorColor: 'Rapid Red', mileage: '15,000 km', price: 48900, status: 'available', features: ['V8 Engine', 'Leather Seats', 'B&O Sound System'], inventorySource: 'manual', daysOnLot: 45, estimatedPayment: 750 },
  { id: 'veh-11', stock: 'T-8821', vin: '5YJ3E1EA5NF123456', year: 2023, make: 'Tesla', model: 'Model 3', trim: 'Long Range', body: 'Sedan', exteriorColor: 'Pearl White', mileage: '22,000 km', price: 42000, status: 'available', features: ['Autopilot', 'Premium Interior', 'Long Range Battery'], inventorySource: 'vauto', daysOnLot: 12, estimatedPayment: 620 },
  { id: 'veh-12', stock: 'C-9912', vin: '1G1YB2D47P5123456', year: 2024, make: 'Chevrolet', model: 'Corvette', trim: 'Stingray 2LT', body: 'Coupe', exteriorColor: 'Torch Red', mileage: 'New', price: 89900, msrp: 92000, status: 'available', features: ['Z51 Performance Package', 'GT2 Bucket Seats', 'Performance Exhaust'], inventorySource: 'vauto', daysOnLot: 2, estimatedPayment: 1250 },
];

// ─── Messages ───────────────────────────────────────────────────────────────
const mkMsg = (id: string, convId: string, role: 'customer' | 'agent' | 'system', content: string, minutesAgo: number, ai = role === 'agent'): Message => ({
  id, conversationId: convId, role, content, timestamp: ago(minutesAgo), channel: 'phone', delivered: true, read: true, aiGenerated: ai, requiresApproval: false,
});

export const demoMessages: Record<string, Message[]> = {
  'conv-1': [
    mkMsg('m1-1', 'conv-1', 'customer', "Hi, I'm looking for a reliable SUV for my family. Budget is around $40,000.", 45),
    mkMsg('m1-2', 'conv-1', 'agent', "Welcome to Door Step Auto! I'd love to help you find the perfect family SUV. With a $40K budget, I have several great options. Do you have a preference for new or pre-owned?", 44),
    mkMsg('m1-3', 'conv-1', 'customer', "I'm open to either. What do you recommend?", 42),
    mkMsg('m1-4', 'conv-1', 'agent', "Based on your budget, I'd recommend the 2024 Toyota RAV4 XLE AWD at $38,450 — it's our best seller for families. I also have a 2023 Honda CR-V EX-L with only 12,400 km at $35,900. Both have excellent safety ratings. Would you like a detailed comparison quote?", 40),
    mkMsg('m1-5', 'conv-1', 'customer', "Yes, please send me a comparison. The RAV4 sounds interesting.", 38),
    mkMsg('m1-6', 'conv-1', 'agent', "I'm building your comparison quote now with monthly payment scenarios. I'll include both 60 and 72-month terms at current rates. Do you have a trade-in vehicle, or will this be a straight purchase?", 35),
    mkMsg('m1-7', 'conv-1', 'customer', "I have a 2019 Corolla with about 68,000 km on it.", 32),
    mkMsg('m1-8', 'conv-1', 'agent', "A 2019 Corolla in good condition with that mileage typically values between $14,000–$16,000 on trade. I'll factor that into your quote scenarios. Give me just a moment to prepare everything.", 30),
  ],
  'conv-2': [
    mkMsg('m2-1', 'conv-2', 'customer', "What's the trade-in value for a 2019 Civic?", 20),
    mkMsg('m2-2', 'conv-2', 'agent', "Great question! To give you the most accurate trade-in value, could you share the trim level, approximate mileage, and overall condition? A 2019 Civic generally ranges from $15,000 to $19,000 depending on those factors.", 19),
    mkMsg('m2-3', 'conv-2', 'customer', "It's the EX trim, about 52,000 km, no accidents, good condition.", 17),
    mkMsg('m2-4', 'conv-2', 'agent', "Excellent — a clean 2019 Civic EX with 52K km and no accidents is a strong trade. I'd estimate $17,000–$18,500 for you. Are you looking to put that toward a new vehicle? I noticed we have some great trucks and SUVs in stock right now.", 15),
  ],
  'conv-3': [
    mkMsg('m3-1', 'conv-3', 'customer', "Can I get pre-approved for financing online?", 30),
    mkMsg('m3-2', 'conv-3', 'agent', "Absolutely! We work with multiple lenders to find the best rates available. I can start a quick pre-qualification — it's a soft inquiry that won't affect your credit score. Before we begin, I should let you know that I'm an AI assistant here at Door Step Auto. Would you like to proceed with a human representative, or are you comfortable continuing with me?", 28),
    mkMsg('m3-3', 'conv-3', 'customer', "AI is fine. What do you need from me?", 25),
    mkMsg('m3-4', 'conv-3', 'agent', "Thank you! To get started, I'll need some basic information. First, do you have a specific vehicle in mind, or would you like to explore options first? Also, what's your ideal monthly payment range?", 23),
  ],
  'conv-4': [
    mkMsg('m4-1', 'conv-4', 'customer', "Is that F-150 still available? The white one you posted.", 25),
    mkMsg('m4-2', 'conv-4', 'agent', "Yes! The 2023 Ford F-150 XLT SuperCrew in Oxford White (Stock #F-7834) is available. It has only 8,200 km and comes with the Pro Trailer Backup Assist, SYNC 4, and full tow package. Priced at $49,900. Would you like more details or photos?", 24),
    mkMsg('m4-3', 'conv-4', 'customer', "That price seems high. What can you do on it?", 22),
    mkMsg('m4-4', 'conv-4', 'agent', "I understand your concern about the price. This truck is competitively priced for the market — comparable F-150 XLTs with similar mileage are listing between $48,000–$53,000 in the GTA. I can put together a payment breakdown that might make it more comfortable. Would you also have a trade-in?", 20),
  ],
  'conv-5': [
    mkMsg('m5-1', 'conv-5', 'customer', "Thanks for the quote on the Tucson! When can I come see it?", 200),
    mkMsg('m5-2', 'conv-5', 'agent', "You're welcome! The 2024 Tucson Preferred AWD is a fantastic choice. I have availability for a test drive today at 2:00 PM, 3:30 PM, or tomorrow morning. Which works best for you?", 198),
    mkMsg('m5-3', 'conv-5', 'customer', "Tomorrow at 10 AM works for me.", 195),
    mkMsg('m5-4', 'conv-5', 'agent', "You're all set for tomorrow at 10:00 AM. I'll have the Tucson ready and waiting. Ask for Mike when you arrive — he'll be your specialist. I'll send you a confirmation with our address and directions. See you tomorrow!", 193),
  ],
  'conv-6': [
    mkMsg('m6-1', 'conv-6', 'customer', "I accepted the quote on the Equinox. What's next for financing?", 90),
    mkMsg('m6-2', 'conv-6', 'agent', "Excellent news! I'm thrilled you chose the Equinox LT. To move forward with financing, I'll need to collect some information. First, I want to let you know that all information is encrypted and securely handled. I'll need your consent to proceed with a credit application. Shall I send you the secure consent form?", 88),
    mkMsg('m6-3', 'conv-6', 'customer', "Yes, go ahead.", 85),
    mkMsg('m6-4', 'conv-6', 'system', "Consent form sent to customer via secure link.", 84),
    mkMsg('m6-5', 'conv-6', 'agent', "I've sent a secure consent form to your email. Once you sign that, I'll guide you through the rest of the application. We typically get preliminary responses within a few hours of submitting to our lending partners.", 83),
  ],
  'conv-7': [
    mkMsg('m7-1', 'conv-7', 'customer', "I want the RAV4 but the payment is too high. I can only do $400 a month.", 12),
    mkMsg('m7-2', 'conv-7', 'agent', "I hear you — monthly payment is one of the most important factors. Let me see what I can do. With a slightly longer term of 84 months or a larger down payment, we can definitely get closer to $400. Another option is our 2023 Honda CR-V EX-L at $35,900 which comes in around $435/month on a 72-month term.", 10),
    mkMsg('m7-3', 'conv-7', 'customer', "84 months is too long. I don't want to be underwater on the loan.", 8),
    mkMsg('m7-4', 'conv-7', 'agent', "That's very smart thinking. How about this — if you could put $5,000 down, the RAV4 XLE comes to about $425/month on a 72-month term. Or I have a 2024 Hyundai Tucson Preferred at $34,500 which would be around $399/month with zero down on 72 months. Would either of those work?", 6),
    mkMsg('m7-5', 'conv-7', 'customer', "I need to think about it. Can you call me back tomorrow?", 5),
    { id: 'm7-6', conversationId: 'conv-7', role: 'agent', content: "Of course! I'll call you tomorrow around 10 AM. In the meantime, I'll put together a detailed comparison with all three options so you have everything in front of you. No pressure at all — this is an important decision and I want you to feel great about it.", timestamp: ago(4), channel: 'phone', delivered: true, read: true, aiGenerated: true, requiresApproval: true, approved: undefined },
  ],
};

// ─── Conversations ──────────────────────────────────────────────────────────
export const demoConversations: Conversation[] = [
  { id: 'conv-1', leadId: 'lead-1', channel: 'phone', status: 'active', sentiment: 'positive', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'quote_sent', objectionCount: 0, escalationFlag: false, startedAt: ago(45), lastMessageAt: ago(30), duration: '8:32', unreadCount: 2, customerName: 'Sarah Mitchell', customerPhone: '(416) 234-8901', summary: 'Customer seeking family SUV under $40K. Comparing RAV4 XLE and CR-V EX-L. Has 2019 Corolla trade-in. Quote being prepared.', messages: [] },
  { id: 'conv-2', leadId: 'lead-2', channel: 'sms', status: 'active', sentiment: 'neutral', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: false, suppressionActive: false, optedOut: false, dealStage: 'first_contact', objectionCount: 0, escalationFlag: false, startedAt: ago(20), lastMessageAt: ago(15), duration: '3:15', unreadCount: 1, customerName: 'James Cooper', customerPhone: '(905) 876-5432', summary: 'Trade-in inquiry for 2019 Civic EX. Estimated $17-18.5K value. Exploring truck options.', messages: [] },
  { id: 'conv-3', leadId: 'lead-3', channel: 'web', status: 'active', sentiment: 'neutral', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'vehicle_interest', objectionCount: 0, escalationFlag: false, startedAt: ago(30), lastMessageAt: ago(23), duration: '4:22', unreadCount: 0, customerName: 'Maria Santos', customerPhone: '(647) 345-6789', summary: 'Pre-approval inquiry. AI disclosure made. Beginning qualification.', messages: [] },
  { id: 'conv-4', leadId: 'lead-4', channel: 'instagram', status: 'active', sentiment: 'neutral', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: false, suppressionActive: false, optedOut: false, dealStage: 'first_contact', objectionCount: 1, escalationFlag: false, startedAt: ago(25), lastMessageAt: ago(20), duration: '1:45', unreadCount: 0, customerName: 'David Chen', customerPhone: '(416) 901-2345', summary: 'Inquiring about F-150 XLT. Price objection raised. Offered trade-in exploration.', messages: [] },
  { id: 'conv-5', leadId: 'lead-5', channel: 'facebook', status: 'idle', sentiment: 'positive', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'appointment_set', objectionCount: 0, escalationFlag: false, startedAt: ago(200), lastMessageAt: ago(193), duration: '2:10', unreadCount: 0, customerName: 'Lisa Park', customerPhone: '(905) 567-8901', summary: 'Test drive booked for tomorrow at 10AM for Tucson Preferred. Assigned to Mike R.', messages: [] },
  { id: 'conv-6', leadId: 'lead-7', channel: 'web', status: 'pending', sentiment: 'positive', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'finance_intake', objectionCount: 0, escalationFlag: false, startedAt: ago(90), lastMessageAt: ago(83), duration: '5:45', unreadCount: 0, customerName: 'Jennifer Wu', customerPhone: '(416) 432-1098', summary: 'Accepted Equinox LT quote. Finance consent form sent. Awaiting signature.', messages: [] },
  { id: 'conv-7', leadId: 'lead-8', channel: 'phone', status: 'escalated', sentiment: 'frustrated', currentHandler: 'ai', handlerName: 'AI Agent', aiDisclosureSent: true, suppressionActive: false, optedOut: false, dealStage: 'negotiation', objectionCount: 2, escalationFlag: true, escalationReason: 'objection_detected', startedAt: ago(12), lastMessageAt: ago(4), duration: '12:08', unreadCount: 1, customerName: 'Amanda Torres', customerPhone: '(905) 789-0123', summary: 'Price objection on RAV4. Customer wants $400/mo max. Offered alternatives. Callback requested for tomorrow. Pending manager approval on follow-up message.', messages: [] },
];

// ─── Quotes ─────────────────────────────────────────────────────────────────
export const demoQuotes: Quote[] = [
  { id: 'quote-1', quoteNumber: 'Q-1001', leadId: 'lead-1', conversationId: 'conv-1', vehicleIds: ['veh-1', 'veh-2'], status: 'sent', revision: 1, disclosureIncluded: true, createdAt: ago(28), sentAt: ago(25), expiresAt: fromNow(4320), scenarios: [
    { id: 'qs-1a', quoteId: 'quote-1', label: 'RAV4 XLE — 72 months', vehicleId: 'veh-1', vehicleSummary: '2024 Toyota RAV4 XLE AWD', sellingPrice: 38450, downPayment: 0, tradeInValue: 15000, termMonths: 72, interestRate: 5.99, monthlyPayment: 389, biweeklyPayment: 180, totalCost: 28008, taxes: 3049, fees: 499 },
    { id: 'qs-1b', quoteId: 'quote-1', label: 'CR-V EX-L — 72 months', vehicleId: 'veh-2', vehicleSummary: '2023 Honda CR-V EX-L', sellingPrice: 35900, downPayment: 0, tradeInValue: 15000, termMonths: 72, interestRate: 5.99, monthlyPayment: 347, biweeklyPayment: 160, totalCost: 24984, taxes: 2717, fees: 499 },
  ]},
  { id: 'quote-2', quoteNumber: 'Q-0998', leadId: 'lead-2', vehicleIds: ['veh-4'], status: 'draft', revision: 2, disclosureIncluded: true, createdAt: ago(180), scenarios: [
    { id: 'qs-2a', quoteId: 'quote-2', label: 'F-150 XLT — 72 months', vehicleId: 'veh-4', vehicleSummary: '2023 Ford F-150 XLT SuperCrew', sellingPrice: 49900, downPayment: 5000, tradeInValue: 17500, termMonths: 72, interestRate: 6.49, monthlyPayment: 475, biweeklyPayment: 219, totalCost: 34200, taxes: 3564, fees: 599 },
  ]},
  { id: 'quote-3', quoteNumber: 'Q-0995', leadId: 'lead-7', conversationId: 'conv-6', vehicleIds: ['veh-5'], status: 'accepted', revision: 1, disclosureIncluded: true, createdAt: ago(1440), sentAt: ago(1425), viewedAt: ago(900), scenarios: [
    { id: 'qs-3a', quoteId: 'quote-3', label: 'Equinox LT — 60 months', vehicleId: 'veh-5', vehicleSummary: '2024 Chevrolet Equinox LT AWD', sellingPrice: 32500, downPayment: 3000, tradeInValue: 0, termMonths: 60, interestRate: 4.99, monthlyPayment: 557, biweeklyPayment: 257, totalCost: 33420, taxes: 3835, fees: 499 },
  ]},
  { id: 'quote-4', quoteNumber: 'Q-0990', leadId: 'lead-5', vehicleIds: ['veh-3'], status: 'viewed', revision: 1, disclosureIncluded: true, createdAt: ago(1500), sentAt: ago(1470), viewedAt: ago(300), scenarios: [
    { id: 'qs-4a', quoteId: 'quote-4', label: 'Tucson Preferred — 72 months', vehicleId: 'veh-3', vehicleSummary: '2024 Hyundai Tucson Preferred AWD', sellingPrice: 34500, downPayment: 2000, tradeInValue: 0, termMonths: 72, interestRate: 5.49, monthlyPayment: 508, biweeklyPayment: 234, totalCost: 36576, taxes: 4225, fees: 499 },
  ]},
  { id: 'quote-5', quoteNumber: 'Q-1005', leadId: 'lead-3', vehicleIds: ['veh-10'], status: 'draft', revision: 1, disclosureIncluded: true, createdAt: ago(10), scenarios: [
    { id: 'qs-5a', quoteId: 'quote-5', label: 'Mustang GT — 60 months', vehicleId: 'veh-10', vehicleSummary: '2023 Ford Mustang GT Premium', sellingPrice: 48900, downPayment: 10000, tradeInValue: 0, termMonths: 60, interestRate: 6.99, monthlyPayment: 769, biweeklyPayment: 355, totalCost: 46140, taxes: 6357, fees: 599 },
  ]},
];

// ─── Follow-Up Tasks ────────────────────────────────────────────────────────
export const demoFollowUpTasks: FollowUpTask[] = [
  { id: 'task-1', leadId: 'lead-1', conversationId: 'conv-1', type: 'quote_follow_up', status: 'scheduled', scheduledFor: fromNow(60), channel: 'phone', message: 'Follow up on RAV4 vs CR-V comparison quote', assignedTo: 'AI Agent', priority: 'hot', customerName: 'Sarah Mitchell' },
  { id: 'task-2', leadId: 'lead-8', conversationId: 'conv-7', type: 'callback', status: 'scheduled', scheduledFor: fromNow(600), channel: 'phone', message: 'Scheduled callback — customer requested time to decide on RAV4 payment options', assignedTo: 'AI Agent', priority: 'hot', customerName: 'Amanda Torres' },
  { id: 'task-3', leadId: 'lead-5', type: 'appointment_reminder', status: 'due', scheduledFor: fromNow(30), channel: 'sms', message: 'Reminder: test drive tomorrow at 10 AM for Tucson Preferred', assignedTo: 'AI Agent', priority: 'hot', customerName: 'Lisa Park' },
  { id: 'task-4', leadId: 'lead-6', type: 'reactivation', status: 'overdue', scheduledFor: ago(1440), channel: 'sms', message: 'Re-engage stale lead — last contact 3 days ago', assignedTo: 'Unassigned', priority: 'cold', customerName: 'Tom Bradley' },
  { id: 'task-5', leadId: 'lead-7', conversationId: 'conv-6', type: 'document_request', status: 'due', scheduledFor: fromNow(15), channel: 'email', message: 'Request proof of income and insurance documents for finance packet', assignedTo: 'AI Agent', priority: 'hot', customerName: 'Jennifer Wu' },
  { id: 'task-6', leadId: 'lead-2', conversationId: 'conv-2', type: 'follow_up', status: 'completed', scheduledFor: ago(120), completedAt: ago(115), channel: 'sms', message: 'Follow up on trade-in discussion', assignedTo: 'AI Agent', priority: 'warm', customerName: 'James Cooper' },
];

// ─── Finance Packets ────────────────────────────────────────────────────────
export const demoFinancePackets: FinancePacket[] = [
  {
    id: 'fp-1', leadId: 'lead-1', applicantId: 'fa-1', quoteId: 'quote-1', vehicleId: 'veh-1', status: 'in_progress', completionPercentage: 60, blockers: ['Missing proof of income', 'Missing insurance card'],
    consentRecords: [
      { id: 'cr-1', leadId: 'lead-1', type: 'credit_check', granted: true, grantedAt: ago(20), method: 'electronic' },
      { id: 'cr-2', leadId: 'lead-1', type: 'data_sharing', granted: true, grantedAt: ago(20), method: 'electronic' },
    ],
    disclosureRecords: [
      { id: 'dr-1', leadId: 'lead-1', type: 'ai_disclosure', sentAt: ago(44), acknowledgedAt: ago(43), channel: 'phone' },
      { id: 'dr-2', leadId: 'lead-1', type: 'privacy_policy', sentAt: ago(20), channel: 'email' },
    ],
    documents: [
      { id: 'doc-1', financeApplicantId: 'fa-1', type: 'drivers_license', label: "Driver's License", status: 'received', uploadedAt: ago(18) },
      { id: 'doc-2', financeApplicantId: 'fa-1', type: 'proof_of_income', label: 'Proof of Income', status: 'missing' },
      { id: 'doc-3', financeApplicantId: 'fa-1', type: 'proof_of_residence', label: 'Proof of Residence', status: 'received', uploadedAt: ago(15) },
      { id: 'doc-4', financeApplicantId: 'fa-1', type: 'insurance', label: 'Insurance Card', status: 'missing' },
      { id: 'doc-5', financeApplicantId: 'fa-1', type: 'credit_application', label: 'Credit Application', status: 'received', uploadedAt: ago(10) },
    ],
    routingStatus: 'not_started', createdAt: ago(22), updatedAt: ago(10),
  },
  {
    id: 'fp-2', leadId: 'lead-7', applicantId: 'fa-2', quoteId: 'quote-3', vehicleId: 'veh-5', status: 'ready', completionPercentage: 100, blockers: [],
    consentRecords: [
      { id: 'cr-3', leadId: 'lead-7', type: 'credit_check', granted: true, grantedAt: ago(85), method: 'electronic' },
      { id: 'cr-4', leadId: 'lead-7', type: 'data_sharing', granted: true, grantedAt: ago(85), method: 'electronic' },
      { id: 'cr-5', leadId: 'lead-7', type: 'electronic_signature', granted: true, grantedAt: ago(80), method: 'electronic' },
    ],
    disclosureRecords: [
      { id: 'dr-3', leadId: 'lead-7', type: 'ai_disclosure', sentAt: ago(88), acknowledgedAt: ago(86), channel: 'web' },
      { id: 'dr-4', leadId: 'lead-7', type: 'credit_inquiry', sentAt: ago(82), acknowledgedAt: ago(80), channel: 'email' },
      { id: 'dr-5', leadId: 'lead-7', type: 'rate_disclaimer', sentAt: ago(82), acknowledgedAt: ago(80), channel: 'email' },
    ],
    documents: [
      { id: 'doc-6', financeApplicantId: 'fa-2', type: 'drivers_license', label: "Driver's License", status: 'received', uploadedAt: ago(75) },
      { id: 'doc-7', financeApplicantId: 'fa-2', type: 'proof_of_income', label: 'Proof of Income', status: 'received', uploadedAt: ago(70) },
      { id: 'doc-8', financeApplicantId: 'fa-2', type: 'proof_of_residence', label: 'Proof of Residence', status: 'received', uploadedAt: ago(68) },
      { id: 'doc-9', financeApplicantId: 'fa-2', type: 'insurance', label: 'Insurance Card', status: 'received', uploadedAt: ago(65) },
      { id: 'doc-10', financeApplicantId: 'fa-2', type: 'credit_application', label: 'Credit Application', status: 'received', uploadedAt: ago(60) },
    ],
    routingStatus: 'submitted', routingTarget: 'Dealertrack', routedAt: ago(55), createdAt: ago(80), updatedAt: ago(55),
  },
  {
    id: 'fp-3', leadId: 'lead-2', applicantId: 'fa-3', quoteId: 'quote-2', vehicleId: 'veh-4', status: 'pending_consent', completionPercentage: 0, blockers: ['Awaiting customer consent'],
    consentRecords: [],
    disclosureRecords: [],
    documents: [
      { id: 'doc-11', financeApplicantId: 'fa-3', type: 'drivers_license', label: "Driver's License", status: 'missing' },
      { id: 'doc-12', financeApplicantId: 'fa-3', type: 'proof_of_income', label: 'Proof of Income', status: 'missing' },
      { id: 'doc-13', financeApplicantId: 'fa-3', type: 'proof_of_residence', label: 'Proof of Residence', status: 'missing' },
      { id: 'doc-14', financeApplicantId: 'fa-3', type: 'insurance', label: 'Insurance Card', status: 'missing' },
      { id: 'doc-15', financeApplicantId: 'fa-3', type: 'credit_application', label: 'Credit Application', status: 'missing' },
    ],
    routingStatus: 'not_started', createdAt: ago(14), updatedAt: ago(14),
  },
];

// ─── Appointments ───────────────────────────────────────────────────────────
export const demoAppointments: Appointment[] = [
  { id: 'apt-1', leadId: 'lead-5', conversationId: 'conv-5', type: 'test_drive', scheduledAt: fromNow(720), duration: 60, status: 'confirmed', assignedTo: 'Mike R.', notes: 'Tucson Preferred AWD test drive', reminderSent: false },
  { id: 'apt-2', leadId: 'lead-7', conversationId: 'conv-6', type: 'finance_signing', scheduledAt: fromNow(1440), duration: 45, status: 'scheduled', assignedTo: 'Sarah K.', notes: 'Equinox LT finance paperwork signing', reminderSent: false },
  { id: 'apt-3', leadId: 'lead-1', conversationId: 'conv-1', type: 'consultation', scheduledAt: fromNow(360), duration: 30, status: 'scheduled', assignedTo: 'AI Agent', notes: 'RAV4 vs CR-V comparison walkthrough', reminderSent: false },
];

// ─── Audit Events ───────────────────────────────────────────────────────────
export const demoAuditEvents: AuditEvent[] = [
  { id: 'ae-1', action: 'call_started', entityType: 'conversation', entityId: 'conv-1', performedBy: 'System', performedAt: ago(45), details: 'Inbound call received from (416) 234-8901' },
  { id: 'ae-2', action: 'disclosure_sent', entityType: 'conversation', entityId: 'conv-1', performedBy: 'AI Agent', performedAt: ago(44), details: 'AI disclosure sent to Sarah Mitchell' },
  { id: 'ae-3', action: 'quote_sent', entityType: 'quote', entityId: 'quote-1', performedBy: 'AI Agent', performedAt: ago(25), details: 'Comparison quote Q-1001 sent to Sarah Mitchell (RAV4 XLE vs CR-V EX-L)' },
  { id: 'ae-4', action: 'consent_captured', entityType: 'finance_packet', entityId: 'fp-2', performedBy: 'Jennifer Wu', performedAt: ago(85), details: 'Electronic consent for credit check and data sharing signed' },
  { id: 'ae-5', action: 'finance_submitted', entityType: 'finance_packet', entityId: 'fp-2', performedBy: 'System', performedAt: ago(55), details: 'Finance packet submitted to Dealertrack for Jennifer Wu (Equinox LT)' },
  { id: 'ae-6', action: 'appointment_booked', entityType: 'appointment', entityId: 'apt-1', performedBy: 'AI Agent', performedAt: ago(193), details: 'Test drive booked for Lisa Park — Tucson Preferred, tomorrow at 10 AM' },
  { id: 'ae-7', action: 'handoff_initiated', entityType: 'conversation', entityId: 'conv-7', performedBy: 'AI Agent', performedAt: ago(4), details: 'Escalation triggered for Amanda Torres — objection detected, customer frustrated' },
  { id: 'ae-8', action: 'document_received', entityType: 'finance_packet', entityId: 'fp-1', performedBy: 'Sarah Mitchell', performedAt: ago(18), details: "Driver's license uploaded for finance application" },
];

// ─── Escalations ────────────────────────────────────────────────────────────
export const demoEscalations: Escalation[] = [
  { id: 'esc-1', conversationId: 'conv-7', leadId: 'lead-8', reason: 'objection_detected', severity: 'high', status: 'open', customerName: 'Amanda Torres', channel: 'phone', createdAt: ago(4) },
  { id: 'esc-2', conversationId: 'conv-4', leadId: 'lead-4', reason: 'sentiment_negative', severity: 'medium', status: 'open', customerName: 'David Chen', channel: 'instagram', createdAt: ago(20) },
];
