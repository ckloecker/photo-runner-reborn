import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "stamp-deployment.py"
SPEC = importlib.util.spec_from_file_location("stamp_deployment", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
stamp = MODULE.stamp


class StampDeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.page = Path(self.temporary_directory.name) / "index.html"
        self.page.write_text(
            '<meta name="game-source-branch" content="Not injected">\n'
            '<meta name="game-source-commit" content="Not injected">\n',
            encoding="utf-8",
        )

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_injects_escaped_branch_and_full_commit(self):
        stamp(self.page, "feature&fix", "a" * 40)
        content = self.page.read_text(encoding="utf-8")
        self.assertIn('content="feature&amp;fix"', content)
        self.assertIn(f'content="{"a" * 40}"', content)

    def test_rejects_short_commit_sha(self):
        with self.assertRaisesRegex(ValueError, "full 40-character"):
            stamp(self.page, "develop", "abc123")

    def test_rejects_missing_metadata_tag(self):
        self.page.write_text('<meta name="game-source-branch" content="Not injected">', encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "game-source-commit"):
            stamp(self.page, "develop", "b" * 40)


if __name__ == "__main__":
    unittest.main()
