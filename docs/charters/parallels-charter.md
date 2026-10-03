# Product & Editorial Charter: Source-Anchored Claim Matrix

## 1. Purpose & Scope
The **Source-Anchored Claim Matrix** (`/scriptures/parallels/[id]`) provides a side-by-side comparative analysis of thematic, narrative, and legal passages across ancient Near Eastern, Second Temple Jewish, biblical, early Christian, and Islamic witnesses.

The site’s public identity remains firmly anchored in the historic Christian record. This subsystem serves as an analytical research tool that respects the integrity of each tradition by refusing two common distortions:
1. **Harmonization**: Flattening distinct theological narratives or anachronistically projecting later traditions into earlier texts.
2. **Polemical Relativism**: Unsubstantiated claims of direct borrowing or loose semantic similarity without textual or manuscript evidence.

---

## 2. Core Methodological Principle: "Slot-Diff, Not Distance"
- **Embeddings for Discovery Only**: High-dimensional vector embeddings may suggest candidate parallel passages during offline research, but no vector similarity scores or distance metrics are presented to the reader as evidence of relationship.
- **Authored Slots, Deterministic Extraction**:
  - The definition, delimitation, and thematic labeling of comparative "slots" (e.g. *The Divine Command*, *The Response of the Son*, *The Provided Ransom*) are authored editorial judgments.
  - The extraction of excerpts, verse ranges, and transliterations from pinned source shards is **deterministic and machine-verified**.

---

## 3. Separation of Layers
Every matrix entry strictly enforces the boundary between what the base text says and how it was later received:

| Layer | Definition | Grounding Requirement |
| --- | --- | --- |
| **Passage Witness** | The verbatim text within its specific historical edition and linguistic context. | Pinned source shard with exact verse locator. |
| **Textual Slot Cell** | The direct statement of the witness regarding a specific narrative or thematic element. | Rated with evidence basis: `explicit`, `inferred`, or `disputed`. |
| **Pairwise Edge** | A documented historical or literary relationship between exactly two witnesses. | Categorized (`direct-citation`, `allusion`, `shared-tradition`, `theological-divergence`, `independent`) with scholarly consensus rating and citations. |
| **Reception Claim** | Later theological typology, liturgical practice, or midrashic expansion (e.g., Christological typology, Jewish *Aqedah* merit, Islamic Eid commemoration). | Governed by the site's claim registry (`src/lib/evidence/claims.ts`), citing specific post-biblical or post-quranic commentaries. |

---

## 4. Rights, Provenance & Licensing
No external text is ingested without an artifact-level entry in `public/parallels/rights-manifest.json` recording:
1. Exact edition title, publisher/translator, upstream repository URL, and commit hash.
2. License identifier (e.g., `Tanzil-Text-1.0`, `CC-BY-4.0`, `Public-Domain`).
3. Mandatory attribution strings and copyright notices.
4. Permitted transformations and jurisdiction notes.

Mandatory attribution notices must be presented alongside the text and included automatically in user clipboard exports.

---

## 5. Review & Provenance Tiers
Every published matrix file includes a cryptographic provenance block:
```ts
provenance: {
  reviewStatus: "draft" | "machine-checked" | "agent-reviewed" | "human-approved";
  reviewer: string;
  rubricVersion: string;
  reviewedContentHash: string; // SHA-256 over normalized canonical slots & cells
  reviewedAt: string;
  reviewScope: string;
}
```
A passing machine check validates byte stability and source alignment, while the review tier explicitly identifies the human or agent authority responsible for editorial judgments.
