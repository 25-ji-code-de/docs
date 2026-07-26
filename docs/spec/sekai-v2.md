---
title: SEKAI v2 标记规范
outline: [2, 3]
---

::: info 规范出处
本页是 **SYS_SEKAI_Standard 0000 v2 Draft 7** 的正式发布位置。此前该文档以 `SYS_SEKA_STD.0000-7.md` 的形式散落在工作区根目录、不受任何仓库版本控制；现已收编至 `docs` 仓，后续修订请直接改本文件。

实现方：`nightcord`（渲染器 + 编辑器）、`storage-worker`（上传后回传 token 模板）、`stickers-maker`（导出 token）。
:::
# SEKAI Ecosystem: Structured Extensible Keywords for Advanced Interactions, Version 2

**SYS_SEKAI_Standard 0000 v2 Draft 7 (0000.v2.d7)**

> Based on Draft 6 with structural revisions, gap analysis, and completeness pass.
>
> Enanan: Amia, Urusai!
>
> Amia: …Read the spec first.

---

## 1. Abstract

This standard defines **SEKAI Version 2**, a structured markup language designed for the Nightcord messaging platform. SEKAI v2 encapsulates rich interaction data — media, formatting, references, and extensible signals — within text-only message channels.

This revision supersedes the BBCode-style Version 1 syntax, resolving conflicts with Markdown, formalizing the resource model, and providing a clear extensibility path.

## 2. Motivation

### 2.1 Issues in SEKAI v1

| Issue | Example | Impact |
|-------|---------|--------|
| **Markdown collision** | `[link:url]` vs Markdown `[text](url)` | Parser ambiguity; impossible to reliably distinguish SEKAI from Markdown links |
| **Positional metadata** | `[file:URL\|Name\|Size]` — which field is which? | Order-dependent, fragile, undocumented without reading renderer source |
| **No nesting** | Cannot combine spoiler + color | Limits expressiveness |
| **No multi-line payload** | Code blocks require escaping newlines | Workarounds defeat readability |
| **Inline URLs** | `[img:https://...]` embeds external URLs directly | Security risk (SSRF, IP leak, hotlinking); no access control |
| **Implicit typing** | `audio` vs `file` are separate types for the same storage | Redundant type space; renderer must special-case |

### 2.2 Design Goals

1. **Unambiguous parsing** — No collision with Markdown or natural language.
2. **Self-describing** — Named key-value metadata instead of positional arguments.
3. **Platform-managed resources** — UUIDs replace raw URLs for uploaded content.
4. **Atomic tokens** — Each token is self-contained; combinatorial formatting via descriptions.
5. **Extensibility** — New types and descriptions can be added without breaking parsers.
6. **Gradual migration** — v1 and v2 can coexist during transition.

### 2.3 Highlights

- `<$SEKAI:...>` prefix eliminates all Markdown conflicts.
- Key-value descriptions (`w=1920;h=1080`) replace fragile positional metadata.
- Multi-line form with `<&SEKAI>` closing tag supports code blocks and long content.
- UUID-based resource model with Cloudflare R2 backend.
- Explicit Markdown coexistence rules — SEKAI handles what Markdown cannot.
- Reserved `Signal` type for future WebRTC signaling over text channels.

---

## 3. Syntax Specification

### 3.1 Single-line Form

```
<$SEKAI:Type:Key1=Value1;Key2=Value2:Payload>
```

Components:

| Component | Required | Description |
|-----------|----------|-------------|
| `<$SEKAI:` | Yes | Opening sentinel. MUST appear literally. |
| `Type` | Yes | Case-sensitive type identifier (`Format`, `Image`, etc.) |
| `:` | Yes | Separator between Type and Descriptions |
| `Key=Value;...` | No | Zero or more semicolon-separated key-value pairs |
| `:` | Yes | Separator between Descriptions and Payload |
| `Payload` | Yes | Type-specific content (may be empty string) |
| `>` | Yes | Closing sentinel |

**When there are no descriptions**, the description field is left empty, resulting in two consecutive colons:

```
<$SEKAI:Stamp::stamp0042>
<$SEKAI:Reply::1719849600000>
```

### 3.2 Multi-line Form

```
<$SEKAI:Type:Key1=Value1;Key2=Value2>
Payload line 1
Payload line 2
...
<&SEKAI>
```

Rules:
- The opening tag ends at `>` (no payload on the opening line).
- The closing tag `<&SEKAI>` MUST appear as the **sole non-whitespace content** of its line.
- All content between the opening tag's line and the closing tag's line constitutes the payload.
- Leading/trailing blank lines in the payload are preserved.

### 3.3 Formal Grammar (ABNF-like)

```abnf
sekai-token     = single-line / multi-line

single-line     = "<$SEKAI:" type ":" descriptions ":" payload ">"
multi-line      = "<$SEKAI:" type ":" descriptions ">" LF
                  payload-body
                  "<&SEKAI>" 

type            = ALPHA *(ALPHA / DIGIT / "-")
                ; PascalCase by convention: "Format", "Image", etc.
                ; "X-" prefix reserved for vendor extensions

descriptions    = "" / desc-pair *(";" desc-pair)
desc-pair       = key "=" value
key             = ALPHA *(ALPHA / DIGIT / "-" / "_")
value           = *pchar
                ; Percent-encoded UTF-8 (RFC 3986 pchar)
                ; Characters ; = : < > MUST be percent-encoded in values

payload         = *( OCTET )          ; single-line: up to closing ">"
payload-body    = *( OCTET / LF )     ; multi-line: up to closing tag line

pchar           = unreserved / pct-encoded
unreserved      = ALPHA / DIGIT / "-" / "." / "_" / "~"
pct-encoded     = "%" HEXDIG HEXDIG
```

### 3.4 Description Value Encoding

Description values use **percent-encoding** (RFC 3986) for special characters:

| Character | Encoded | Reason |
|-----------|---------|--------|
| `;` | `%3B` | Description separator |
| `=` | `%3D` | Key-value separator |
| `:` | `%3A` | Section separator |
| `<` | `%3C` | Tag sentinel |
| `>` | `%3E` | Tag sentinel |
| `%` | `%25` | Escape character itself |
| space | `%20` or `+` | Whitespace |

**Safe characters** (no encoding needed): `A-Z a-z 0-9 - . _ ~ / @ ! $ & ' ( ) * + ,`

Example: A file named `report;final=v2.pdf` →
```
<$SEKAI:Files:name=report%3Bfinal%3Dv2.pdf;type=application/pdf;size=1024:abcd-uuid>
```

### 3.5 Payload Encoding

| Mode | When to Use | How |
|------|-------------|-----|
| **Raw** (default) | Payload contains no ambiguous characters (`>` in single-line, `<&SEKAI>` in multi-line) | Payload is literal UTF-8 text |
| **Base64** | Payload may contain syntax-breaking characters, or binary-safety is needed | Add `enc=base64` to descriptions; payload is standard Base64 (RFC 4648 §4) |

The `enc` description is a **reserved global description** available to all types:

```
<$SEKAI:Format:color=ff5500;spoiler=true;enc=base64:SGVsbG8gV29ybGQ=>
```

Implementations MUST support `enc=base64`. Other encodings MAY be defined in future revisions.

### 3.6 Atomicity Constraint

**SEKAI v2 tokens MUST NOT nest within each other.**

```
✗ ILLEGAL:
<$SEKAI:Format:color=ff0000>
  Text with <$SEKAI:Format:spoiler=true:hidden> inside
<&SEKAI>

✓ LEGAL (combine via descriptions):
<$SEKAI:Format:color=ff0000;spoiler=true;enc=base64:SGlkZGVuIHRleHQ=>
```

Rationale:
- Eliminates parser complexity (no recursive descent needed).
- The closing tag `<&SEKAI>` carries no type identifier; nesting would create ambiguity.
- All desired format combinations can be expressed as multiple descriptions on a single token.

**SEKAI tokens MAY appear adjacent to or surrounded by Markdown formatting and plain text.** They are inline elements within the message text stream.

---

## 4. Type Reference

### 4.0 Reserved Global Descriptions

The following description keys are reserved across all types:

| Key | Type | Default | Meaning |
|-----|------|---------|---------|
| `enc` | string | (none) | Payload encoding. Currently: `base64`. |

### 4.1 `Format`

Applies text formatting that Markdown does not support.

> Markdown handles: **bold**, *italic*, ~~strikethrough~~, `code`, ```code blocks```, > blockquotes, `[links](url)`, auto-linked URLs, line breaks.
>
> Format handles: spoilers, colored text, and future extensions.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `spoiler` | boolean | No | `false` | Cover payload until user interaction reveals it |
| `color` | hex | No | (inherit) | Text color as 3/6/8-char hex (without `#`) |
| `preserve` | boolean | No | `false` | If `true`, skip luminance adjustment (truecolor mode) |
| `enc` | string | **Recommended** | (none) | Payload encoding; `base64` STRONGLY RECOMMENDED for Format |

> [!NOTE]
> `enc=base64` is strongly recommended for Format because the payload is user-generated text that may contain `>`, `<&SEKAI>`, or other syntax-breaking sequences.
>
> **v1 migration note**: `[color:hex|text]` → Format with `color`; `[truecolor:hex|text]` → Format with `color` + `preserve=true`.
> `||spoiler||` in Markdown is NOT part of CommonMark and may conflict with table syntax. Migrate to Format with `spoiler=true`.

#### Payload

The text content to be formatted (Base64 if `enc=base64`).

#### Examples

Colored text:
```
<$SEKAI:Format:color=ff5500;enc=base64:SGVsbG8gV29ybGQ=>
```

Spoiler with truecolor:
```
<$SEKAI:Format:spoiler=true;color=000000;preserve=true;enc=base64:U2VjcmV0IG1lc3NhZ2U=>
```

Plain spoiler:
```
<$SEKAI:Format:spoiler=true;enc=base64:TmFrbyBpcyBhY3R1YWxseSBhIGNhdA==>
```

### 4.2 `Image`

Display a platform-hosted image.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `w` | int | Recommended | (none) | Original image width in pixels |
| `h` | int | Recommended | (none) | Original image height in pixels |
| `name` | string | No | `image` | Original filename (percent-encoded) |
| `alt` | string | No | (none) | Accessibility alt text (percent-encoded) |
| `spoiler` | boolean | No | `false` | Blur image until clicked (sensitive content) |

#### Payload

The resource UUID assigned by the platform upon upload.

#### Resolution

`https://r2.nightcord.de5.net/images/{uuid}` (see §5 Resource Resolution Model).

#### Example

```
<$SEKAI:Image:w=1920;h=1080;name=sunset.jpg:a1b2c3d4-5678-90ab-cdef-1234567890ab>
```

#### Rendering Recommendations

- Use `w` and `h` to **pre-calculate aspect ratio** and reserve layout space before the image loads (eliminates Cumulative Layout Shift).
- If `w > 400` (configurable threshold), render as a large image block; otherwise render inline/compact.
- If `spoiler=true`, apply a CSS blur filter and require user click to reveal.

### 4.3 `Stamp`

Display a sticker/stamp from the platform's sticker library.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `custom` | boolean | No | `false` | If `true`, payload is a user-uploaded sticker UUID instead of a library stamp ID |

> This type typically has NO descriptions — the simple form is the common case.

#### Payload

- **Library stamp**: The stamp name or numeric ID as registered in the sticker service.
  - Resolution: `https://sticker.nightcord.de5.net/stickers/{payload}.png`
- **Custom sticker** (`custom=true`): A resource UUID for a user-uploaded sticker image.
  - Resolution: `https://r2.nightcord.de5.net/stickers/{uuid}`

#### Examples

Library stamp:
```
<$SEKAI:Stamp::stamp0042>
```

Custom uploaded sticker:
```
<$SEKAI:Stamp:custom=true:a1b2c3d4-sticker-uuid>
```

#### Display Mode

When a message contains **only** a single Stamp token and no other text:
- Render as a large standalone sticker (e.g., 128×128 or larger).

Otherwise:
- Render inline at a smaller size (e.g., 24×24) aligned with surrounding text.

#### Backward Compatibility

```
v1: [stamp0042]        →  <$SEKAI:Stamp::stamp0042>
v1: [stamp:0042]       →  <$SEKAI:Stamp::stamp0042>
v1: [stamp_0042]       →  <$SEKAI:Stamp::stamp0042>
v1: [sticker:URL]      →  <$SEKAI:Stamp:custom=true:uuid>  (after re-upload)
```

### 4.4 `Files`

Provide download access and optional inline preview for platform-hosted files.

> This type unifies v1's `file`, `audio`, and `music` types.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `type` | string | **Yes** | `application/octet-stream` | MIME type identifier (RFC 6838) |
| `size` | float | Recommended | (none) | File size in kilobytes (kB) |
| `name` | string | **Yes** | `file` | Original filename (percent-encoded, sanitized by server) |
| `title` | string | No | (none) | Human-readable title (for audio/music display) |
| `artist` | string | No | (none) | Artist/creator name (for audio) |
| `duration` | float | No | (none) | Duration in seconds (for audio/video) |
| `album` | string | No | (none) | Album name (for audio) |

#### Payload

The resource UUID assigned by the platform upon upload.

#### Resolution

`https://r2.nightcord.de5.net/files/{uuid}` (see §5).

#### Examples

Generic file:
```
<$SEKAI:Files:type=application/pdf;size=2048.5;name=report.pdf:file-uuid-here>
```

Audio (simple — renders as compact player):
```
<$SEKAI:Files:type=audio/mpeg;size=3542.7;name=recording.mp3;duration=185.4:audio-uuid>
```

Music (rich — renders as full player with metadata):
```
<$SEKAI:Files:type=audio/flac;name=track.flac;title=Nightcord%20Dreams;artist=25ji;album=SEKAI;duration=247.8;size=28400:music-uuid>
```

#### Rendering Recommendations

The client SHOULD select a rendering mode based on `type` and available descriptions:

| Condition | Recommended Renderer |
|-----------|---------------------|
| `type` starts with `audio/` AND `title` present | Full music player (transport controls, visualizer, metadata display) |
| `type` starts with `audio/` | Compact audio player (play/pause, oscilloscope, progress bar) |
| `type` starts with `image/` | Image preview (consider using Image type instead) |
| `type` starts with `video/` | Video player (future) |
| Otherwise | File download card (icon, name, size, download button) |

File icon selection SHOULD be based on MIME `type` rather than filename extension:

| MIME Pattern | Icon |
|---|---|
| `audio/*` | 🎵 Music note |
| `image/*` | 🖼️ Picture frame |
| `application/pdf` | 📄 Document |
| `application/zip`, `application/x-*-compressed` | 📦 Archive |
| `text/*`, `application/json`, `application/javascript` | 💻 Code brackets |
| Default | 📎 Generic file |

### 4.5 `Reply`

Reference a previous message for contextual threading.

> **Single-line form only.** This type has no descriptions.

#### Descriptions

None.

#### Payload

The **timestamp** (Unix milliseconds, integer) of the referenced message.

#### Example

```
<$SEKAI:Reply::1719849600000>
```

#### Client Behavior

1. On render, the client SHOULD look up the referenced message by timestamp in the local message store.
2. If found, display a reply chip showing:
   - The original sender's name
   - A truncated preview of the original message (first ~50 characters)
   - A visual indicator (reply icon, accent line)
3. If not found (message not in local history), display a generic "Reply to message" chip.
4. On click, emit a navigation event to scroll to the referenced message.

> **v1 migration note**: v1 carried an optional `preview` text in metadata (`[re:timestamp|preview]`). In v2, preview text is **derived client-side** from message history. This avoids stale/inconsistent previews when the original message is edited or deleted.

### 4.6 `Embed`

Display a rich link preview card.

> **New in v2.** Replaces v1's `[link:URL|Title|Desc]`.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `title` | string | No | (extracted from URL) | Page title |
| `desc` | string | No | (none) | Page description or summary |
| `domain` | string | No | (extracted from URL) | Display domain |
| `thumb` | string | No | (none) | Thumbnail image UUID or URL |
| `color` | hex | No | (none) | Accent color for the embed card |

#### Payload

The target URL (full, including scheme).

#### Example

```
<$SEKAI:Embed:title=Project%20SEKAI;desc=A%20rhythm%20game;domain=pjsekai.sega.jp:https://pjsekai.sega.jp>
```

#### Metadata Source

Embed descriptions are typically **populated server-side** at message send time:

1. Client sends a message containing a URL.
2. Server fetches the URL, extracts OpenGraph/meta tags.
3. Server rewrites the URL as a `<$SEKAI:Embed:...>` token with extracted metadata.
4. Client renders the card using the provided descriptions without needing to fetch the URL itself.

If the server cannot fetch metadata, the token MAY be sent with only the URL (no descriptions), and the client renders a minimal link card.

### 4.7 `Mention`

Reference a user, role, or AI persona within the message.

> **New in v2.** Enables structured @-mentions with semantic typing.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `type` | string | **Yes** | `user` | Mention type: `user`, `role`, `ai`, `all` |
| `display` | string | No | (none) | Override display name (percent-encoded) |

#### Payload

- `type=user`: User ID
- `type=role`: Role/group ID
- `type=ai`: AI persona name (`Nako`, `Asagi`, `Miku`, etc.)
- `type=all`: Empty or `everyone`

#### Examples

```
<$SEKAI:Mention:type=user;display=Enanan:user-uuid-12345>
<$SEKAI:Mention:type=ai:Nako>
<$SEKAI:Mention:type=all:everyone>
```

#### Rendering Recommendations

- Render as a highlighted, non-editable inline chip with a distinct background color.
- `type=ai` mentions SHOULD use the AI persona's theme color.
- `type=all` mentions SHOULD be visually emphasized (bold, distinct color) to indicate broadcast.
- On click, `type=user` should open the user's profile card.

### 4.8 `Code`

Display a code block with syntax metadata.

> **Optional type.** Markdown fenced code blocks (` ``` `) are preferred for simple cases. The SEKAI `Code` type provides additional metadata that Markdown cannot express.

#### Descriptions

| Key | Type | Required | Default | Meaning |
|-----|------|----------|---------|---------|
| `lang` | string | No | `plain` | Language identifier for syntax highlighting |
| `name` | string | No | (none) | Source filename |
| `lines` | string | No | (none) | Highlighted line numbers (e.g., `1,3-5,12`) |
| `collapse` | boolean | No | `false` | Render collapsed by default (expandable) |

#### Payload

The code content. Multi-line form is typical; `enc=base64` is NOT recommended (code should be human-readable in transport).

#### Example

```
<$SEKAI:Code:lang=python;name=hello.py;lines=2>
def greet():
    print("Hello, SEKAI!")  # This line is highlighted

greet()
<&SEKAI>
```

#### When to Use SEKAI Code vs Markdown

| Feature | Markdown ` ``` ` | SEKAI `Code` |
|---------|------------------|--------------|
| Language hint | ✅ ` ```python ` | ✅ `lang=python` |
| Filename display | ❌ | ✅ `name=hello.py` |
| Line highlighting | ❌ | ✅ `lines=1,3-5` |
| Collapsible | ❌ | ✅ `collapse=true` |
| Human-readable in raw form | ✅ Better | ⚠️ Slightly more verbose |

### 4.9 Reserved: `Signal`

> **Reserved for future use.** Not yet specified. DO NOT implement.
>
> *It can transfer WebRTC Signaling maybe?* — Draft 6 Preface

The `Signal` type is reserved for potential future use as a structured container for real-time communication signaling (e.g., WebRTC SDP offers/answers, ICE candidates) over the existing text message channel.

Potential structure (speculative):
```
<$SEKAI:Signal:action=offer;session=abc123;enc=base64>
...base64-encoded SDP...
<&SEKAI>
```

This would allow Nightcord to establish peer-to-peer voice/video calls without a dedicated signaling server, using the chat transport as the signaling channel.

**This type will be fully specified in a future revision.**

### 4.10 Vendor Extensions

Types prefixed with `X-` are reserved for non-standard, application-specific extensions:

```
<$SEKAI:X-Poll:options=3;multi=true;enc=base64:...>
<$SEKAI:X-Location:lat=35.6762;lon=139.6503:Tokyo>
<$SEKAI:X-Dice:faces=20:>
```

Rules for vendor extensions:
- Parsers that encounter an unknown `X-` type MUST NOT error; they SHOULD render the raw token or a placeholder.
- Vendor extensions MUST NOT redefine the behavior of standard types.
- If a vendor extension proves broadly useful, it MAY be promoted to a standard type in a future revision (dropping the `X-` prefix).

---

## 5. Resource Resolution Model

### 5.1 Resource Tiers

SEKAI v2 uses a three-tier resource model:

```
┌──────────────────────────────────────────────────────────────────┐
│ Tier 1: Platform-Managed (UUID-based)                           │
│   Image, Files payloads → Cloudflare R2 object storage          │
│   Upload: Client → API → R2 → UUID returned                    │
│   Access: UUID → signed URL or CDN path                         │
├──────────────────────────────────────────────────────────────────┤
│ Tier 2: Static Library (Name-based)                             │
│   Stamp payloads (library) → Sticker CDN                        │
│   Access: name → https://sticker.nightcord.de5.net/stickers/    │
├──────────────────────────────────────────────────────────────────┤
│ Tier 3: External (URL-based)                                    │
│   Embed payloads → Direct external URLs                         │
│   Access: URL as-is (client or server fetches)                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 UUID Resolution

Platform-managed resources (Tier 1) are resolved through the resource API:

**URL Templates** (configured per deployment):

```
Images:   https://r2.nightcord.de5.net/images/{uuid}
Files:    https://r2.nightcord.de5.net/files/{uuid}  
Stickers: https://r2.nightcord.de5.net/stickers/{uuid}  (custom=true only)
```

**Signed URL Flow** (for access-controlled resources):

```
Client                    API Server              R2
  │                          │                     │
  ├── GET /api/resource/{uuid} ──→                 │
  │                          ├── Generate signed URL ─→
  │                          │                     │
  │  ←── 302 Redirect ──────┤                     │
  │       (signed URL,       │                     │
  │        expires in 1h)    │                     │
  ├──────────────────────────────── GET signed URL ─→
  │  ←──────────────────────────── 200 + Content ──┤
```

Implementations MAY use direct CDN URLs without signing for public content (e.g., stamps).

### 5.3 Upload Flow

When a user attaches a file or image:

```
Client                         API Server                    R2
  │                               │                           │
  ├── POST /api/upload            │                           │
  │   Body: multipart/form-data   │                           │
  │   (file content)              │                           │
  │                               ├── Validate & sanitize     │
  │                               ├── Extract metadata:       │
  │                               │   • MIME type (magic bytes)│
  │                               │   • File size              │
  │                               │   • Image: w, h            │
  │                               │   • Audio: duration         │
  │                               │   • Sanitize filename       │
  │                               │                           │
  │                               ├── PUT object ────────────→│
  │                               │   Key: {uuid}             │
  │                               │                           │
  │  ←── 200 JSON ───────────────┤                           │
  │   {                           │                           │
  │     uuid: "abcd-1234-...",    │                           │
  │     type: "image/jpeg",       │                           │
  │     size: 2048.5,             │                           │
  │     name: "photo.jpg",        │                           │
  │     w: 1920,                  │                           │
  │     h: 1080                   │                           │
  │   }                           │                           │
  │                               │                           │
  ├── Client constructs SEKAI v2 token from response:         │
  │   <$SEKAI:Image:w=1920;h=1080;name=photo.jpg:abcd-1234-...>
```

The API server is the **single source of truth** for metadata. Clients MUST use server-provided MIME type and dimensions rather than client-side detection.

---

## 6. Coexistence with Markdown

### 6.1 Processing Order

Message text is processed in two passes:

```
Pass 1: SEKAI Tokenization
   Input: raw message text
   Output: array of { text_segment | sekai_token }

Pass 2: Markdown Rendering (on text segments only)
   Each text_segment is processed through a Markdown parser.
   SEKAI tokens are rendered by the SEKAI renderer.
   Results are interleaved into a single DOM fragment.
```

**SEKAI tokenization happens FIRST.** This ensures that SEKAI syntax within Markdown-formatted regions is correctly extracted, and that Markdown processing does not corrupt SEKAI tokens.

### 6.2 Responsibility Matrix

| Feature | Owner | Syntax |
|---------|-------|--------|
| Bold | Markdown | `**text**` |
| Italic | Markdown | `*text*` |
| Strikethrough | Markdown | `~~text~~` |
| Inline code | Markdown | `` `code` `` |
| Code block | Markdown (simple) or SEKAI `Code` (rich) | ` ``` ` or `<$SEKAI:Code:...>` |
| Blockquote | Markdown | `> text` |
| Links (bare URL) | Markdown (auto-link) | `https://...` |
| Links (rich preview) | SEKAI `Embed` | `<$SEKAI:Embed:...>` |
| Spoiler | SEKAI `Format` | `<$SEKAI:Format:spoiler=true:...>` |
| Colored text | SEKAI `Format` | `<$SEKAI:Format:color=hex:...>` |
| Images | SEKAI `Image` | `<$SEKAI:Image:...:uuid>` |
| Files / Audio | SEKAI `Files` | `<$SEKAI:Files:...:uuid>` |
| Stickers | SEKAI `Stamp` | `<$SEKAI:Stamp::id>` |
| Reply | SEKAI `Reply` | `<$SEKAI:Reply::ts>` |
| Mentions | SEKAI `Mention` | `<$SEKAI:Mention:...:id>` |
| Line break | Markdown | `\n` → `<br>` |

### 6.3 Edge Cases

**SEKAI inside Markdown formatting:**
```
This is **bold with <$SEKAI:Stamp::stamp0042> inside** it.
```
Processing: SEKAI tokenizer extracts the Stamp; Markdown processes the surrounding text as bold. Renderer interleaves: `<strong>bold with </strong><img stamp/><strong> inside</strong>`.

**Markdown inside SEKAI payload:**
```
<$SEKAI:Format:spoiler=true;enc=base64:Kipib2xkKio=>
```
Decoded payload: `**bold**`. The client MAY apply Markdown rendering to decoded Format payloads. This is implementation-defined; for simplicity, the initial implementation MAY render payloads as plain text.

---

## 7. Backward Compatibility

### 7.1 v1 → v2 Translation Table

| v1 Syntax | v2 Equivalent |
|-----------|---------------|
| `[stamp:0042]` / `[stamp0042]` | `<$SEKAI:Stamp::stamp0042>` |
| `[sticker:URL]` | `<$SEKAI:Stamp:custom=true:uuid>` *(requires re-upload)* |
| `[img:URL\|Alt]` | `<$SEKAI:Image:alt=Alt:uuid>` *(requires re-upload)* |
| `[file:URL\|Name\|Size]` | `<$SEKAI:Files:name=Name;size=Size;type=...:uuid>` |
| `[audio:URL\|Duration]` | `<$SEKAI:Files:type=audio/...;duration=Duration:uuid>` |
| `[music:URL\|Title\|Artist\|Dur]` | `<$SEKAI:Files:type=audio/...;title=Title;artist=Artist;duration=Dur:uuid>` |
| `[link:URL\|Title\|Desc]` | `<$SEKAI:Embed:title=Title;desc=Desc:URL>` |
| `[color:hex\|text]` | `<$SEKAI:Format:color=hex;enc=base64:B64(text)>` |
| `[truecolor:hex\|text]` | `<$SEKAI:Format:color=hex;preserve=true;enc=base64:B64(text)>` |
| `[re:ts\|preview]` | `<$SEKAI:Reply::ts>` *(preview dropped; client-derived)* |
| `[code:lang\|content]` | `<$SEKAI:Code:lang=lang>content<&SEKAI>` |
| `\|\|spoiler\|\|` | `<$SEKAI:Format:spoiler=true;enc=base64:B64(text)>` |

### 7.2 Dual-Parser Migration Strategy

During the transition period, clients MUST support both v1 and v2:

```
function parseMessage(text) {
    // 1. Try SEKAI v2 tokenization (look for <$SEKAI: prefix)
    const v2Tokens = tokenizeV2(text);
    
    // 2. For remaining text segments, try SEKAI v1 tokenization
    //    (look for [type:data] patterns)
    v2Tokens.textSegments.forEach(segment => {
        const v1Tokens = tokenizeV1(segment);
        // Merge results
    });
    
    // 3. Apply Markdown to final text segments
}
```

**Server-side migration**: The server MAY transparently rewrite stored v1 tokens to v2 format during a migration window. For `img`, `file`, `audio`, `music` types, this requires re-uploading external URLs to R2 and replacing them with UUIDs.

**Version detection**: The presence of `<$SEKAI:` in a message indicates v2 tokens. The presence of `[type:data]` without `<$SEKAI:` indicates v1 tokens. Both may coexist in a single message during migration.

---

## 8. Security Considerations

### 8.1 Input Validation

| Layer | Responsibility |
|-------|---------------|
| **Server (upload)** | Validate MIME type via magic bytes (not extension); sanitize filenames; enforce size limits; strip EXIF GPS data from images |
| **Server (send)** | Validate SEKAI token structure; reject malformed tokens; verify referenced UUIDs exist and are accessible to the sender |
| **Client (render)** | Sanitize rendered HTML via DOMPurify; validate `color` hex values; validate URLs in Embed payloads against allowlist |

### 8.2 XSS Prevention

- Format payloads, when decoded from Base64, MUST be HTML-escaped before insertion into the DOM.
- Description values, when decoded from percent-encoding, MUST be HTML-escaped.
- DOMPurify (or equivalent) SHOULD be applied to the final rendered output.
- The `onclick` attribute pattern used in v1 for spoilers SHOULD be replaced with event delegation in v2 renderers.

### 8.3 Resource Security

- **No external URLs in Tier 1 resources.** Images and files are always platform-hosted. This prevents:
  - SSRF attacks (server fetching malicious internal URLs)
  - IP address leakage via tracking pixels
  - Content replacement attacks (attacker changes content at URL after sending)
- **Signed URLs** for R2 resources prevent unauthorized access and hotlinking.
- **Embed URLs** (Tier 3) are the only external URLs. Server-side metadata extraction SHOULD use a sandboxed fetcher with timeout, size limit, and DNS rebinding protection.

### 8.4 Denial of Service

- Clients SHOULD enforce a maximum token count per message (recommended: 50).
- Clients SHOULD enforce maximum payload size (recommended: 64KB per token).
- Audio/image lazy loading prevents resource exhaustion from messages with many media tokens.

---

## 9. Rendering Recommendations

### 9.1 Layout Stability

- Use `Image` descriptions `w` and `h` to calculate aspect ratio and reserve space with CSS `aspect-ratio` or padding-bottom hack **before** the image loads.
- Use `Files` description `duration` to render audio player progress bar at correct scale without waiting for metadata load.

### 9.2 Accessibility

- All `Image` tokens SHOULD render with `alt` text (from `alt` or `name` description).
- Audio players MUST have `aria-label` attributes on control buttons.
- `Format` spoilers MUST be keyboard-accessible (`tabindex`, `Enter`/`Space` to reveal).
- `Mention` tokens SHOULD use `role="link"` and appropriate ARIA attributes.
- Color contrast: `Format` with `color` and without `preserve=true` SHOULD apply luminance adjustment to ensure WCAG AA contrast ratio (4.5:1) against the application's background color.

### 9.3 Performance

- Use `DocumentFragment` for batch DOM insertion.
- Implement token parse result caching (LRU, recommended max: 100 entries).
- Lazy-load images (`loading="lazy"`).
- Share a single `AudioContext` instance across all audio players.
- Throttle audio visualizer DOM updates to ≤60fps.
- For message lists >50 items, use `requestIdleCallback` for non-blocking rendering.

---

## 10. Error Handling

### 10.1 Malformed Tokens

If a parser encounters a `<$SEKAI:` prefix but cannot parse a valid token (missing closing `>`, invalid type, etc.):

- The parser MUST NOT crash or throw.
- The parser SHOULD treat the entire unparseable sequence as plain text.
- The parser MAY log a warning for debugging.

### 10.2 Unknown Types

If a parser encounters a valid token structure with an unknown type:

- Standard types (no `X-` prefix): Render the raw token text as-is. This allows forward compatibility — old clients display the raw markup for new types they don't understand.
- Vendor extensions (`X-` prefix): Same behavior — render raw or display a placeholder.

### 10.3 Resource Load Failures

- `Image`: Display an error placeholder with the `name` description as fallback text.
- `Stamp`: Display `[stamp:{payload}]` as plain text.
- `Files`: Display the file card with name and size, but disable the download action and show an error state.
- `Embed`: Display a minimal link (underlined URL text) without the preview card.

---

## Appendix A: Complete Message Examples

### A.1 Simple text with stamp

```
Hey! Look at this <$SEKAI:Stamp::stamp0042> isn't it cute?
```

### A.2 Rich message with multiple token types

```
<$SEKAI:Reply::1719849600000>
<$SEKAI:Mention:type=user;display=Enanan:user-001> Check out this photo from today:
<$SEKAI:Image:w=3024;h=4032;name=cafe.jpg;alt=A%20cozy%20cafe%20in%20Shibuya:img-uuid-5678>
The music there was amazing <$SEKAI:Stamp::stamp0003>
```

### A.3 File sharing with audio

```
Here's the recording from yesterday's session:
<$SEKAI:Files:type=audio/flac;name=session_240601.flac;title=Late%20Night%20Session;artist=Nightcord;duration=1847.3;size=98200:audio-uuid-9012>
```

### A.4 Formatted text

```
This is normal text, and <$SEKAI:Format:color=ff5500;enc=base64:dGhpcyBpcyBvcmFuZ2U=> and <$SEKAI:Format:spoiler=true;enc=base64:dGhpcyBpcyBhIHNwb2lsZXI=>.
```

### A.5 Code block

```
I fixed the bug in the parser:
<$SEKAI:Code:lang=javascript;name=tokenizer.js;lines=3>
function tokenize(text) {
    const regex = /<\$SEKAI:(\w+):([^>]*?):(.*?)>/g;
    let match;  // This line was missing
    const tokens = [];
    while ((match = regex.exec(text)) !== null) {
        tokens.push({ type: match[1], desc: match[2], payload: match[3] });
    }
    return tokens;
}
<&SEKAI>
```

### A.6 Embed (link preview)

```
Have you seen this? <$SEKAI:Embed:title=Nightcord%20%E2%80%93%20Home;desc=A%20modern%20chat%20platform;domain=nightcord.de5.net;color=7c6fac:https://nightcord.de5.net>
```

---

## Appendix B: MIME Category Quick Reference for `Files`

| Category | MIME Patterns | Renderer Hint |
|----------|---------------|---------------|
| Audio | `audio/mpeg`, `audio/ogg`, `audio/flac`, `audio/wav`, `audio/aac`, `audio/mp4` | Audio player (compact or full) |
| Image | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml` | Inline preview (prefer `Image` type) |
| Video | `video/mp4`, `video/webm`, `video/ogg` | Video player (future) |
| Document | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-*` | Document preview (future) |
| Archive | `application/zip`, `application/x-rar-compressed`, `application/gzip`, `application/x-7z-compressed` | File card with size |
| Code/Text | `text/plain`, `text/html`, `text/csv`, `application/json`, `application/javascript` | File card, optional inline preview |
| Binary | `application/octet-stream`, everything else | Generic file card |

---

## Appendix C: Description Type Reference

| Type Name | Format | Examples | Validation |
|-----------|--------|----------|------------|
| `boolean` | `true` \| `false` (case-insensitive) | `spoiler=true`, `custom=false` | Reject other values |
| `hex` | `[0-9A-Fa-f]{3,8}` (without `#`) | `color=ff5500`, `color=f50` | 3, 6, or 8 hex chars |
| `int` | `[0-9]+` | `w=1920`, `h=1080` | Non-negative integer |
| `float` | `[0-9]+(\.[0-9]+)?` | `size=2048.5`, `duration=185.4` | Non-negative decimal |
| `string` | Percent-encoded UTF-8 | `name=hello%20world.txt` | Decode, then sanitize |

---

## Changelog from Draft 6

| Change | Rationale |
|--------|-----------|
| Added `preserve` description to Format | Restores v1 `truecolor` distinction without a separate type |
| Added `enc` global description | Formalizes payload encoding; makes Base64 opt-in per token |
| Added `Embed` type | Covers v1 `[link:...]` functionality |
| Added `Mention` type | Structured @-mentions with user/role/AI typing |
| Added `Code` type | Rich code blocks beyond Markdown capability |
| Added vendor extension mechanism (`X-` prefix) | Future extensibility without spec revision |
| Defined description value encoding (percent-encoding) | Handles special characters in filenames and metadata |
| Defined multi-line closing tag rules | Prevents ambiguity with payload content |
| Defined atomicity constraint (no nesting) | Simplifies parser, avoids closing tag ambiguity |
| Defined three-tier resource resolution model | Formalizes UUID→URL mapping |
| Defined upload flow and server responsibilities | Clarifies metadata source of truth |
| Defined Markdown coexistence rules | Eliminates responsibility overlap |
| Defined backward compatibility strategy | Enables gradual migration from v1 |
| Defined error handling rules | Ensures graceful degradation |
| Added `spoiler` description to Image | Sensitive content blurring |
| Added `title`, `artist`, `album`, `duration` to Files | Unifies v1 `music` into `Files` with rich metadata |
| Added `custom` flag to Stamp | Unifies v1 `sticker` (custom) into Stamp |
| Removed preview from Reply | Preview is now client-derived from message history |
| Reserved `Signal` type | Placeholder for future WebRTC signaling |
| Fixed typos: MINE→MIME, Santized→Sanitized, Avaliable→Available | — |