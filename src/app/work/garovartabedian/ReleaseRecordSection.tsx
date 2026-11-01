import ReleaseRecord, { type ReleaseRecordData } from "./ReleaseRecord";

export default function ReleaseRecordSection({ record }: { record: ReleaseRecordData | null }) {
  return (
    <section aria-labelledby="release-record">
      <h2 id="release-record">Release record</h2>
      {record ? (
        <ReleaseRecord record={record} />
      ) : (
        <p className="note">The release record is added to this page during each production release.</p>
      )}
    </section>
  );
}
