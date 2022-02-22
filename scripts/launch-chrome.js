import { launch } from "chrome-launcher";

launch({
	chromeFlags: ["--short-reporting-delay"],
	startingUrl: "https://first-party-test.localhost:8080",
});
