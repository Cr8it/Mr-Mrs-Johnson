/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	images: {
		domains: ['localhost'],
	},
	experimental: {
		// Enable if needed for streaming features
		// serverActions: true,
	},
}

module.exports = nextConfig