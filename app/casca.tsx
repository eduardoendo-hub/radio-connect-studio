'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Radio, CalendarDays, MessageSquare, Zap, Gift, Megaphone,
  BarChart3, Settings, LogOut, Menu, X,
} from 'lucide-react'
import { chamar, lerOperador, sair, type Operador } from '../lib/api'
import { MarcaPulso, AssinaturaStudio, PoweredByTechNow, type RitmoPulso } from './marca'
import Image from 'next/image'

/**
 * A casca do Studio.
 *
 * Até aqui cada tela era uma página solta com o próprio cabeçalho. Isso funcionava
 * enquanto existiam duas telas; não funciona mais. O Studio é o sistema operacional da
 * rádio digital — o produtor passa o turno inteiro dentro dele, alternando entre operar
 * o ao vivo e responder o ouvinte no chat. Essa alternância precisa custar um clique e
 * não pode fazer ele perder o lugar.
 *
 * Por isso o menu é **persistente e sempre à esquerda**, com o estado da operação
 * visível de qualquer tela: o item Ao Vivo carrega o pulso vermelho, e o Chat carrega o
 * número de conversas esperando resposta. Quem está no Chat não deixa de saber que um
 * Momento está no ar; quem está no Ao Vivo não deixa de saber que tem ouvinte esperando.
 *
 * O menu mostra também o que ainda não existe, marcado como "em breve". É deliberado:
 * a rádio precisa enxergar o tamanho do produto que está contratando, e o produtor
 * precisa saber que aquilo não sumiu — só ainda não chegou.
 */

type ItemMenu = {
  href: string
  rotulo: string
  icone: React.ReactNode
  emBreve?: boolean
  /** Resolvido em tempo de execução: o Ao Vivo aponta para a edição do momento. */
  dinamico?: 'ao-vivo'
}

const GRUPOS: { titulo: string | null; itens: ItemMenu[] }[] = [
  {
    titulo: null,
    itens: [
      { href: '/ao-vivo', rotulo: 'Ao Vivo', icone: <Radio size={17} />, dinamico: 'ao-vivo' },
      { href: '/hoje', rotulo: 'Hoje', icone: <CalendarDays size={17} /> },
      { href: '/chat', rotulo: 'Chat', icone: <MessageSquare size={17} /> },
    ],
  },
  {
    titulo: 'Conteúdo',
    itens: [
      { href: '/momentos', rotulo: 'Momentos', icone: <Zap size={17} />, emBreve: true },
      { href: '/promocoes', rotulo: 'Promoções', icone: <Gift size={17} />, emBreve: true },
    ],
  },
  {
    titulo: 'Negócio',
    itens: [
      { href: '/midia', rotulo: 'Mídia', icone: <Megaphone size={17} />, emBreve: true },
      { href: '/audiencia', rotulo: 'Audiência', icone: <BarChart3 size={17} />, emBreve: true },
    ],
  },
  {
    titulo: null,
    itens: [{ href: '/ajustes', rotulo: 'Ajustes', icone: <Settings size={17} />, emBreve: true }],
  },
]

type EstadoDaCasa = { aoVivoId: string | null; naoLidas: number }

export function CascaStudio({
  children,
  ritmo,
}: {
  children: React.ReactNode
  /** A tela informa o batimento quando sabe mais que a casca — ex.: Momento ativo. */
  ritmo?: RitmoPulso
}) {
  const caminho = usePathname()
  const [operador, setOperador] = useState<Operador | null>(null)
  const [estado, setEstado] = useState<EstadoDaCasa>({ aoVivoId: null, naoLidas: 0 })
  const [aberto, setAberto] = useState(false)

  useEffect(() => setOperador(lerOperador()), [])

  // A casca sabe o estado da casa em qualquer tela. É isso que faz o pulso vermelho
  // aparecer no menu enquanto o produtor está respondendo o chat.
  useEffect(() => {
    let vivo = true
    const buscar = () =>
      chamar<{ aoVivoId: string | null; naoLidas?: number }>('/studio/hoje')
        .then((d) => vivo && setEstado({ aoVivoId: d.aoVivoId, naoLidas: d.naoLidas ?? 0 }))
        .catch(() => {})
    buscar()
    const t = setInterval(buscar, 20000)
    return () => { vivo = false; clearInterval(t) }
  }, [])

  // Trocar de tela fecha o menu no celular — senão ele fica por cima do conteúdo.
  useEffect(() => setAberto(false), [caminho])

  const batimento: RitmoPulso = ritmo ?? (estado.aoVivoId ? 'no-ar' : 'fora-do-ar')

  function destino(i: ItemMenu) {
    if (i.dinamico === 'ao-vivo') return estado.aoVivoId ? `/ao-vivo/${estado.aoVivoId}` : '/hoje'
    return i.href
  }

  function ativo(i: ItemMenu) {
    if (i.dinamico === 'ao-vivo') return caminho.startsWith('/ao-vivo')
    return caminho === i.href || caminho.startsWith(i.href + '/')
  }

  return (
    <div className="casca">
      {/* Barra do celular: só a marca e o botão de menu. */}
      <div className="casca-topo-movel">
        <button className="casca-menu-btn" onClick={() => setAberto(true)} aria-label="Abrir menu">
          <Menu size={20} />
        </button>
        <MarcaPulso tamanho={24} ritmo={batimento} />
        <AssinaturaStudio tamanho={14} />
        {estado.aoVivoId && <span className="pulso" style={{ marginLeft: 'auto' }} />}
      </div>

      {aberto && <div className="casca-veu" onClick={() => setAberto(false)} />}

      <aside className={`casca-menu${aberto ? ' aberto' : ''}`}>
        {/*
          A hierarquia é essa e não a inversa: o Studio é o produto que a pessoa está
          usando, a rádio é o contexto de qual operação ela está operando. Dois logos
          do mesmo tamanho, um sobre o outro, não formam um lockup — formam uma pilha,
          e nenhum dos dois fica dono do lugar.
        */}
        <div className="casca-marca">
          <a href="/hoje" className="casca-studio">
            <MarcaPulso tamanho={26} ritmo={batimento} />
            <AssinaturaStudio tamanho={15} />
          </a>
          <button className="casca-fechar" onClick={() => setAberto(false)} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <div className="casca-emissora">
          <span className="casca-emissora-rotulo">operando</span>
          <Image
            src="/marca/bandfm-logo.webp"
            alt="Band FM"
            width={64}
            height={21}
            style={{ objectFit: 'contain', height: 21, width: 'auto' }}
            priority
          />
        </div>

        <nav className="casca-nav">
          {GRUPOS.map((g, gi) => (
            <div key={gi} className="casca-grupo">
              {g.titulo && <div className="casca-grupo-titulo">{g.titulo}</div>}
              {g.itens.map((i) => {
                const emAlta = ativo(i)
                const noAr = i.dinamico === 'ao-vivo' && estado.aoVivoId
                const badge = i.href === '/chat' && estado.naoLidas > 0 ? estado.naoLidas : null

                if (i.emBreve) {
                  return (
                    <span key={i.href} className="casca-item em-breve" aria-disabled>
                      {i.icone}
                      <span className="casca-item-rotulo">{i.rotulo}</span>
                      <span className="casca-embreve">em breve</span>
                    </span>
                  )
                }

                return (
                  <a key={i.href} href={destino(i)} className={`casca-item${emAlta ? ' ativo' : ''}`}>
                    {i.icone}
                    <span className="casca-item-rotulo">{i.rotulo}</span>
                    {noAr && <span className="pulso" />}
                    {badge && <span className="casca-badge numerico">{badge}</span>}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="casca-rodape">
          {operador && (
            <div className="casca-operador">
              <span className="casca-avatar">{operador.nome.charAt(0).toUpperCase()}</span>
              <span style={{ minWidth: 0 }}>
                <span className="casca-operador-nome">{operador.nome}</span>
                <span className="casca-operador-papel">{(operador.papel ?? '').toLowerCase()}</span>
              </span>
              <button className="casca-sair" onClick={sair} aria-label="Sair" title="Sair">
                <LogOut size={16} />
              </button>
            </div>
          )}
          {/* A assinatura da TechNow mora aqui: presente o dia inteiro, sem disputar
              espaço com a informação que o produtor precisa ler. */}
          <PoweredByTechNow tamanho={12} />
        </div>
      </aside>

      <div className="casca-conteudo">{children}</div>
    </div>
  )
}

/**
 * O cabeçalho de contexto de uma tela.
 *
 * Com o menu carregando a navegação, o topo da página só precisa dizer **onde estamos**.
 * Título e apoio na mesma linha de base, tamanho contido: um nome de programa em corpo
 * 32 gritava numa tela que o produtor lê o turno inteiro.
 */
export function CabecalhoTela({
  etiqueta,
  titulo,
  apoio,
  acoes,
}: {
  etiqueta?: React.ReactNode
  titulo: string
  apoio?: React.ReactNode
  acoes?: React.ReactNode
}) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      paddingBottom: 20, borderBottom: '1px solid var(--borda)', marginBottom: 26,
    }}>
      {etiqueta}
      <h1 style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-.02em' }}>{titulo}</h1>
      {apoio && (
        <span style={{
          color: 'var(--texto-2)', fontSize: 13.5,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {apoio}
        </span>
      )}
      <div style={{ flex: 1 }} />
      {acoes}
    </header>
  )
}
