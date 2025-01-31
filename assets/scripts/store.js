//@ts-check

import Store from 'baredux'

import {
  ACCESS_TOKEN_STORAGE_KEY,
  TOCTOCTOC_ACCESS_TOKEN_URL_PARAMETER,
} from './config.js'

/**
 * @typedef {Object} CurrentRepository
 * @property {string} owner
 * @property {string} name
 * @property {string} repositoryURL
 * @property {string} publishedWebsiteURL
 */

/**
 * @typedef {Object} ScribouilliState
 * @property {string} [accessToken]
 * @property {Promise<string> | string} [login]
 * @property {string} [email]
 * @property {Promise<string> | string} [origin]
 * @property {CurrentRepository} currentRepository
 * @property {any} reposByAccount
 * @property {any[]} pages
 * @property {any[]} [articles]
 * @property {any} buildStatus
 * @property {string} basePath
 * @property {{css: string}} theme
 */

/**
 * @template State
 * @typedef {Object} BareduxStore
 * @property {Readonly<State>} state
 * @property {(subscriber: (state: State) => void) => (() => void)} subscribe
 * @property {any} mutations
 */

/** @type { BareduxStore<ScribouilliState> } */
const store = Store({
  state: {
    // @ts-ignore
    accessToken:
      new URL(location.toString()).searchParams.get(
        TOCTOCTOC_ACCESS_TOKEN_URL_PARAMETER,
      ) || localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
    login: undefined,
    email: undefined,
    origin: undefined,
    currentRepository: {
      name: undefined,
      owner: undefined,
      publishedWebsiteURL: undefined,
      repositoryURL: undefined,
    },
    // We use the term "account" to refer to user or organization.
    reposByAccount: {
      // [login: string]: Promise<Repository[]>
    },
    pages: [],
    articles: undefined,
    buildStatus: undefined,
    basePath: location.hostname.endsWith('.github.io') ? '/scribouilli' : '',
    theme: {
      css: undefined,
    },
  },
  mutations: {
    setLogin(state, login) {
      state.login = login
    },
    setEmail(state, email) {
      state.email = email
    },
    setCurrentRepository(state, repository) {
      state.currentRepository = repository
    },
    setPages(state, pages) {
      state.pages = pages.sort((pageA, pageB) => {
        const diffIndex = pageA.index - pageB.index
        if (diffIndex === 0) {
          if (pageA.path < pageB.path) {
            return -1
          }
          if (pageA.path > pageB.path) {
            return 1
          }
          if (pageA.path === pageB.path) {
            return 0
          }
        }
        return diffIndex
      })
    },
    setArticles(state, articles) {
      state.articles = articles?.sort((pageA, pageB) => {
        if (pageA.path < pageB.path) {
          return -1
        }
        if (pageA.path > pageB.path) {
          return 1
        }
        if (pageA.path === pageB.path) {
          return 0
        }
      })
    },
    setBuildStatus(state, buildStatus) {
      state.buildStatus = buildStatus
    },
    /**
     * @param {ScribouilliState} state
     * @param {{ login: string, repos: any[] }} params
     */
    setReposForAccount(state, { login, repos }) {
      state.reposByAccount[login] = repos
        // on place ses propres dépôts avant les dépôts des autres
        .sort((a, b) => {
          if (state.login && typeof state.login === 'string') {
            if (a.owner.login != b.owner.login) {
              if (a.owner.login === state.login) {
                return -1
              } else {
                return 1
              }
            }
          }

          return 0
        })
    },
    setTheme(state, css) {
      state.theme.css = css
    },
    removeSite(state) {
      state.pages = undefined
      state.articles = undefined
      state.siteRepoConfig = undefined
    },
    invalidateToken(state) {
      state.accessToken = undefined
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
      console.log('Token has been invalidated')
    },
  },
})

export default store
