def clean_json_response(output_text: str) -> str:
    output_text = output_text.strip()

    if output_text.startswith("```json"):
        output_text = output_text[7:]

    if output_text.endswith("```"):
        output_text = output_text[:-3]

    return output_text.strip()
