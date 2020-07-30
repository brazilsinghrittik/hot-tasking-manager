import unittest

from backend.services.messaging.template_service import (
    templace_var_replacing,
    get_template,
    clean_html,
)


class TestTemplateService(unittest.TestCase):
    def test_variable_replacing(self):
        # Act
        content = get_template("email_verification_en.html")
        replace_list = [
            ["[USERNAME]", "test_user"],
            ["[VERIFICATION_LINK]", "http://localhost:30/verify.html#1234"],
            ["[ORG_CODE]", "HOT"],
            ["[ORG_NAME]", "Organization Test"],
        ]
        processed_content = templace_var_replacing(content, replace_list)
        # Assert
        self.assertIn("test_user", processed_content)
        self.assertIn("http://localhost:30/verify.html#1234", processed_content)
        self.assertIn("HOT", processed_content)
        self.assertIn("Organization Test", processed_content)

        self.assertNotIn("[USERNAME]", processed_content)
        self.assertNotIn("[VERIFICATION_LINK]", processed_content)
        self.assertNotIn("[ORG_CODE]", processed_content)
        self.assertNotIn("[ORG_NAME]", processed_content)

    def test_clean_html(self):
        self.assertEqual(
            clean_html(
                'Welcome to <a href="https://tasks.hotosm.org">Tasking Manager</a>!'
            ),
            "Welcome to Tasking Manager!",
        )
