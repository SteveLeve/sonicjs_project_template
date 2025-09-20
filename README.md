# SonicJS Community Website Template

> **🚀 Launch a community website in under 30 minutes**  
> Built with Cloudflare Workers, Astro, SonicJS, and Terraform

A production-ready template for creating community-focused websites that scale globally with Cloudflare's edge network. Perfect for hobby communities, local groups, fan sites, or any niche that needs content management, user submissions, and global performance.

## ✨ Features

### 🌍 **Global Edge Performance**
- Deploy to 300+ Cloudflare edge locations worldwide
- Sub-100ms response times globally
- Automatic scaling from 0 to millions of requests
- Pay-per-request pricing (starts at $0/month)

### 🎯 **Community-Focused**
- Content management system with multi-author support
- User submission system with moderation queue
- Blog posts, spotlights, and custom content types
- No user accounts needed to start (admin-only initially)

### ⚡ **Modern Tech Stack**

- **Frontend & Backend:** [SonicJS](https://sonicjs.com/) - Astro-based Workers-native CMS
- **Framework:** [Astro](https://astro.build/) v4+ with React components
- **Database:** Cloudflare D1 (SQLite-compatible)
- **Storage:** Cloudflare R2 for media files
- **Cache:** Cloudflare KV for ultra-fast reads
- **Infrastructure:** Terraform for reproducible deployments

### 🛠️ **Developer Experience**
- **Domain-configurable:** Works with any domain in minutes
- **Complete tooling:** Scripts for setup, development, and deployment
- **Self-documenting:** Comprehensive guides and architecture docs
- **Local development:** Full stack runs locally with Wrangler
- **CI/CD ready:** GitHub Actions for automated deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- [Terraform](https://www.terraform.io/downloads) 1.6+
- Cloudflare account with your domain added

### 1. Use This Template

```bash
# Create your project from this template
npx degit https://github.com/your-username/sonicjs_project_template my-community-site
cd my-community-site
```

### 2. Configure Your Domain

```bash
# Generate configuration for your domain
node scripts/setup.js yourdomain.com "Your Community Description"
```

This automatically creates:
- ✅ All resource names derived from your domain
- ✅ Terraform configurations
- ✅ Wrangler.toml files with proper bindings
- ✅ Environment configurations

### 3. Deploy Infrastructure

```bash
# Set up Cloudflare resources
cd infra
export TF_VAR_cloudflare_api_token=your_api_token
terraform init
terraform apply -var="account_id=your_account_id" -var="zone_id=your_zone_id"
```

### 4. Deploy Application

```bash
# Deploy the SonicJS app
cd app
npm install
wrangler d1 migrations apply {{DB_NAME}}
npm run deploy
```

### 5. Access Your Site

- **Website:** `https://{{ROOT_HOSTNAME}}`
- **Admin Panel:** `https://{{ROOT_HOSTNAME}}/admin`

## 📖 Documentation

- [**WARP.md**](WARP.md) - Complete developer handbook
- [**Architecture**](docs/diagrams/system-architecture.md) - System design and data flow
- [**Configuration**](docs/configuration.md) - Domain setup and customization
- [**Deployment Guide**](docs/deployment.md) - Production deployment steps
- [**API Reference**](docs/api/) - SonicJS API documentation
- **Architecture Decision Records (ADR):** See `docs/adr/` for design decisions.
  - ADR-0001: [Secrets & Configuration Handling](docs/adr/0001-secrets-handling.md)

## 🏗️ Architecture

```text
┌─────────────┐    ┌──────────────────────────┐    ┌─────────────────┐
│   Browser   │───▶│     SonicJS Worker       │───▶│   D1 Database   │
│             │    │  (Admin UI + Frontend)   │    │   (Content)     │
└─────────────┘    └──────────────────────────┘    └─────────────────┘
                            │                              │
                            ▼                              ▼
                   ┌─────────────────┐            ┌─────────────────┐
                   │   KV (Cache)    │            │   R2 (Media)    │
                   │                 │            │                 │
                   └─────────────────┘            └─────────────────┘
```

**Request Flow:**

1. Browser requests page → SonicJS Worker
2. Worker serves admin UI (at `/admin`) or public pages
3. Content fetched from D1 database or KV cache
4. Media assets served directly from R2
5. Fully rendered page returned to browser

## 🛠️ Development

### Local Development

```bash
# Start SonicJS development server
cd app
npm run dev  # Runs on localhost:8787
```

### Common Tasks

```bash
# View database
wrangler d1 execute {{DB_NAME}} --command "SELECT * FROM posts;"

# Upload media
wrangler r2 object put {{R2_BUCKET}}/image.jpg --file ./image.jpg

# Clear cache
wrangler kv:bulk delete --namespace-id YOUR_KV_ID
```

## 🎨 Customization

### Content Types

Modify `app/src/custom/custom.config.ts` to add custom content types:

```javascript
collections: {
  posts: {
    fields: {
      title: { type: "string", required: true },
      content: { type: "richtext" },
      category: { type: "enum", values: ["tutorial", "showcase", "news"] }
    }
  }
}
```

### Frontend Styling

The SonicJS app uses modern CSS with CSS custom properties. Customize in:

- `app/src/styles/` - Global styles
- `app/src/components/` - Component styles

### Domain Configuration

Change domains anytime with:

```bash
node scripts/generate-config.js newdomain.com
node scripts/substitute-templates.js
```

## 🚀 Deployment

### Manual Deployment

```bash
# Deploy infrastructure
cd infra && terraform apply

# Deploy application
cd app && npm run deploy
```

### Automated CI/CD

Push to `main` branch triggers:

1. Terraform infrastructure updates
2. Application deployment
3. Database migrations
4. Cache invalidation

Required GitHub secrets:

- `CLOUDFLARE_API_TOKEN`
- `CF_ACCOUNT_ID`
- `CF_ZONE_ID`

## 💰 Cost Optimization

This template is designed for cost efficiency:

- **D1 Database:** 25M reads, 100K writes/month free
- **Workers:** 100K requests/day free  
- **KV:** 10M reads, 1M writes/month free
- **R2:** 10GB storage, 1M Class A operations/month free

**Typical costs for small communities:** $0-5/month  
**Medium communities (100K+ visits):** $10-25/month

## 🤝 Contributing

We welcome contributions! Please see:

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Development Guide](docs/development.md)

### Development Setup

```bash
git clone your-fork
cd sonicjs_project_template
npm run setup:dev
```

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙋 Support

- **Documentation:** [WARP.md](WARP.md) for complete developer guide
- **Issues:** [GitHub Issues](../../issues) for bugs and feature requests
- **Discussions:** [GitHub Discussions](../../discussions) for questions and community

## 🎯 Use Cases

Perfect for:
- **Hobby Communities:** Photography, gaming, crafting, collecting
- **Local Groups:** Clubs, meetups, community organizations  
- **Fan Sites:** TV shows, books, music, sports teams
- **Professional Communities:** Industry groups, user groups
- **Educational:** Study groups, research communities

## ⭐ Show Your Support

If this template helps you launch your community site, please:
- ⭐ Star this repository
- 🐦 Share on social media with #SonicJSTemplate
- 💬 Tell us about your site in [Discussions](../../discussions)

---

**Built with ❤️ for the community web**
