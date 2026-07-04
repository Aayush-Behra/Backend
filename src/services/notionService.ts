import { env } from "../config/env";

/**
 * Thin wrapper around the Notion REST API (kept dependency-free rather than
 * pulling in @notionhq/client, since we only need page create/update).
 * Isolated behind this module so NotionSettings/controllers never build
 * Notion request bodies themselves.
 */
const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function headers(accessToken?: string) {
  return {
    Authorization: `Bearer ${accessToken || env.notionApiKey}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function upsertNotionPage(params: {
  accessToken?: string;
  databaseId: string;
  pageId?: string;
  title: string;
  content: string;
}): Promise<{ pageId: string }> {
  const blocks = chunkContentToBlocks(params.content);

  if (params.pageId) {
    // Existing page: replace content by clearing and re-appending blocks.
    await fetch(`${NOTION_API_BASE}/blocks/${params.pageId}/children`, {
      method: "PATCH",
      headers: headers(params.accessToken),
      body: JSON.stringify({ children: blocks }),
    });
    return { pageId: params.pageId };
  }

  const res = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: headers(params.accessToken),
    body: JSON.stringify({
      parent: { database_id: params.databaseId },
      properties: {
        title: { title: [{ text: { content: params.title } }] },
      },
      children: blocks,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion sync failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return { pageId: data.id };
}

function chunkContentToBlocks(content: string) {
  const plain = content.replace(/<[^>]*>/g, "\n").trim();
  const paragraphs = plain.split(/\n+/).filter(Boolean).slice(0, 100);

  return paragraphs.map((text) => ({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }],
    },
  }));
}
