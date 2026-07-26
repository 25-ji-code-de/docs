import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SEKAI Platform',
  description: '25時、コードで。',
  lang: 'zh-CN',

  // 注：构建时会有几行 "The language 'abnf' is not loaded" 警告 ——
  // SEKAI v2 规范里的形式文法用 ```abnf 标注，shiki 没有内置这个语言，
  // 会回退成纯文本。试过用 markdown.languageAlias 映射到 text/plaintext，
  // 反而会把警告升级成构建**错误**，所以保留警告。构建结果不受影响。

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/introduction' },
      { text: 'API', link: '/api/gateway' },
      { text: '规范', link: '/spec/sekai-v2' },
      { text: '项目', link: '/projects/overview' },
      { text: '法律', link: '/legal/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '架构总览', link: '/guide/architecture' },
            { text: '快速开始', link: '/guide/getting-started' }
          ]
        },
        {
          text: '集成',
          items: [
            { text: 'SEKAI Pass 认证', link: '/guide/sekai-pass' },
            { text: '使用 API 网关', link: '/guide/api-gateway' },
            { text: '前端客户端约定', link: '/guide/client-conventions' },
            { text: '工程约定（跨仓）', link: '/guide/engineering' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'API 网关', link: '/api/gateway' },
            { text: 'SEKAI Pass', link: '/api/sekai-pass' },
            { text: 'Nako AI', link: '/api/nako' }
          ]
        }
      ],
      '/spec/': [
        {
          text: '规范',
          items: [
            { text: 'SEKAI v2 标记规范', link: '/spec/sekai-v2' }
          ]
        }
      ],
      '/projects/': [
        {
          text: '项目',
          items: [
            { text: '项目总览', link: '/projects/overview' },
            { text: 'Nightcord', link: '/projects/nightcord' },
            { text: '25時作業風景', link: '/projects/25ji' },
            { text: 'SEKAI Hub', link: '/projects/hub' },
            { text: 'SEKAI Pass', link: '/projects/sekai-pass' },
            { text: 'Nako AI', link: '/projects/nako' },
            { text: 'Gateway', link: '/projects/gateway' },
            { text: 'Storage Worker', link: '/projects/storage' },
            { text: 'Stickers', link: '/projects/stickers' }
          ]
        }
      ],
      '/legal/': [
        {
          text: '法律文档',
          items: [
            { text: '总览', link: '/legal/' }
          ]
        },
        {
          text: 'SEKAI Pass',
          items: [
            { text: '隐私政策', link: '/legal/complete/privacy-sekai-pass' },
            { text: '用户服务协议', link: '/legal/complete/terms-sekai-pass' }
          ]
        },
        {
          text: 'Nightcord',
          items: [
            { text: '隐私政策', link: '/legal/complete/privacy-nightcord' },
            { text: '用户服务协议', link: '/legal/complete/terms-nightcord' }
          ]
        },
        {
          text: '25時作業風景',
          items: [
            { text: '隐私政策', link: '/legal/complete/privacy-25ji' },
            { text: '用户服务协议', link: '/legal/complete/terms-25ji' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/25-ji-code-de' }
    ],

    footer: {
      message: '各项目许可证以仓库 LICENSE 为准。',
      copyright: 'Copyright © 2026 The 25-ji-code-de Team'
    },

    search: {
      provider: 'local'
    }
  }
})
