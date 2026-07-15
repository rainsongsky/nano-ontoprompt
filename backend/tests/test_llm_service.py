from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app.services.llm_service import _call_llm, extract_ontology


def test_dashscope_json_mode_disables_thinking():
    completion = MagicMock()
    completion.choices = [SimpleNamespace(message=SimpleNamespace(content='{"entities": []}'))]
    client = MagicMock()
    client.chat.completions.create.return_value = completion

    with patch("openai.OpenAI", return_value=client):
        _call_llm(
            "compatible", "test-key", "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "deepseek-v4-pro", [{"role": "user", "content": "请返回 JSON"}],
        )

    kwargs = client.chat.completions.create.call_args.kwargs
    assert kwargs["response_format"] == {"type": "json_object"}
    assert kwargs["extra_body"] == {"enable_thinking": False}
    assert kwargs["max_tokens"] == 16384
    assert "seed" not in kwargs


def test_extract_ontology_does_not_retry_bad_request():
    error = Exception("invalid request")
    error.status_code = 400
    with patch("app.services.llm_service._call_llm", side_effect=error) as call_llm:
        with pytest.raises(Exception, match="invalid request"):
            extract_ontology("文档", "请返回 JSON", {}, "deepseek-v4-pro")

    call_llm.assert_called_once()
