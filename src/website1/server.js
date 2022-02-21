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
			// ===============================================
			//
			// TODO: figure out which of these need to be on static resources too
			//
			// ===============================================

			"X-Frame-Options": "DENY", // Prevent other sites from iframing us
			"X-XSS-Protection": "1; mode=block", // Older browser mechanism to prevent XSS
			"X-Content-Type-Options": "nosniff", // Prevent sniffing content type (which can be hacked)
			"Referrer-Policy": "strict-origin-when-cross-origin", // Prevent leaking path/query params to other sites
			"Content-Security-Policy":
				`script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'; ` +
				`object-src 'none'; ` +
				`base-uri 'none'; ` +
				`frame-ancestors 'none'; ` +
				`require-trusted-types-for 'script'; ` +
				`report-uri https://csp.example.com; `, // TODO: Build reporting endpoint
			// "Cross-Origin-Embedder-Policy": "", // prevent assets being loaded that do not grant permission to load them via CORS or CORP.
			// "Cross-Origin-Opener-Policy": "", // opt-in to Cross-Origin Isolation in the browser.
			// "Cross-Origin-Resource-Policy": "", // allows a resource owner to specify who can load the resource.
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
