// @ts-check
import bodyParser from "body-parser";
import crypto from "crypto";
import { readFile } from "fs/promises";
import morgan from "morgan";
import polka from "polka";
import sirv from "sirv";
import { compile } from "tempura";
import { repoRoot } from "../utils.js";

const host = "localhost";
const port = 8080;
const baseUri = `http://${host}:${port}`;

const website1Root = (...paths) => repoRoot("src/website1", ...paths);
const templatePath = website1Root("templates/index.html");
const scriptPath = website1Root("public/script.js");

// Useful security header links:
// - https://web.dev/security-headers/
// - https://securityheaders.com/

/** Security headers to apply to all requests */
const commonSecurityHeaders = {
	"X-Content-Type-Options": "nosniff", // Prevent sniffing content type (which can be hacked)
	// "Cross-Origin-Resource-Policy": "same-origin", // allows a resource owner to specify who can load the resource. Here, we allow only our origin load our assets
};

/** Security headers to apply to all document/HTML requests */
const documentSecurityHeaders = (nonce) => ({
	"X-Frame-Options": "DENY", // Prevent other sites from iframing us
	// Useful CSP links:
	// - https://web.dev/strict-csp/
	// - https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
	// - https://www.w3.org/TR/CSP3/#directive-fallback-list
	"Content-Security-Policy":
		`script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'; ` +
		`object-src 'none'; ` +
		`base-uri 'none'; ` +
		`frame-ancestors 'none'; ` +
		`require-trusted-types-for 'script'; ` +
		`block-all-mixed-content; ` +
		// `upgrade-insecure-requests; ` + // when running locally we don't support https
		`report-uri ${baseUri}/report; `,
	// "Cross-Origin-Embedder-Policy": "require-corp", // prevent assets being loaded that do not grant permission to load them via CORS or CORP.
	// "Cross-Origin-Opener-Policy": "", // opt-in to Cross-Origin Isolation in the browser.
	"X-XSS-Protection": "1; mode=block", // Older browser mechanism to prevent XSS
	"Referrer-Policy": "strict-origin-when-cross-origin", // Prevent leaking path/query params to other sites
});

const app = polka();

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/csp-report" }));
app.use(
	sirv(website1Root("public"), {
		dev: true,
		setHeaders(res) {
			for (let name of Object.keys(commonSecurityHeaders)) {
				res.setHeader(name, commonSecurityHeaders[name]);
			}
		},
	})
);

app.get("/", async (req, res) => {
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

	const html = await render({
		nonce: req.query["fail-nonce"] ? "bad-nonce" : nonce,
		scriptIntegrity: req.query["fail-integrity"]
			? `${alg}-bad-integrity`
			: `${alg}-${scriptIntegrity}`,
	});

	res.writeHead(200, "OK", {
		"Content-Type": "text/html",
		"Content-Length": html.length,
		...commonSecurityHeaders,
		...documentSecurityHeaders(nonce),
	});

	res.end(html);
});

app.post("report", (req, res) => {
	console.log("=== REPORT:", JSON.stringify(req.body, null, 2));
	res.writeHead(204, "No Content", {
		...commonSecurityHeaders,
	});

	res.end();
});

app.listen(port, (err) => {
	if (err) throw err;
	console.log(`> Running on localhost:8080`);
});
