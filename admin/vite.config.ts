import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const resolveVendorChunk = (id: string) => {
	if (!id.includes("/node_modules/")) {
		return undefined;
	}

	if (
		id.includes("/node_modules/@radix-ui/") ||
		id.includes("/node_modules/@floating-ui/")
	) {
		return "vendor-radix";
	}

	if (
		id.includes("/node_modules/@tanstack/")
	) {
		return "vendor-tanstack";
	}

	if (
		id.includes("/node_modules/better-auth/") ||
		id.includes("/node_modules/@better-auth/") ||
		id.includes("/node_modules/@better-fetch/") ||
		id.includes("/node_modules/better-call/") ||
		id.includes("/node_modules/zod/") ||
		id.includes("/node_modules/jose/")
	) {
		return "vendor-auth";
	}

	if (id.includes("/node_modules/katex/")) {
		return "vendor-katex";
	}

	if (id.includes("/node_modules/lucide-react/")) {
		return "vendor-icons";
	}

	return "vendor-misc";
};

export default defineConfig({
	plugins: [
		// Please make sure that '@tanstack/router-plugin' is passed before '@vitejs/plugin-react'
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			tslib: path.resolve(__dirname, "./src/lib/tslib-shim.js"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: resolveVendorChunk,
			},
		},
	},
});
