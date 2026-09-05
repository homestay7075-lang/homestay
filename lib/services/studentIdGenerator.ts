/**
 * Student ID Generator
 * Format: STU + last two digits of joining year + sequential 3+ digit number (starting at 101)
 * Example:
 *   Year 2026: STU26101, STU26102, STU26103...
 *   Year 2027: STU27101, STU27102...
 * 
 * Strict Rules:
 * 1. Sequences never reset when beds change or students checkout.
 * 2. Already used numbers for that year are never reused.
 * 3. Atomic sequence computation inspecting both active students and historical records.
 */

export function generateNextStudentId(joiningDateStr: string, existingIds: string[]): string {
  const joiningDate = new Date(joiningDateStr);
  const fullYear = isNaN(joiningDate.getFullYear()) ? new Date().getFullYear() : joiningDate.getFullYear();
  const yearShort = String(fullYear).slice(-2); // e.g. "26"
  const prefix = `STU${yearShort}`;

  // Extract all sequences existing for this year
  let maxSeq = 100; // Sequence begins at 101
  const idRegex = new RegExp(`^STU${yearShort}(\\d+)$`);

  for (const id of existingIds) {
    const match = id.trim().match(idRegex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${nextSeq}`;
}
