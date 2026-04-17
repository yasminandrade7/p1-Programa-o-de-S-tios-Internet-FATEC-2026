'use strict'

const BASE_URL = 'https://rickandmortyapi.com/api/character'

const estado = {
    query: '',
    pagina: 1,
    totalPaginas: 1
}

const gridEl      = document.getElementById('grid')
const statsEl     = document.getElementById('stats')
const erroEl      = document.getElementById('msg-erro')
const paginacaoEl = document.getElementById('paginacao')
const buscaInput  = document.getElementById('busca')

function traduzirStatus (status) {
    const mapa = { Alive: 'Vivo', Dead: 'Morto', unknown: 'Desconhecido' }
    return mapa[status] || status
}

function traduzirGenero (genero) {
    const mapa = { Male: 'Masculino', Female: 'Feminino', Genderless: 'Sem gênero', unknown: 'Desconhecido' }
    return mapa[genero] || genero
}

function classeStatus (status) {
    if (status === 'Alive') return 'dot-alive'
    if (status === 'Dead')  return 'dot-dead'
    return 'dot-unknown'
}

function preencherCards (personagens) {
    const tres = personagens.slice(0, 3)

    tres.forEach((p, i) => {
        document.getElementById(`card-${i}-img`).src              = p.image
        document.getElementById(`card-${i}-img`).alt              = p.name
        document.getElementById(`card-${i}-nome`).textContent     = p.name
        document.getElementById(`card-${i}-status`).textContent   = traduzirStatus(p.status)
        document.getElementById(`card-${i}-meta`).textContent     = `${p.species} — ${traduzirGenero(p.gender)}`
        document.getElementById(`card-${i}-local`).textContent    = `📍 ${p.location.name}`

        const dot = document.getElementById(`card-${i}-dot`)
        dot.className = `dot ${classeStatus(p.status)}`

        const btn = document.getElementById(`card-${i}-btn`)
        btn.onclick = () => abrirModal(p.id)

        document.getElementById(`card-${i}`).style.animationDelay = `${i * 0.05}s`
    })

    gridEl.style.display = 'grid'
}

function montarUrl () {
    const params = new URLSearchParams({ page: estado.pagina })
    if (estado.query) params.set('name', estado.query)
    return `${BASE_URL}?${params}`
}

async function buscarPersonagens () {
    erroEl.style.display    = 'none'
    statsEl.textContent     = ''
    gridEl.style.display    = 'none'
    paginacaoEl.textContent = ''

    const response = await fetch(montarUrl())

    if (response.status === 404) {
        erroEl.textContent   = `Nenhum personagem encontrado para "${estado.query}".`
        erroEl.style.display = 'block'
        return
    }

    if (!response.ok) {
        erroEl.textContent   = `Erro: ${response.status} — ${response.statusText}`
        erroEl.style.display = 'block'
        return
    }

    const data = await response.json()

    estado.totalPaginas = data.info.pages
    statsEl.textContent = `${data.info.count} personagens encontrados — página ${estado.pagina} de ${estado.totalPaginas}`

    preencherCards(data.results)
    renderizarPaginacao()
}

async function buscarComTratamento () {
    try {
        await buscarPersonagens()
    } catch (erro) {
        erroEl.textContent   = `Erro de conexão: ${erro.message}`
        erroEl.style.display = 'block'
        gridEl.style.display = 'none'
        console.error(erro)
    }
}

// ===== PAGINAÇÃO =====
function renderizarPaginacao () {
    const { pagina, totalPaginas } = estado
    if (totalPaginas <= 1) return

    const btnPrev = document.createElement('button')
    btnPrev.textContent = '←'
    btnPrev.disabled    = pagina === 1
    btnPrev.addEventListener('click', () => { estado.pagina--; buscarComTratamento() })

    const info = document.createElement('span')
    info.textContent      = `${pagina} / ${totalPaginas}`
    info.style.fontFamily = 'var(--font-title)'
    info.style.fontWeight = '700'

    const btnNext = document.createElement('button')
    btnNext.textContent = '→'
    btnNext.disabled    = pagina === totalPaginas
    btnNext.addEventListener('click', () => { estado.pagina++; buscarComTratamento() })

    paginacaoEl.appendChild(btnPrev)
    paginacaoEl.appendChild(info)
    paginacaoEl.appendChild(btnNext)
}

// ===== MODAL =====
async function abrirModal (id) {
    document.getElementById('modal-overlay').style.display = 'flex'

    document.getElementById('modal-nome').textContent    = 'Carregando...'
    document.getElementById('modal-img').src             = ''
    document.getElementById('modal-status').textContent  = '—'
    document.getElementById('modal-especie').textContent = '—'
    document.getElementById('modal-genero').textContent  = '—'
    document.getElementById('modal-origem').textContent  = '—'
    document.getElementById('modal-local').textContent   = '—'
    document.getElementById('modal-eps').textContent     = '—'

    try {
        const response = await fetch(`${BASE_URL}/${id}`)
        const p = await response.json()

        document.getElementById('modal-img').src             = p.image
        document.getElementById('modal-img').alt             = p.name
        document.getElementById('modal-nome').textContent    = p.name
        document.getElementById('modal-status').textContent  = traduzirStatus(p.status)
        document.getElementById('modal-especie').textContent = p.species
        document.getElementById('modal-genero').textContent  = traduzirGenero(p.gender)
        document.getElementById('modal-origem').textContent  = p.origin.name
        document.getElementById('modal-local').textContent   = p.location.name
        document.getElementById('modal-eps').textContent     = `${p.episode.length} episódios`

    } catch (erro) {
        document.getElementById('modal-nome').textContent = 'Erro ao carregar.'
        console.error(erro)
    }
}

function fecharModal () {
    document.getElementById('modal-overlay').style.display = 'none'
}

// ===== EVENTOS =====
document.getElementById('btn-buscar').addEventListener('click', () => {
    estado.query  = buscaInput.value.trim()
    estado.pagina = 1
    buscarComTratamento()
})

buscaInput.addEventListener('keydown', ({ key }) => {
    if (key === 'Enter') {
        estado.query  = buscaInput.value.trim()
        estado.pagina = 1
        buscarComTratamento()
    }
})

document.getElementById('modal-fechar').addEventListener('click', fecharModal)

document.getElementById('modal-overlay').addEventListener('click', ({ target }) => {
    if (target.id === 'modal-overlay') fecharModal()
})
