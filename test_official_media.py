"""Prevent PDF crops from drifting onto another exam, track, or question."""
import copy
import hashlib
import json
import struct
import tempfile
import unittest
from pathlib import Path

from apply_official_media import MANIFEST, ROOT, apply_media


class OfficialMediaTests(unittest.TestCase):
    def fixture(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        image = root / "assets/exams/test.png"
        image.parent.mkdir(parents=True)
        image.write_bytes(b"fixture crop")
        question = {"id": "legacy-common-id", "number": 3, "score": 3,
                    "preview": None, "images": ["existing-figure.png"],
                    "body": "original", "legacyIds": ["alias"], "courseCode": "ALG"}
        data = {"exams": [{"id": "kice-2026-6", "year": 2026,
                           "sections": [{"id": "common", "questions": [question]}]}]}
        row = {"examId": "kice-2026-6", "sectionId": "common", "number": 3,
               "calendarYear": 2026, "academicYear": 2027, "score": 3, "answer": "④",
               "preview": "assets/exams/test.png",
               "imageSha256": hashlib.sha256(image.read_bytes()).hexdigest(),
               "source": {"filename": "questions.pdf", "page": 1}}
        manifest = {"schema": "problem-atom/official-exam-media/1", "updatedAt": "2026-09-29",
                    "dashboardCoverage": {"attached": 1, "outsideDashboard": 0}, "records": [row]}
        return root, data, manifest

    def run_fixture(self, root, data, manifest):
        (root / MANIFEST).write_text(json.dumps(manifest), encoding="utf-8")
        return apply_media(data, root)

    def test_preserves_question_identity_and_existing_content(self):
        root, data, manifest = self.fixture()
        before = copy.deepcopy(data)
        result, report = self.run_fixture(root, data, manifest)
        self.assertEqual(data, before)
        question = result["exams"][0]["sections"][0]["questions"][0]
        self.assertEqual(question["preview"], "assets/exams/test.png")
        for key in ("id", "legacyIds", "images", "body", "courseCode"):
            self.assertEqual(question[key], before["exams"][0]["sections"][0]["questions"][0][key])
        self.assertEqual(report, {"attached": 1, "outsideDashboard": 0})
        self.assertEqual(apply_media(result, root)[0], result)

    def test_wrong_track_year_number_and_score_are_rejected(self):
        for field, value in (("sectionId", "미적분"), ("examId", "kice-2026-9"),
                             ("number", 4), ("calendarYear", 2027),
                             ("academicYear", 2026), ("score", 4)):
            with self.subTest(field=field):
                root, data, manifest = self.fixture()
                manifest["records"][0][field] = value
                with self.assertRaises(ValueError):
                    self.run_fixture(root, data, manifest)

    def test_missing_modified_and_outside_images_are_rejected(self):
        for failure in ("missing", "modified", "outside"):
            with self.subTest(failure=failure):
                root, data, manifest = self.fixture()
                row = manifest["records"][0]
                if failure == "missing":
                    row["preview"] = "assets/exams/missing.png"
                elif failure == "modified":
                    (root / row["preview"]).write_bytes(b"wrong crop")
                else:
                    row["preview"] = "../outside.png"
                with self.assertRaises(ValueError):
                    self.run_fixture(root, data, manifest)

    def test_duplicate_coordinates_and_incomplete_coverage_are_rejected(self):
        for failure in ("duplicate", "incomplete"):
            with self.subTest(failure=failure):
                root, data, manifest = self.fixture()
                if failure == "duplicate":
                    manifest["records"].append(copy.deepcopy(manifest["records"][0]))
                else:
                    manifest["dashboardCoverage"]["attached"] = 2
                with self.assertRaises(ValueError):
                    self.run_fixture(root, data, manifest)

    def test_two_point_crops_do_not_create_new_dashboard_questions(self):
        root, data, manifest = self.fixture()
        row = copy.deepcopy(manifest["records"][0])
        row.update(number=1, score=2)
        manifest["records"].append(row)
        manifest["dashboardCoverage"]["outsideDashboard"] = 1
        result, report = self.run_fixture(root, data, manifest)
        self.assertEqual(len(result["exams"][0]["sections"][0]["questions"]), 1)
        self.assertEqual(report["outsideDashboard"], 1)

    def test_official_media_covers_both_complete_exam_sets(self):
        manifest = json.loads((ROOT / MANIFEST).read_text(encoding="utf-8"))
        records = manifest["records"]
        expected = {(f"kice-2026-{month}", section, n)
                    for month in (6, 9)
                    for section, numbers in (("common", range(1, 23)), ("확통", range(23, 31)),
                                             ("미적분", range(23, 31)), ("기하", range(23, 31)))
                    for n in numbers}
        self.assertEqual({(r["examId"], r["sectionId"], r["number"]) for r in records}, expected)
        self.assertEqual(len(records), 92)
        self.assertEqual(len({r["preview"] for r in records}), 92)
        for row in records:
            raw = (ROOT / row["preview"]).read_bytes()
            self.assertEqual(raw[:8], b"\x89PNG\r\n\x1a\n")
            width, height = struct.unpack(">II", raw[16:24])
            self.assertGreaterEqual(width, 700)
            self.assertGreater(height, 80)
            self.assertEqual(row["imageSha256"], hashlib.sha256(raw).hexdigest())
            self.assertEqual((row["calendarYear"], row["academicYear"]), (2026, 2027))
            self.assertIn(row["source"]["page"], range(1, 21))

    def test_published_dashboard_has_all_82_previews_without_duplicate_common_ids(self):
        data = json.loads((ROOT / "dashboard-data.json").read_text(encoding="utf-8"))
        result, report = apply_media(data)
        self.assertEqual(result, data, "Published JSON must already contain the validated photos")
        self.assertEqual(report, {"attached": 82, "outsideDashboard": 10})
        questions = [q for e in data["exams"] if e["id"] in ("kice-2026-6", "kice-2026-9")
                     for s in e["sections"] for q in s["questions"]]
        self.assertEqual(len(questions), 82)
        self.assertEqual(len({q["id"] for q in questions}), 82)
        self.assertTrue(all(q["preview"] and q["officialAnswer"] for q in questions))


if __name__ == "__main__":
    unittest.main()
