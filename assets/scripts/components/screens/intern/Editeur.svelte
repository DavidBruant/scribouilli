<script>
  //@ts-check
  export let fileP
  export let buildStatus
  export let contenus = []
  export let editionTitle
  export let listPrefix
  export let deleteTitle
  export let showArticles
  export let currentRepository

  import { createEventDispatcher } from 'svelte'
  import marked from 'marked'
  import * as DOMPurify from 'dompurify'
  import Skeleton from '../../Skeleton.svelte'
  import { makeFileNameFromTitle } from '../../../utils'
  import databaseAPI from '../../../databaseAPI'
  import store from '../../../store'

  const imageDirUrl = `https://github.com/${currentRepository.owner}/${currentRepository.name}/tree/main/images`

  let image
  let imageMd = ''

  let preview = ''

  let file = {
    fileName: '',
    content: '',
    previousContent: undefined,
    title: '',
    index: store.state.pages.length + 1,
    previousTitle: undefined,
  }

  fileP.then(_file => {
    file = _file
  })

  let deleteDisabled = true

  let filesPath = contenus.map(contenu => contenu.path)

  const dispatch = createEventDispatcher()

  const validateTitle = e => {
    const titleChanged = file.previousTitle?.trim() !== file.title.trim()
    if (
      titleChanged &&
      filesPath &&
      filesPath.includes(makeFileNameFromTitle(file.title))
    ) {
      e.target.setCustomValidity(
        'Vous avez déjà utilisé ce nom. Veuillez en choisir un autre.',
      )

      return
    }

    e.target.setCustomValidity('')
  }

  const onSubmit = e => {
    e.preventDefault()

    if (e.target.checkValidity()) {
      dispatch('save', {
        fileName: file.fileName,
        content: file.content.trim(),
        previousContent: file.previousContent,
        title: file.title.trim(),
        index: file.index,
        previousTitle: file.previousTitle,
      })
    }
  }

  const onBackClick = e => {
    if (
      file.previousContent.trim() !== file.content.trim() ||
      file.title?.trim() !== file.previousTitle?.trim()
    ) {
      if (
        !confirm(
          'Êtes-vous sûr·e de vouloir revenir en arrière ? Toutes vos modifications seront perdues.',
        )
      ) {
        e.preventDefault()
      }
    }
  }

  const imageSelect = async e => {
    for (const img of image) {
      imageMd = 'Mise en ligne en cours…'
      const buffer = new Uint8Array(await img.arrayBuffer())
      await databaseAPI.writeFile(
        currentRepository.owner,
        currentRepository.name,
        `images/${img.name}`,
        buffer,
        "Ajout d'une image",
        false, //l'image sera push avec le reste de l'article quand celui-ci sera enregistré
      )
      imageMd = `![Texte décrivant l'image](/images/${img.name})`
    }
  }

  $: {
    try {
      const html = marked.parse(file.content)
      preview = DOMPurify.sanitize(html)
    } catch (e) {
      preview =
        'Il y a une erreur dans le Markdown. Veuillez vérifier votre syntaxe.'
    }
  }
</script>

<Skeleton {currentRepository} {buildStatus} {showArticles}>
  <section class="screen">
    <h3>{editionTitle}</h3>

    {#await file}
      <img src="./assets/images/oval.svg" alt="Chargement du contenu" />
    {:then}
      <div class="wrapper">
        <form on:submit={onSubmit}>
          <div>
            <label for="title">Titre</label>
            <input
              bind:value={file.title}
              on:change={validateTitle}
              type="text"
              id="title"
              required
            />
            <p>Attention, si le titre contient un <code>/</code>, <code>?</code>, <code>#</code>, ça peut ne pas marcher.</p>
          </div>

          <div class="accordion aide-editeur">
            <h4 class="label">Aide</h4>
            <details>
              <summary>Mettre en forme le contenu</summary>
              <div>
                <p>
                  Pour mettre en forme votre contenu, vous pouvez bidouiller
                  <a
                    href="https://flus.fr/carnet/markdown.html"
                    target="_blank"
                  >
                    avec du Markdown
                  </a>
                  … ou
                  <a
                    href="https://developer.mozilla.org/fr/docs/Learn/Getting_started_with_the_web/HTML_basics"
                    target="_blank"
                  >
                    apprendre le HTML
                  </a>
                </p>
              </div>
            </details>

            <details>
              <summary>Ajouter une image</summary>
              <div>
                <ol>
                  <li>
                    <label for="image">Sélectionnez votre image :</label>
                    <input
                      accept="image/png, image/jpeg, image/webp, image/gif, image/svg"
                      bind:files={image}
                      id="image"
                      name="image"
                      type="file"
                      on:change={imageSelect}
                    />
                  </li>
                  <li>
                    Insérez la ligne suivante là où vous souhaitez que votre
                    image apparaisse :
                  </li>
                  <figure>
                    {imageMd}
                  </figure>

                  <li>
                    Remplacez le texte entre crochets par une description pour
                    les personnes malvoyantes (il s'affichera si l'image ne
                    charge pas)
                  </li>
                </ol>
              </div>
            </details>
          </div>

          <div class="content">
            <label for="content">Contenu</label>
            <textarea
              bind:value={file.content}
              id="content"
              cols="30"
              rows="10"
            />
          </div>
          {#if preview}
            <div class="preview">
              <h4>Aperçu</h4>
              <div>{@html preview}</div>
            </div>
          {/if}
          <div class="actions-zone">
            <a href={listPrefix} class="btn__retour" on:click={onBackClick}
              >Retour</a
            >
            <button type="submit" class="btn__medium btn"
              >Lancer la publication (~ 2 min)</button
            >
          </div>

          {#if file.fileName && file.fileName !== 'index.md'}
            <div class="wrapper white-zone">
              <h3>{deleteTitle}</h3>
              <label>
                <input
                  type="checkbox"
                  on:change={() => {
                    deleteDisabled = !deleteDisabled
                  }}
                />
                Afficher le bouton de suppression
              </label>
              <button
                type="button"
                on:click={() => dispatch('delete')}
                disabled={deleteDisabled}
                class=" btn__medium btn btn__danger"
              >
                {deleteTitle}
              </button>
            </div>
          {/if}
        </form>
      </div>
    {/await}
  </section>
</Skeleton>

<style lang="scss">
  .accordion {
    margin-top: 3rem;
  }

  .aide-editeur {
    summary {
      margin-bottom: 1.2rem;
    }

    ol {
      list-style: revert;
      padding-left: 2rem;
    }

    li {
      margin-bottom: 1rem;
      label {
        font-weight: normal;
        display: inline;
      }
      input {
        display: inline;
      }
    }
  }

  .content {
    margin-top: 2rem;
  }
  .preview > div {
    margin: 0.5em 0;
    padding: 0.5em;
    background-color: white;
  }

  .actions-zone {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    margin-bottom: 6rem;
    padding-right: 2rem;
    padding-left: 2rem;
  }

  .btn__retour {
    &::before {
      content: '‹';
      margin-right: 0.5rem;
    }
  }

  details {
    figure {
      padding: 0.4rem;
      font-family: monospace;
      background-color: rgba(255, 255, 255, 0.4);
    }
  }
</style>
