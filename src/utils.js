import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const repoRoot = (...paths) => join(__dirname, "..", ...paths);
