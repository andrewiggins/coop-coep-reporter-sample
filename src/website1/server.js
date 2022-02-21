// @ts-check
import crypto from "crypto";
import { readFileSync } from "fs";
import polka from "polka";
import sirv from "sirv";
import { compile } from "tempura";
import { repoRoot } from "../utils.js";

const website1Root = (...paths) => repoRoot("src/website1", ...paths);
const render = compile(
	readFileSync(website1Root("templates/index.html"), "utf-8")
);

polka()
	.use(sirv(website1Root("public"), { dev: true }))
	.get("/", (req, res) => {
		const nonce = crypto.randomUUID();

		res.writeHead(200, "OK", {
			"Content-Security-Policy":
				`script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'; ` +
				`object-src 'none'; ` +
				`base-uri 'none'; ` +
				`require-trusted-types-for 'script'; ` +
				`report-uri https://csp.example.com; `,
		});

		res.end(render({ nonce: req.query["fail-nonce"] ? "bad-nonce" : nonce }));
	})
	.listen(8080, (err) => {
		if (err) throw err;
		console.log(`> Running on localhost:8080`);
	});
