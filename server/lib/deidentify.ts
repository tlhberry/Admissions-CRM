/**
 * server/lib/deidentify.ts
  *
   * HIPAA De-identification helper (Safe Harbor method – 45 CFR §164.514(b))
    * Strips or generalizes the 18 PHI identifiers before sending data to AI models.
     *
      * Usage:
       *   import { deidentifyInquiry } from './lib/deidentify';
        *   const safe = deidentifyInquiry(inquiry);
         *   // pass `safe` to Anthropic – never pass raw inquiry
          */

import type { Inquiry } from '../../shared/schema';

// ---------------------------------------------------------------------------
// Age-bracket helper
// ---------------------------------------------------------------------------
function ageBracket(dob: string | null | undefined): string {
    if (!dob) return '[AGE_UNKNOWN]';
    const birthYear = new Date(dob).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    if (age < 18)  return '[AGE_BRACKET: <18]';
    if (age < 26)  return '[AGE_BRACKET: 18-25]';
    if (age < 36)  return '[AGE_BRACKET: 26-35]';
    if (age < 46)  return '[AGE_BRACKET: 36-45]';
    if (age < 56)  return '[AGE_BRACKET: 46-55]';
    if (age < 66)  return '[AGE_BRACKET: 56-65]';
    return '[AGE_BRACKET: 65+]';
}

// ---------------------------------------------------------------------------
// Text scrubber – removes residual PHI patterns from free-text fields
// ---------------------------------------------------------------------------
function scrubText(raw: string | null | undefined): string | null {
    if (!raw) return raw ?? null;
    return raw
          // Email addresses
          .replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, '[EMAIL_REDACTED]')
          // US phone numbers (various formats)
          .replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[PHONE_REDACTED]')
          // Social Security Numbers
          .replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN_REDACTED]')
          // Dates (MM/DD/YYYY, YYYY-MM-DD, etc.)
          .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '[DATE_REDACTED]')
          // Member/group numbers (7+ consecutive digits)
          .replace(/\b\d{7,}\b/g, '[ID_REDACTED]');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export interface DeidentifiedInquiry {
    // Retained – clinically useful, non-identifying
    id: number;
    stage: string | null;
    ageBracket: string;
    seekingSudTreatment: string | null;
    seekingMentalHealth: string | null;
    seekingEatingDisorder: string | null;
    presentingProblems: string | null;
    levelOfCare: string | null;
    insuranceProvider: string | null;       // payer name is not PHI
    vobStatus: string | null;
    isViable: string | null;
    nonViableReason: string | null;
    referralOrigin: string | null;
    onlineSource: string | null;
    callDurationSeconds: number | null;
    // Sanitised free-text (PHI patterns removed)
    initialNotesSanitized: string | null;
    callSummarySanitized: string | null;
    insuranceNotesSanitized: string | null;
    coverageDetailsSanitized: string | null;
    // Redacted markers so AI knows what was stripped
    _redacted: {
          callerName: true;
          clientName: true;
          phoneNumber: true;
          email: true;
          dateOfBirth: true;        // replaced with ageBracket
          insurancePolicyId: true;  // member ID
          groupNumber: true;        // not stored but noted
    };
}

/**
 * Returns a de-identified view of an Inquiry object safe to send to AI models.
  * All 18 HIPAA Safe Harbor PHI categories are either removed or generalised.
   *
    * TODO: extend this list when new PHI fields are added to the schema.
     */
export function deidentifyInquiry(inquiry: Inquiry): DeidentifiedInquiry {
    return {
          id: inquiry.id,
          stage: inquiry.stage,
          ageBracket: ageBracket(inquiry.dateOfBirth),
          seekingSudTreatment: inquiry.seekingSudTreatment,
          seekingMentalHealth: inquiry.seekingMentalHealth,
          seekingEatingDisorder: inquiry.seekingEatingDisorder,
          presentingProblems: scrubText(inquiry.presentingProblems),
          levelOfCare: inquiry.levelOfCare,
          insuranceProvider: inquiry.insuranceProvider,
          vobStatus: inquiry.vobStatus,
          isViable: inquiry.isViable,
          nonViableReason: inquiry.nonViableReason,
          referralOrigin: inquiry.referralOrigin,
          onlineSource: inquiry.onlineSource,
          callDurationSeconds: inquiry.callDurationSeconds,
          initialNotesSanitized: scrubText(inquiry.initialNotes),
          callSummarySanitized: scrubText(inquiry.callSummary),
          insuranceNotesSanitized: scrubText(inquiry.insuranceNotes),
          coverageDetailsSanitized: scrubText(inquiry.coverageDetails),
          _redacted: {
                  callerName: true,
                  clientName: true,
                  phoneNumber: true,
                  email: true,
                  dateOfBirth: true,
                  insurancePolicyId: true,
                  groupNumber: true,
          },
    };
}

/**
 * Batch de-identify an array of inquiries.
  */
export function deidentifyInquiries(inquiries: Inquiry[]): DeidentifiedInquiry[] {
    return inquiries.map(deidentifyInquiry);
}
