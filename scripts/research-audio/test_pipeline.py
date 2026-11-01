"""Regression checks for the source-sensitive parts of narration QA."""
import unittest
import tempfile
from pathlib import Path
from render import script_hash
from narration_pipeline import file_sha256

from repair import canonical_speech, complete_script_end, prepare_requests, publication_records


class SpeechComparisonTests(unittest.TestCase):
    def test_written_and_spoken_dates_agree(self):
        self.assertEqual(canonical_speech("three hundred and twenty-five"), "325")

    def test_chapter_lists_keep_their_conjunction(self):
        self.assertEqual(canonical_speech("chapters fifteen and sixteen"), "chapters 15 and 16")
        self.assertNotEqual(canonical_speech("one and one"), canonical_speech("two"))

    def test_distinct_quantities_and_ordinals_remain_distinct(self):
        self.assertNotEqual(canonical_speech("six"), canonical_speech("sixteen"))
        self.assertEqual(canonical_speech("First Enoch"), "first enoch")

    def test_unspoken_apostrophes_do_not_create_word_errors(self):
        self.assertEqual(canonical_speech("the passage's assessment"), canonical_speech("the passages assessment"))
        self.assertNotEqual(canonical_speech("isn't made"), canonical_speech("is made"))

    def test_closing_tail_edit_follows_complete_script(self):
        segments = [{"words": [
            {"word": "God", "end": 1}, {"word": "is", "end": 2},
            {"word": "not", "end": 3}, {"word": "made", "end": 4},
            {"word": "The", "start": 5, "end": 5.5}, {"word": "End", "start": 5.5, "end": 6},
        ]}]
        self.assertEqual(complete_script_end("God is not made", "God is not made The End", segments, 6), 4.15)
        self.assertIsNone(complete_script_end("God is not made", "God is made The End", segments, 6))
        self.assertIsNone(complete_script_end("God is not made", "God is really not made The End", segments, 6))
        self.assertIsNone(complete_script_end("God is not made", "God is not made", segments, 6))

    def test_overlapping_timing_cannot_cut_a_word(self):
        segments = [{"words": [{"word": "Witness", "end": 2}, {"word": "End", "start": 2, "end": 3}]}]
        self.assertIsNone(complete_script_end("Witness", "Witness End", segments, 3))


class RequestPreparationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.output = Path(self.temp.name)
        self.episode = {"id": "new-example", "title": "Example", "sections": [
            {"title": "First", "text": "First paragraph."},
            {"title": "Second", "text": "Second paragraph."},
        ]}

    def prepare(self, new=None, targets=None, manifest=None, receipts=None):
        return prepare_requests([self.episode], manifest or {}, receipts or {},
            self.output, new or [], targets or [], "voice-hash")

    def existing(self):
        media = self.output / "new-example.m4a"
        media.write_bytes(b"existing encoded audio")
        return {"new-example": {"src": "/research-audio/new-example.m4a",
            "sha256": file_sha256(media), "scriptSha256": script_hash(self.episode)}}

    def test_new_selects_every_section_and_only_prepares_metadata(self):
        manifest, receipts = {}, {}
        targets, initialized = self.prepare(new=["new-example"], manifest=manifest, receipts=receipts)
        self.assertEqual(targets, {"new-example": {0, 1}})
        self.assertEqual(initialized["new-example"]["scriptSha256"], script_hash(self.episode))
        self.assertEqual(initialized["new-example"]["voiceReferenceSha256"], "voice-hash")
        self.assertNotIn("sha256", initialized["new-example"])
        self.assertEqual(list(self.output.iterdir()), [])
        self.assertEqual(manifest, {})
        self.assertEqual(receipts, {})

    def test_new_refuses_any_existing_publication_piece(self):
        for kwargs in ({"manifest": {"new-example": {}}}, {"receipts": {"new-example": {}}}):
            with self.subTest(kwargs=kwargs), self.assertRaisesRegex(ValueError, "partial publication"):
                self.prepare(new=["new-example"], **kwargs)
        media = self.output / "new-example.m4a"
        media.write_bytes(b"do not overwrite")
        with self.assertRaisesRegex(ValueError, "partial publication"):
            self.prepare(new=["new-example"])
        self.assertEqual(media.read_bytes(), b"do not overwrite")

    def test_invalid_new_requests_fail_without_creating_artifacts(self):
        for ids in (["missing"], ["new-example", "new-example"], ["new-example", "missing"]):
            with self.subTest(ids=ids), self.assertRaises(ValueError):
                self.prepare(new=ids)
        self.assertEqual(list(self.output.iterdir()), [])

    def test_new_and_target_modes_are_exclusive(self):
        with self.assertRaisesRegex(ValueError, "either"):
            self.prepare(new=["new-example"], targets=["new-example:1"])
        with self.assertRaisesRegex(ValueError, "either"):
            self.prepare()

    def test_existing_target_checks_script_media_and_section(self):
        manifest = self.existing()
        targets, initialized = self.prepare(targets=["new-example:2"], manifest=manifest)
        self.assertEqual(targets, {"new-example": {1}})
        self.assertEqual(initialized, {})
        for target in ("new-example", "new-example:zero", "new-example:0", "new-example:3", "missing:1"):
            with self.subTest(target=target), self.assertRaises(ValueError):
                self.prepare(targets=[target], manifest=manifest)
        with self.assertRaisesRegex(ValueError, "Duplicate target"):
            self.prepare(targets=["new-example:1", "new-example:1"], manifest=manifest)
        manifest["new-example"]["scriptSha256"] = "stale"
        with self.assertRaisesRegex(ValueError, "Stale script"):
            self.prepare(targets=["new-example:1"], manifest=manifest)
        manifest["new-example"]["scriptSha256"] = script_hash(self.episode)
        (self.output / "new-example.m4a").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "Changed media"):
            self.prepare(targets=["new-example:1"], manifest=manifest)

    def test_finishing_first_episode_does_not_publish_other_planned_episodes(self):
        second = {**self.episode, "id": "another-example"}
        manifest, receipts = {}, {}
        _, planned = prepare_requests([self.episode, second], manifest, receipts,
            self.output, ["new-example", "another-example"], [], "voice-hash")
        completed = {**planned["new-example"], "sha256": "a" * 64,
            "durationSeconds": 360, "chapters": [{"startSeconds": 0, "durationSeconds": 360}]}
        published, updated = publication_records(manifest, receipts, "new-example", completed, [{"section": 1}])
        self.assertEqual(set(published), {"new-example"})
        self.assertEqual(set(updated), {"new-example"})
        self.assertEqual(manifest, {})
        self.assertEqual(receipts, {})
        with self.assertRaisesRegex(ValueError, "incomplete recording: another-example"):
            publication_records({"another-example": planned["another-example"]}, receipts,
                "new-example", completed, [{"section": 1}])

    def test_unpublished_target_requires_new_mode(self):
        with self.assertRaisesRegex(ValueError, "use --new"):
            self.prepare(targets=["new-example:1"])


if __name__ == "__main__":
    unittest.main()
