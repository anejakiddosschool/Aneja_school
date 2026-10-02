// One-off repair: align every class-name string in the database with the
// canonical Subject values, so a class stops splitting into near-duplicates
// ("Grade 4th Edision" vs "Grade 4th Edison") and rosters, assessment types
// and homeroom teachers match the students they belong to.
//
// Subjects are the reference set and are deliberately not rewritten.
// Dry run by default. Apply with:  node scripts/migrateClassNames.js --apply
// A JSON backup of every touched document is written before the first write.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Subject = require("../models/Subject");
const Section = require("../models/Section");
const {
  buildGradeLookup,
  canonicalizeGradeLevel,
  buildSectionLookup,
  canonicalizeSection,
  syncSectionWithGrade,
  gradeKey,
  tidy,
} = require("../utils/canonicalize");

const APPLY = process.argv.includes("--apply");
const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Subjects define the canonical names, so they are the reference, not a target.
const TARGETS = [
  { collection: "students", gradeField: "gradeLevel", withSection: true },
  { collection: "assessmenttypes", gradeField: "gradeLevel" },
  { collection: "users", gradeField: "homeroomGrade" },
  { collection: "customtests", gradeField: "gradeLevel" },
  { collection: "customtestgrades", gradeField: "gradeLevel" },
  { collection: "foundationtests", gradeField: "gradeLevel" },
  { collection: "foundationtestgrades", gradeField: "gradeLevel" },
  { collection: "sections", gradeField: "gradeLevel" },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  const db = mongoose.connection.db;
  const existing = new Set(
    (await db.listCollections().toArray()).map((c) => c.name)
  );

  const gradeLookup = buildGradeLookup(await Subject.distinct("gradeLevel"));
  const knownGrades = [...gradeLookup.values()].map((g) => g.value);

  const sectionsByGrade = new Map();
  for (const doc of await Section.find(
    { gradeLevel: { $in: knownGrades } },
    { gradeLevel: 1, name: 1 }
  ).lean()) {
    if (!sectionsByGrade.has(doc.gradeLevel)) sectionsByGrade.set(doc.gradeLevel, []);
    sectionsByGrade.get(doc.gradeLevel).push({ name: doc.name });
  }
  const sectionLookups = new Map(
    [...sectionsByGrade].map(([grade, entries]) => [
      grade,
      buildSectionLookup(entries),
    ])
  );

  const allChanges = [];
  for (const target of TARGETS) {
    if (!existing.has(target.collection)) continue;

    const docs = await db
      .collection(target.collection)
      .find({}, { projection: { [target.gradeField]: 1, section: 1 } })
      .toArray();

    for (const doc of docs) {
      const oldValue = doc[target.gradeField];
      if (!oldValue) continue;

      const newValue = canonicalizeGradeLevel(oldValue, gradeLookup);
      const section = target.withSection
        ? syncSectionWithGrade(
            canonicalizeSection(
              doc.section,
              sectionLookups.get(newValue) || null
            ),
            oldValue,
            newValue
          )
        : undefined;

      const gradeChanged = newValue !== oldValue;
      const sectionChanged = target.withSection && section !== (doc.section ?? "");
      if (!gradeChanged && !sectionChanged) continue;

      const change = {
        collection: target.collection,
        _id: doc._id,
        field: target.gradeField,
        from: oldValue,
        to: newValue,
      };
      // Named classes repeat the class name in their section; keep them in step
      // instead of freezing the old spelling into the section.
      if (sectionChanged) {
        change.sectionFrom = doc.section ?? "";
        change.sectionTo = section;
      }

      allChanges.push(change);
    }
  }

  // ---- Phase 2: collapse section spellings that differ only by case or
  // spacing ("Creators" / "creators") onto the most common spelling in that
  // class, preferring a spelling that is actually managed in Class Management.
  const studentSections = await db
    .collection("students")
    .aggregate([
      { $match: { section: { $nin: [null, ""] } } },
      { $group: { _id: { gradeLevel: "$gradeLevel", section: "$section" }, n: { $sum: 1 } } },
    ])
    .toArray();

  const byClassAndKey = new Map();
  for (const row of studentSections) {
    const grade = tidy(row._id.gradeLevel);
    const key = gradeKey(row._id.section);
    const bucketKey = `${grade}||${key}`;

    if (!byClassAndKey.has(bucketKey)) {
      byClassAndKey.set(bucketKey, { grade, variants: [], managed: false });
    }
    const bucket = byClassAndKey.get(bucketKey);
    bucket.variants.push({ name: tidy(row._id.section), count: row.n });
    if (sectionLookups.get(grade)?.has(key)) bucket.managed = true;
  }

  const sectionChanges = [];
  for (const { grade, variants, managed } of byClassAndKey.values()) {
    if (variants.length < 2) continue;

    // A managed Section record wins; otherwise the most used spelling.
    const winner = managed
      ? variants.find((v) => sectionLookups.get(grade).has(gradeKey(v.name)))
      : [...variants].sort((a, b) => b.count - a.count)[0];

    for (const variant of variants) {
      if (variant.name === winner.name) continue;

      const ids = await db
        .collection("students")
        .find(
          { gradeLevel: grade, section: { $in: [variant.name] } },
          { projection: { _id: 1 } }
        )
        .toArray();

      for (const doc of ids) {
        sectionChanges.push({
          collection: "students",
          _id: doc._id,
          field: "section",
          from: `${grade} / ${variant.name}`,
          to: `${grade} / ${winner.name}`,
          sectionFrom: variant.name,
          sectionTo: winner.name,
          count: variant.count,
        });
      }
    }
  }

  allChanges.push(...sectionChanges);

  console.log(`\nCorrections needed: ${allChanges.length}`);
  if (allChanges.length === 0) {
    console.log("Nothing to do.");
    process.exit(0);
  }

  const grouped = new Map();
  for (const change of allChanges) {
    const label =
      change.field === "section"
        ? `${change.collection}.section: ${change.from} -> ${change.to}`
        : `${change.collection}.${change.field}: ${change.from} -> ${change.to}` +
          (change.sectionTo !== undefined
            ? ` | section ${JSON.stringify(change.sectionFrom)} -> ${JSON.stringify(change.sectionTo)}`
            : "");
    grouped.set(label, (grouped.get(label) || 0) + 1);
  }
  for (const [label, count] of [...grouped].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)} x ${label}`);
  }

  if (!APPLY) {
    console.log("\nDRY RUN. Re-run with --apply to write these changes.");
    process.exit(0);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(BACKUP_DIR, `classnames-${stamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(allChanges, null, 2));
  console.log(`\nBackup written: ${backupFile}`);

  let written = 0;
  for (const change of allChanges) {
    const set = {};

    if (change.field === "section") {
      set.section = change.sectionTo;
    } else {
      set[change.field] = change.to;
      if (change.sectionTo !== undefined) set.section = change.sectionTo;
    }

    await db
      .collection(change.collection)
      .updateOne({ _id: change._id }, { $set: set });
    written += 1;
  }

  console.log(`Updated ${written} documents.`);
  process.exit(0);
})().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});