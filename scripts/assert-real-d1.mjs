const PLACEHOLDER = "__REPLACE_WITH_REAL_D1_UUID__";
const value = process.argv[2] ?? "";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!value || value === PLACEHOLDER || !uuidPattern.test(value)) {
  console.error(
    "Refusing remote D1 operation: wrangler.jsonc does not contain a valid real D1 database UUID."
  );
  process.exit(1);
}

console.log("Real D1 UUID format verified.");
