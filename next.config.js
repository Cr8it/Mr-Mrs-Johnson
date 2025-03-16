/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	images: {
		domains: [
			'localhost',
			'i.postimg.cc',
			'images.pexels.com',
			'hcsplnclxhrimjfuaxtt.supabase.co',
			'hcsplnclxhrimjfuaxtt.supabase.co'
		],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '*.supabase.co',
				port: '',
				pathname: '/**',
			},
		],
	},
	experimental: {
		// Enable if needed for streaming features
		// serverActions: true,
	},
}

module.exports = nextConfig