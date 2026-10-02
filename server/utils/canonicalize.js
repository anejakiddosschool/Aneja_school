// server/utils/canonicalize.js
// Grade levels and sections are free-text strings matched with exact equality
// across students, subjects, sections, rosters, assessments and teacher
// homerooms. A stray space, a missing "th" or a typo ("Edision") silently
// splits one class into two: the class shows in the dropdown but reports empty.
//
// These helpers resolve any spelling of a class to the single canonical value
// already used by the Subject/Section collections.

/** Comparison key: case, spacing and punctuation insensitive. */
const gradeKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** "  Grade 2nd   Diamond " -> "Grade 2nd Diamond" */
const tidy = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    // "Ganga -2" and "Ganga-2" are the same section
    .replace(/\s*-\s*/g, "-")
    .trim();

// Spellings that must be corrected even when no Subject record exists to
// compare against. Keys are gradeKey() values.
const GRADE_ALIASES = {
  grade4thedision: "Grade 4th Edison",
  grade1stthinkers: "Grade 1st Thinkers",
  grade3rdsaturn: "Grade 3rd Saturn",
  grade6azad: "Grade 6th Azad",
  grade5thkaveri: "Grade 5th Kaveri",
};

/**
 * Build a gradeKey -> canonical grade lookup from the known class names.
 * The most frequent spelling wins, so the common form is never rewritten.
 */
const buildGradeLookup = (knownGrades = []) => {
  const counts = new Map();
  const display = new Map();

  for (const raw of knownGrades) {
    const value = tidy(raw);
    if (!value) continue;
    const key = gradeKey(value);
    counts.set(key, (counts.get(key) || 0) + 1);
    if (!display.has(key)) display.set(key, value);
  }

  const lookup = new Map();
  for (const [key, count] of counts) {
    lookup.set(key, { value: display.get(key), count });
  }
  return lookup;
};

/**
 * Resolve a grade level to its canonical spelling.
 * Priority: exact known value -> case/space-insensitive known value ->
 * explicit alias -> cleaned input.
 */
const canonicalizeGradeLevel = (raw, gradeLookup = new Map()) => {
  const cleaned = tidy(raw);
  if (!cleaned) return "";

  const exact = gradeLookup.get(gradeKey(cleaned));
  if (exact) return exact.value;

  const alias = GRADE_ALIASES[gradeKey(cleaned)];
  if (alias) return alias;

  return cleaned;
};

/** Build a name lookup scoped to one grade level. */
const buildSectionLookup = (sections = []) => {
  const lookup = new Map();
  for (const { name } of sections) {
    const value = tidy(name);
    if (value) lookup.set(gradeKey(value), value);
  }
  return lookup;
};

/**
 * Resolve a section name. Sections have far fewer variants than grades, so this
 * only tidies whitespace and matches a known name case-insensitively.
 */
const canonicalizeSection = (raw, sectionLookup = null) => {
  const cleaned = tidy(raw);
  if (!cleaned) return "";
  if (!sectionLookup) return cleaned;

  const match = sectionLookup.get(gradeKey(cleaned));
  return match || cleaned;
};

/** "Grade 4th Edison" -> "Edison" */
const gradeSuffix = (gradeLevel) =>
  tidy(
    String(gradeLevel ?? "").replace(
      /^grade\s*\d{1,2}\s*(st|nd|rd|th)?\s*/i,
      ""
    )
  );

/**
 * Sections of named classes usually repeat the class name. When the class is
 * spelled correctly, keep the section in step instead of freezing the typo
 * into the section ("Edision" -> "Edison"). Casing always follows the
 * canonical class name, so nothing is invented.
 */
const syncSectionWithGrade = (section, oldGradeLevel, newGradeLevel) => {
  const current = tidy(section);
  if (!current || !oldGradeLevel || !newGradeLevel) return current;

  // Never touch the section when the class name did not actually change.
  if (gradeKey(oldGradeLevel) === gradeKey(newGradeLevel)) return current;

  const oldSuffix = gradeSuffix(oldGradeLevel);
  if (!oldSuffix || gradeKey(current) !== gradeKey(oldSuffix)) return current;

  return gradeSuffix(newGradeLevel) || current;
};

module.exports = {
  gradeKey,
  tidy,
  GRADE_ALIASES,
  buildGradeLookup,
  canonicalizeGradeLevel,
  buildSectionLookup,
  canonicalizeSection,
  gradeSuffix,
  syncSectionWithGrade,
};