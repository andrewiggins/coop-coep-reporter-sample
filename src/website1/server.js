// @ts-check
import crypto from "crypto";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import polka from "polka";
import sirv from "sirv";
import { compile } from "tempura";
import { repoRoot } from "../utils.js";

const website1Root = (...paths) => repoRoot("src/website1", ...paths);
const templatePath = website1Root("templates/index.html");
const scriptPath = website1Root("public/script.js");

polka()
	.use(sirv(website1Root("public"), { dev: true }))
	.get("/", async (req, res) => {
		// Recompile template and integrity on every request to support easy development.
		// In production, compute these once

		const template = await readFile(templatePath, "utf-8");
		const render = compile(template);

		const nonce = crypto.randomUUID();
		const alg = "sha256";
		const scriptIntegrity = crypto
			.createHash(alg)
			.update(await readFile(scriptPath))
			.digest()
			.toString("base64url");

		res.writeHead(200, "OK", {
			"Content-Security-Policy":
				`script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'; ` +
				`object-src 'none'; ` +
				`base-uri 'none'; ` +
				`require-trusted-types-for 'script'; ` +
				`report-uri https://csp.example.com; `,
		});

		res.end(
			render({
				nonce: req.query["fail-nonce"] ? "bad-nonce" : nonce,
				scriptIntegrity: req.query["fail-integrity"]
					? `${alg}-bad-integrity`
					: `${alg}-${scriptIntegrity}`,
			})
		);
	})
	.listen(8080, (err) => {
		if (err) throw err;
		console.log(`> Running on localhost:8080`);
	});
