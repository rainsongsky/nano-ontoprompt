import io
import json

from app.services.document_service import convert_document


def test_convert_document_converts_json_to_readable_text(tmp_path):
    source = tmp_path / "orders.json"
    source.write_text(
        json.dumps({"order": {"id": "SO-1001", "customer": "Acme"}}, ensure_ascii=False),
        encoding="utf-8",
    )

    result = convert_document(str(source), "application/json")

    assert result.content == "order.id: SO-1001\norder.customer: Acme"


def test_ontology_file_upload_accepts_json(client, auth_headers, ontology):
    response = client.post(
        f"/api/v1/ontologies/{ontology['id']}/files",
        files={
            "file": (
                "orders.json",
                io.BytesIO(b'{"order":{"id":"SO-1001"}}'),
                "application/json",
            )
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
