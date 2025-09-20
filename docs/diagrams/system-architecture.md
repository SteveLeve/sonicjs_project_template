# System Architecture

## High-Level Architecture

```mermaid
graph TB
    %% Client Layer
    Client[fa:fa-desktop Browser Client]
    
    %% Cloudflare Edge Layer
    subgraph "Cloudflare Edge Network"
        CDN[fa:fa-globe CDN/DNS]
        Worker1[fa:fa-cog Astro Frontend Worker<br/>{{ROOT_HOSTNAME}}]
        Worker2[fa:fa-database SonicJS CMS Worker<br/>{{ADMIN_HOSTNAME}}]
    end
    
    %% Storage Layer
    subgraph "Cloudflare Storage"
        D1[(fa:fa-database D1 Database<br/>SQLite)]
        KV[(fa:fa-key KV Store<br/>Content Cache)]
        R2[(fa:fa-cloud R2 Storage<br/>Media Files)]
    end
    
    %% External Services
    subgraph "External"
        GitHub[fa:fa-github GitHub Actions<br/>CI/CD]
        Terraform[fa:fa-sitemap Terraform<br/>Infrastructure]
    end
    
    %% Client Connections
    Client --> CDN
    CDN --> Worker1
    
    %% Worker Connections
    Worker1 --> Worker2
    Worker1 --> KV
    Worker1 --> R2
    Worker2 --> D1
    Worker2 --> KV
    Worker2 --> R2
    
    %% Deployment Connections
    GitHub --> Worker1
    GitHub --> Worker2
    Terraform --> D1
    Terraform --> KV
    Terraform --> R2
    
    %% Styling
    classDef workerClass fill:#ff6b35,stroke:#333,stroke-width:2px,color:#fff
    classDef storageClass fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#fff
    classDef externalClass fill:#95a5a6,stroke:#333,stroke-width:2px,color:#fff
    classDef clientClass fill:#3498db,stroke:#333,stroke-width:2px,color:#fff
    
    class Worker1,Worker2 workerClass
    class D1,KV,R2 storageClass
    class GitHub,Terraform externalClass
    class Client,CDN clientClass
```

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client Browser
    participant CF as Cloudflare CDN
    participant FW as Frontend Worker
    participant CMS as CMS Worker
    participant D1 as D1 Database
    participant KV as KV Cache
    participant R2 as R2 Storage
    
    C->>CF: Request {{ROOT_HOSTNAME}}/blog/post-slug
    CF->>FW: Route to Astro Worker
    
    Note over FW: SSR Page Generation
    FW->>KV: Check cache for post
    
    alt Cache Miss
        FW->>CMS: GET /api/posts/post-slug
        CMS->>D1: Query post data
        D1-->>CMS: Return post content
        CMS-->>FW: JSON response
        FW->>KV: Cache post data (TTL: 1h)
    else Cache Hit
        KV-->>FW: Return cached post
    end
    
    Note over FW: Generate HTML with post data
    FW->>R2: Fetch hero image URL
    R2-->>FW: Return image metadata
    
    FW-->>CF: Complete HTML page
    CF-->>C: Rendered page with cached headers
```

## Content Publishing Flow

```mermaid
flowchart TD
    A[Author writes post] --> B[Save as 'draft']
    B --> C{Editor review?}
    C -->|Yes| D[Status: 'review']
    C -->|No| E[Status: 'published']
    D --> F[Editor approves]
    F --> E
    E --> G[CMS updates D1]
    G --> H[CMS invalidates KV cache]
    H --> I[Content live on site]
    
    %% Styling
    classDef draftClass fill:#f39c12,stroke:#333,stroke-width:2px
    classDef reviewClass fill:#e74c3c,stroke:#333,stroke-width:2px
    classDef publishedClass fill:#27ae60,stroke:#333,stroke-width:2px
    
    class B,A draftClass
    class D,C,F reviewClass
    class E,G,H,I publishedClass
```