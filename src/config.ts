import type{ NavItems } from './types'

export const NAV_ITEMS: NavItems = {
    home: {
        path: '/',
        title: 'home'
    },
    blog: {
        path: '/blog',
        title: 'blog'
    },
    tags: {
        path: '/tags',
        title: 'tags'
    },
    about: {
        path: '/about',
        title: 'about'
    }
}

export const SITE = {
    // Your site's detail?
    name: 'Doobries Domain',
    title: 'Doobries Domain',
    description: "David Salter's blog about software development - and rubbish",
    url: 'https://davidsalter.com',
    githubUrl: 'https://github.com/doobrie/dij',
    listDrafts: true
    // description ?
}

export const PAGE_SIZE = 8
