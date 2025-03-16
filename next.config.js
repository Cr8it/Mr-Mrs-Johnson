/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ['framer-motion'],
	experimental: {
		optimizeCss: true,
	},
	images: {
		domains: ['i.postimg.cc', 'images.pexels.com'],
	},
}

module.exports = nextConfig