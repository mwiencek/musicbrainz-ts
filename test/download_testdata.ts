import { resolve } from "https://deno.land/std@0.210.0/path/resolve.ts";
import { toPascalCase } from "https://deno.land/std@0.220.1/text/case.ts";
import type { MBID } from "@/api_types.ts";
import { MusicBrainzClient } from "@/client.ts";
import { EntityType } from "@/data/entity.ts";

/**
 * Generates a TypeScript constant from the result of a MusicBrainz API lookup
 * request which is annotated with its expected type.
 */
export async function fetchTestdata(
  client: MusicBrainzClient,
  entityType: EntityType,
  mbid: MBID,
  includes?: string[],
): Promise<string> {
  const result = await client.lookup(entityType, mbid, includes);
  const identifier = [entityType, mbid, ...(includes ?? [])]
    .join("_")
    .replaceAll(/\W/g, "_");

  return `const _${identifier}: MB.WithIncludes<MB.${
    toPascalCase(entityType)
  }, ${includes?.map((inc) => `"${inc}"`).join(" | ") ?? "never"}> = ${
    JSON.stringify(result, null, 2)
  };\n`;
}

/** Necessary imports for the code which is generated by {@linkcode fetchTestdata}. */
export const testdataImports = 'import type * as MB from "@/api_types.ts";\n';

/** Test cases for MusicBrainz API lookup requests. */
export const lookupTestCases: Array<[EntityType, MBID, string[]?]> = [
  ["recording", "94ed318a-fd7d-4abc-8491-a35e39f51dca"],
];

if (import.meta.main) {
  const outputPath = resolve(import.meta.dirname!, "./data/lookup.ts");
  const output = await Deno.open(outputPath, { write: true });
  const encoder = new TextEncoder();
  await output.write(encoder.encode(testdataImports));

  const client = new MusicBrainzClient();

  for (const testCase of lookupTestCases) {
    const code = await fetchTestdata(client, ...testCase);
    await output.write(encoder.encode(code));
  }

  output.close();
}
