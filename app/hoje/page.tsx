'use client'

import { useEffect, useState } from 'react'
import { chamar, hora, lerOperador, lerToken, sair, type Operador } from '../../lib/api'
import { LogoStudio, LogoRadio, Rodape } from '../marca'

type Edicao = {
  id: string
  inicioEm: string
  fimEm: string
  titulo: string | null
  programa: { id: string; nome: string; corDestaque: string | null }
  locutor: { id: string; nome: string } | null
  _count: { momentos: number }
}

type Hoje = {
  edicoes: Edicao[]
  aoVivoId: string | null
  resumo: { programas: number; momentosAgendados: number; promocoesAtivas: number }
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Pagina() {
  const [dados, setDados] = useState<Hoje | null>(null)
  const [operador, setOperador] = useState<Operador | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!lerToken()) { location.href = '/'; return }
    setOperador(lerOperador())
    chamar<Hoje>('/studio/hoje').then(setDados).catch((e) => setErro(e.message))
  }, [])

  if (erro) return <main className="container" style={{ paddingTop: 40 }}><div className="erro">{erro}</div></main>
  if (!dados) return <main className="container" style={{ paddingTop: 40, color: 'var(--texto-3)' }}>Carregando…</main>

  const aoVivo = dados.edicoes.find((e) => e.id === dados.aoVivoId) ?? null

  return (
    <main className="container" style={{ paddingTop: 22, paddingBottom: 40 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 34 }}>
        <LogoStudio tamanho={26} />
        <span style={{ fontWeight: 500 }}>
          Radio Connect <span style={{ color: 'var(--texto-3)', fontWeight: 400 }}>Studio</span>
        </span>
        <LogoRadio nome="Band FM" />
        <div style={{ flex: 1 }} />
        <span style={{ color: 'var(--texto-2)', fontSize: 13.5 }}>{operador?.nome}</span>
        <button className="btn-vazio" style={{ padding: '7px 13px', fontSize: 13 }} onClick={sair}>Sair</button>
      </header>

      {/*
        O dashboard abre com o TRABALHO do dia, não com gráficos.
        Primeiro o produtor precisa operar; analisar vem depois.
      */}
      <h1 style={{ fontSize: 27, fontWeight: 500, letterSpacing: '-.02em' }}>
        {saudacao()}, {operador?.nome?.split(' ')[0]}.
      </h1>
      <p style={{ color: 'var(--texto-2)', marginTop: 7, fontSize: 15 }}>
        Hoje você tem <strong style={{ color: 'var(--texto)' }}>{dados.resumo.programas} programas</strong>
        {dados.resumo.momentosAgendados > 0 && <>, {dados.resumo.momentosAgendados} Momentos agendados</>}
        {dados.resumo.promocoesAtivas > 0 && <> e {dados.resumo.promocoesAtivas} promoção ativa</>}.
      </p>

      {aoVivo && (
        <a href={`/ao-vivo/${aoVivo.id}`} className="cartao" style={{
          display: 'block', marginTop: 26,
          borderColor: 'rgba(227,39,30,.35)',
          background: 'linear-gradient(180deg, rgba(227,39,30,.06), var(--superficie))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <span className="etiqueta-ao-vivo"><span className="pulso" />NO AR</span>
              <div style={{ fontSize: 22, fontWeight: 500, marginTop: 13, letterSpacing: '-.01em' }}>
                {aoVivo.titulo ?? aoVivo.programa.nome}
              </div>
              <div style={{ color: 'var(--texto-2)', marginTop: 5, fontSize: 14 }}>
                {aoVivo.locutor ? `com ${aoVivo.locutor.nome} · ` : ''}
                {hora(aoVivo.inicioEm)} às {hora(aoVivo.fimEm)}
              </div>
            </div>
            <span className="btn">Entrar na operação</span>
          </div>
        </a>
      )}

      {/* A grade do dia como linha do tempo — é assim que a produção pensa. */}
      <h2 style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--texto-2)', margin: '34px 0 14px' }}>
        Programação de hoje
      </h2>

      <div style={{ display: 'grid', gap: 8 }}>
        {dados.edicoes.map((e) => {
          const noAr = e.id === dados.aoVivoId
          return (
            <a key={e.id} href={`/ao-vivo/${e.id}`} className="cartao" style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
              borderColor: noAr ? 'rgba(227,39,30,.3)' : 'var(--borda)',
            }}>
              <div style={{ width: 3, height: 34, borderRadius: 2, background: e.programa.corDestaque ?? 'var(--borda-forte)' }} />
              <div style={{ width: 52, color: 'var(--texto-2)', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                {hora(e.inicioEm)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{e.titulo ?? e.programa.nome}</div>
                {e.locutor && <div style={{ color: 'var(--texto-3)', fontSize: 13, marginTop: 2 }}>{e.locutor.nome}</div>}
              </div>
              {e._count.momentos > 0 && (
                <span style={{ color: 'var(--texto-2)', fontSize: 13 }}>
                  {e._count.momentos} {e._count.momentos === 1 ? 'Momento' : 'Momentos'}
                </span>
              )}
              {noAr && <span className="pulso" />}
            </a>
          )
        })}
      </div>

      <Rodape />
    </main>
  )
}
