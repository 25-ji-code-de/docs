import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SEKAI Platform',
  description: '25時、コードで。',
  lang: 'zh-CN',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/introduction' },
      { text: 'API', link: '/api/gateway' },
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
            { text: '使用 API 网关', link: '/guide/api-gateway' }
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
      '/projects/': [
        {
          text: '项目',
          items: [
            { text: '项目总览', link: '/projects/overview' },
            { text: 'Nightcord', link: '/projects/nightcord' },
            { text: '25時作業風景', link: '/projects/25ji' },
            { text: 'SEKAI Pass', link: '/projects/sekai-pass' },
            { text: 'Nako AI', link: '/projects/nako' },
            { text: 'Gateway', link: '/projects/gateway' }
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
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 bili_47177171806'
    },

    search: {
      provider: 'local'
    }
  }
})
