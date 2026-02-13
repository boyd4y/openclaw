---
name: feishu-bitable
description: |
  Feishu Bitable (多维表格) read/write operations. Support /base/ and /wiki/ URLs.
---

# Feishu Bitable Tool

6 tools for Bitable operations, supporting both standard Base URLs and Wiki URLs.

## Tools

### 1. Get Meta (Parse URL)

`feishu_bitable_get_meta`

Parse a Bitable URL to get `app_token` and `table_id`. Automatically handles `/wiki/` URLs by resolving the node token to an app token.

**Input:**

```json
{ "url": "https://xxx.feishu.cn/base/bascnABC123?table=tblXYZ" }
```

OR

```json
{ "url": "https://xxx.feishu.cn/wiki/wikcnDEF456?table=tblXYZ" }
```

**Output:**

- `app_token`: The actual token to use for other tools.
- `table_id`: Extracted from `?table=` param.
- `tables`: List of all tables in the base (if `table_id` is missing).

### 2. List Fields

`feishu_bitable_list_fields`

List all columns (fields) in a table with their types.

**Input:**

```json
{
  "app_token": "bascnABC123",
  "table_id": "tblXYZ"
}
```

### 3. List Records

`feishu_bitable_list_records`

List rows (records) with pagination.

**Input:**

```json
{
  "app_token": "bascnABC123",
  "table_id": "tblXYZ",
  "page_size": 20 // optional, default 100
}
```

### 4. Get Record

`feishu_bitable_get_record`

Get a single record by ID.

**Input:**

```json
{
  "app_token": "bascnABC123",
  "table_id": "tblXYZ",
  "record_id": "rec123456"
}
```

### 5. Create Record

`feishu_bitable_create_record`

Create a new row.

**Input:**

```json
{
  "app_token": "bascnABC123",
  "table_id": "tblXYZ",
  "fields": {
    "Name": "New Item",
    "Status": "Active",
    "Count": 10
  }
}
```

### 6. Update Record

`feishu_bitable_update_record`

Update an existing row.

**Input:**

```json
{
  "app_token": "bascnABC123",
  "table_id": "tblXYZ",
  "record_id": "rec123456",
  "fields": {
    "Status": "Completed"
  }
}
```

## Field Formats

- **Text**: `"String value"`
- **Number**: `123` or `12.34`
- **SingleSelect**: `"Option Name"`
- **MultiSelect**: `["Option A", "Option B"]`
- **DateTime**: Timestamp in milliseconds (e.g., `1678888888000`)
- **User**: `[{"id": "ou_xxx"}]`
- **Checkbox**: `true` or `false`
- **Url**: `{"text": "Link Text", "link": "https://example.com"}`
- **Attachment**: _Read-only via API usually, requires file_token to write_

## Permissions

Required scopes:

- `bitable:app` (View/Edit)
- `bitable:app.readonly` (View only)
- `wiki:wiki` (If accessing via Wiki URL)
