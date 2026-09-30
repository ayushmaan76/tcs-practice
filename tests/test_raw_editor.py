import os
import sys

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

def test_raw_editor_configuration_rules():
    """
    CRITICAL ACCEPTANCE TEST:
    Verifies that the strict editor configuration explicitly enforces:
    - autoClosingBrackets: 'never'
    - autoClosingQuotes: 'never'
    - autoClosingOvertype: 'never'
    - quickSuggestions: False
    - snippetSuggestions: 'none'
    - formatOnType: False
    - formatOnPaste: False
    - autoIndent: 'none'
    """
    editor_config_path = os.path.join(os.path.dirname(__file__), "../frontend/src/utils/editorConfig.ts")
    assert os.path.exists(editor_config_path), "editorConfig.ts file must exist"

    with open(editor_config_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Enforce strict raw mode rules
    assert "autoClosingBrackets: 'never'" in content
    assert "autoClosingQuotes: 'never'" in content
    assert "autoClosingOvertype: 'never'" in content
    assert "quickSuggestions: false" in content
    assert "snippetSuggestions: 'none'" in content
    assert "formatOnType: false" in content
    assert "formatOnPaste: false" in content
    assert "autoIndent: 'none'" in content

    print("Strict Raw Editor Configuration Verification PASSED!")

if __name__ == "__main__":
    test_raw_editor_configuration_rules()
