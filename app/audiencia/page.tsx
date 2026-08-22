'use client'

import { useEffect, useRef, useState } from 'react'
import { Smartphone, Headphones, Info, Mic, Phone, Lock } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar } from '../../lib/api'

/**
 * Audiência.
 *
 * **Três visões, três perguntas, três pessoas.** *Agora* é para quem está operando no
 * estúdio; *Programas* é para a direção e para a venda; *Evolução* é para a diretoria uma
 * vez por mês. Uma tela só que respondesse as três seria um painel que ninguém abre.
 *
 * Em todas, dois números convivem e nenhum é a versão fraca do outro. **No aplicativo**
 * é quem está dentro do produto, ouvindo por onde quiser — muita gente abre com a rádio
 * tocando no carro e usa a tela para votar e conversar, porque streaming gasta a banda
 * dela. **Ouvindo pelo aplicativo** é escuta digital, que custa banda e entrega minuto
 * contável. Ler só o segundo subestima a base; ler só o primeiro esconde quanto de escuta
 * o digital já carrega sozinho.
 */

type Faixa = {
  inicioEm: string
  programa: string | null
  noApp: number
  ouvindo: number
  minutosOuvidos: number
  plays: number
  momentos: number
  mensagens: number
  participacoes: number
}

type Pessoa = {
  id: string
  nome: string | null
  comoChamar: string | null
  podeSerCitado: boolean
  telefone: string | null
  cidade: string | null
  ouvindo: boolean
  votouHoje: number
  minutosHoje: number
  degrau: string
  nivel: number
  ultima: { escolha: string | null; momento: string; quando: string } | null
  desde: string
}

type Agora = {
  agora: { noApp: number; ouvindo: number }
  noAr: { programa: string; cor: string | null; locutor: string | null; termina: string } | null
  faixaAberta: string
  faixas: Faixa[]
}

type LinhaPrograma = {
  programaId: string | null
  programa: string
  cor: string | null
  mediaNoApp: number
  mediaOuvindo: number
  minutosPorOuvinte: number
  momentos: number
  mensagens: number
  participacoes: number
  plays: number
  faixas: number
}

type Dia = {
  dia: string
  pessoas: number
  picoNoApp: number
  picoOuvindo: number
  momentos: number
  mensagens: number
  participacoes: number
  plays: number
  minutosOuvidos: number
}

const AZUL = '#5AA9E6'
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export default function Audiencia() {
  const [aba, setAba] = useState<'agora' | 'programas' | 'evolucao'>('agora')

  return (
    <CascaStudio>
      <main style={{ padding: '22px 26px 40px', maxWidth: 1180 }}>
        <CabecalhoTela
          titulo="Audiência"
          apoio="Quem está com a rádio agora, e o que cada programa faz com isso."
        />

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {([['agora', 'Agora'], ['programas', 'Programas'], ['evolucao', 'Evolução']] as const)
            .map(([v, r]) => (
              <button key={v} className={aba === v ? 'btn' : 'btn-vazio'}
                style={{ fontSize: 12.5, padding: '6px 13px' }} onClick={() => setAba(v)}>
                {r}
              </button>
            ))}
        </div>

        {aba === 'agora' && <VisaoAgora />}
        {aba === 'programas' && <VisaoProgramas />}
        {aba === 'evolucao' && <VisaoEvolucao />}

        <Rodape />
      </main>
    </CascaStudio>
  )
}

/**
 * O enquadramento, e ele não é decoração.
 *
 * Se a Band abrir esta tela e comparar o número com o IBOPE, decepciona no primeiro dia —
 * e o problema não é o produto, é o rótulo. A frase precisa estar na tela antes de alguém
 * perguntar, porque a resposta honesta é justamente o argumento de venda: a audiência da
 * transmissão é anônima, esta tem nome e telefone.
 */
function Rodape() {
  return (
    <div style={{
      marginTop: 34, padding: '13px 16px', borderRadius: 10,
      background: 'rgba(129,216,208,.06)', border: '1px solid var(--borda)',
      display: 'flex', gap: 11, alignItems: 'flex-start',
    }}>
      <Info size={14} style={{ color: 'var(--texto-3)', marginTop: 2, flex: 'none' }} />
      <p style={{ fontSize: 12, color: 'var(--texto-3)', margin: 0, lineHeight: 1.6 }}>
        Isto é a audiência do <strong style={{ color: 'var(--texto-2)' }}>aplicativo</strong>,
        não a da transmissão. Quem ouve no carro, no rádio da cozinha ou na caixa de som não
        passa por aqui. Em compensação, cada pessoa contada nesta tela tem nome e telefone —
        o que a medição de audiência tradicional nunca deu.
      </p>
    </div>
  )
}

/** Um número grande com o que ele significa embaixo. */
function Numero({ valor, rotulo, cor, apoio }: {
  valor: number | string; rotulo: string; cor?: string; apoio?: string
}) {
  return (
    <div className="cartao" style={{ padding: '18px 20px', flex: 1, minWidth: 150 }}>
      <div className="numerico" style={{
        fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: -1,
        color: cor ?? 'var(--texto-1)',
      }}>
        {valor}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--texto-2)', marginTop: 7, fontWeight: 500 }}>
        {rotulo}
      </div>
      {apoio && (
        <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 3, lineHeight: 1.4 }}>
          {apoio}
        </div>
      )}
    </div>
  )
}

// ── Agora ────────────────────────────────────────────────────

function VisaoAgora() {
  const [d, setD] = useState<Agora | null>(null)
  const [erro, setErro] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function puxar() {
      try {
        setD(await chamar<Agora>('/studio/audiencia/agora?horas=6'))
        setErro('')
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não deu para carregar.')
      }
    }
    void puxar()
    // Trinta segundos: é a tela que fica aberta no estúdio o programa inteiro, e o número
    // que ela mostra muda de minuto em minuto. Mais rápido que isso seria pedir ao
    // servidor para contar gente que ainda não mudou.
    timer.current = setInterval(puxar, 30_000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  if (erro) return <p style={{ color: '#FF9A95', fontSize: 13 }}>{erro}</p>
  if (!d) return <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>

  const pico = Math.max(1, ...d.faixas.map((f) => Math.max(f.noApp, f.ouvindo)))

  return (
    <>
      {d.noAr && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          fontSize: 13, color: 'var(--texto-2)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: 999,
            background: d.noAr.cor ?? 'var(--accent)', display: 'inline-block',
          }} />
          No ar: <strong style={{ color: 'var(--texto-1)' }}>{d.noAr.programa}</strong>
          {d.noAr.locutor && <span style={{ color: 'var(--texto-3)' }}>· {d.noAr.locutor}</span>}
          <span style={{ color: 'var(--texto-3)' }}>até {hora(d.noAr.termina)}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Numero valor={d.agora.noApp} rotulo="no aplicativo agora"
          apoio="ouvindo por onde for" />
        <Numero valor={d.agora.ouvindo} rotulo="ouvindo pelo aplicativo" cor={AZUL}
          apoio="com o áudio tocando aqui" />
        <Numero valor={d.faixas.at(-1)?.momentos ?? 0} rotulo="votos nesta meia hora" />
        <Numero valor={d.faixas.at(-1)?.mensagens ?? 0} rotulo="mensagens nesta meia hora" />
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, margin: '30px 0 4px' }}>
        As últimas seis horas
      </h2>
      <p style={{ fontSize: 12, color: 'var(--texto-3)', margin: '0 0 16px' }}>
        De meia em meia hora. A última barra é a faixa que ainda está correndo.
      </p>

      {d.faixas.length === 0 ? (
        <div className="cartao" style={{ padding: 24, fontSize: 13.5, color: 'var(--texto-3)' }}>
          Ainda não há movimento registrado nestas horas.
        </div>
      ) : (
        <Barras faixas={d.faixas} pico={pico} faixaAberta={d.faixaAberta} />
      )}

      <QuemEstaAi />
    </>
  )
}

/**
 * As pessoas que estão com a rádio agora, para o locutor citar no ar.
 *
 * **É a tela que fecha o círculo do produto.** Quem ouve o próprio nome no rádio não
 * desinstala o aplicativo, e quem ouve o nome de outra pessoa entende na hora que estar
 * ali tem consequência. Nenhum banner faz isso.
 *
 * Por isso a ordem não é alfabética nem por chegada: primeiro quem **autorizou** ser
 * citado e tem como ser chamado, depois quem está mais alto na escada. O locutor está
 * procurando alguém que ele possa citar, saiba chamar e valha a pena mencionar — e a
 * lista já vem nessa ordem para ele não ter que procurar no meio de um programa ao vivo.
 */
function QuemEstaAi() {
  const [d, setD] = useState<{ pessoas: Pessoa[]; total: number } | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const puxar = () =>
      chamar<{ pessoas: Pessoa[]; total: number }>('/studio/audiencia/quem-esta-ai')
        .then(setD)
        .catch(() => setD({ pessoas: [], total: 0 }))
    void puxar()
    timer.current = setInterval(puxar, 30_000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [])

  if (!d || d.pessoas.length === 0) return null

  const citaveis = d.pessoas.filter((p) => p.podeSerCitado && p.comoChamar).length

  return (
    <>
      <h2 style={{
        fontSize: 14, fontWeight: 700, margin: '34px 0 4px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Mic size={14} style={{ color: 'var(--accent)' }} /> Quem está aí agora
      </h2>
      <p style={{ fontSize: 12, color: 'var(--texto-3)', margin: '0 0 16px', maxWidth: 640, lineHeight: 1.6 }}>
        {citaveis > 0
          ? `${citaveis} ${citaveis === 1 ? 'pessoa autorizou' : 'pessoas autorizaram'} a rádio a dizer o nome delas no ar. Elas vêm primeiro.`
          : 'Ninguém aqui autorizou a rádio a dizer o nome no ar ainda — o convite aparece no aplicativo, em Sua Rádio.'}
      </p>

      <div style={{ display: 'grid', gap: 7 }}>
        {d.pessoas.map((p) => <Cartao key={p.id} p={p} />)}
      </div>

      {d.total > d.pessoas.length && (
        <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 12 }}>
          e mais {d.total - d.pessoas.length} pessoas no aplicativo neste momento.
        </p>
      )}
    </>
  )
}

function Cartao({ p }: { p: Pessoa }) {
  const podeCitar = p.podeSerCitado && p.comoChamar
  const desde = new Date(p.desde)
  const meses = Math.floor((Date.now() - desde.getTime()) / (30 * 86_400_000))

  return (
    <div className="linha" style={{
      padding: '12px 15px', display: 'flex', gap: 14, alignItems: 'flex-start',
      opacity: podeCitar ? 1 : .6,
      borderLeft: `3px solid ${podeCitar ? 'var(--accent)' : 'transparent'}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -.2 }}>
            {p.comoChamar ?? 'Sem nome no cadastro'}
          </span>
          {p.cidade && (
            <span style={{ fontSize: 12.5, color: 'var(--texto-3)' }}>de {p.cidade}</span>
          )}
          <span style={{
            fontSize: 10.5, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(129,216,208,.13)', color: 'var(--accent)', fontWeight: 600,
          }}>
            {p.degrau}
          </span>
          {p.ouvindo && (
            <span style={{
              fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4,
              color: AZUL,
            }}>
              <Headphones size={11} /> ouvindo por aqui
            </span>
          )}
        </div>

        {/* O assunto pronto. Sem isto o locutor tem um nome e precisa inventar o resto. */}
        {p.ultima && (
          <div style={{ fontSize: 12.5, color: 'var(--texto-2)', marginTop: 5, lineHeight: 1.45 }}>
            {p.ultima.escolha
              ? <>votou em <strong>{p.ultima.escolha}</strong> · {p.ultima.momento}</>
              : <>participou de <strong>{p.ultima.momento}</strong></>}
            <span style={{ color: 'var(--texto-3)' }}> · {haQuanto(p.ultima.quando)}</span>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 5 }}>
          {p.minutosHoje > 0 && `${p.minutosHoje} min pelo app hoje · `}
          {p.votouHoje > 0 && `${p.votouHoje} ${p.votouHoje === 1 ? 'voto' : 'votos'} hoje · `}
          {meses >= 1 ? `ouvinte há ${meses} ${meses === 1 ? 'mês' : 'meses'}` : 'chegou este mês'}
        </div>
      </div>

      <div style={{ textAlign: 'right', flex: 'none' }}>
        {podeCitar ? (
          <>
            <div className="numerico" style={{
              fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6,
              justifyContent: 'flex-end', color: 'var(--texto-2)',
            }}>
              <Phone size={11} style={{ color: 'var(--texto-3)' }} />
              {p.telefone ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4 }}>
              pode falar no ar
            </div>
          </>
        ) : (
          <div style={{
            fontSize: 10.5, color: 'var(--texto-3)', display: 'flex',
            alignItems: 'center', gap: 5, justifyContent: 'flex-end',
          }} title="Dizer um nome na rádio é publicação, e essa pessoa ainda não autorizou.">
            <Lock size={11} />
            {p.comoChamar ? 'não autorizou' : 'sem cadastro'}
          </div>
        )}
      </div>
    </div>
  )
}

/** "há 4 min" — o tempo que importa para um locutor é o que passou, não a hora. */
function haQuanto(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  return `há ${h}h`
}

/**
 * As faixas, lado a lado.
 *
 * Duas barras por faixa e não uma empilhada: "ouvindo" é subconjunto de "no aplicativo",
 * e empilhar somaria a mesma pessoa duas vezes na altura. Lado a lado, a distância entre
 * as duas barras é a leitura que interessa — quanta gente está aqui sem gastar banda.
 */
function Barras({ faixas, pico, faixaAberta }: {
  faixas: Faixa[]; pico: number; faixaAberta: string
}) {
  return (
    <div className="cartao" style={{ padding: '20px 18px 14px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 11.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--texto-2)' }}>
          <Smartphone size={12} style={{ color: 'var(--accent)' }} /> no aplicativo
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--texto-2)' }}>
          <Headphones size={12} style={{ color: AZUL }} /> ouvindo por aqui
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, minWidth: 520, height: 170 }}>
        {faixas.map((f) => {
          const aberta = f.inicioEm === faixaAberta
          return (
            <div key={f.inicioEm} style={{ flex: 1, minWidth: 26, textAlign: 'center' }}
              title={`${hora(f.inicioEm)} · ${f.programa ?? 'fora da grade'}
${f.noApp} no aplicativo · ${f.ouvindo} ouvindo por aqui
${f.momentos} votos · ${f.mensagens} mensagens · ${f.participacoes} promoções`}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                gap: 2, height: 128, opacity: aberta ? .55 : 1,
              }}>
                <div style={{
                  width: '42%', maxWidth: 15,
                  height: `${Math.max(2, (f.noApp / pico) * 100)}%`,
                  background: 'var(--accent)', borderRadius: '2px 2px 0 0',
                }} />
                <div style={{
                  width: '42%', maxWidth: 15,
                  height: `${Math.max(2, (f.ouvindo / pico) * 100)}%`,
                  background: AZUL, borderRadius: '2px 2px 0 0',
                }} />
              </div>
              <div className="numerico" style={{
                fontSize: 9.5, color: 'var(--texto-3)', marginTop: 7,
                whiteSpace: 'nowrap',
              }}>
                {hora(f.inicioEm)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Programas ────────────────────────────────────────────────

function VisaoProgramas() {
  const [dias, setDias] = useState(7)
  const [linhas, setLinhas] = useState<LinhaPrograma[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setLinhas(null)
    chamar<{ programas: LinhaPrograma[] }>(`/studio/audiencia/programas?dias=${dias}`)
      .then((r) => { setLinhas(r.programas ?? []); setErro('') })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Não deu para carregar.'))
  }, [dias])

  const pico = Math.max(1, ...(linhas ?? []).map((l) => l.mediaNoApp))

  return (
    <>
      <Periodo dias={dias} aoMudar={setDias} />

      <p style={{ fontSize: 12.5, color: 'var(--texto-3)', margin: '0 0 16px', maxWidth: 640, lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--texto-2)' }}>Média por meia hora</strong>, e não
        soma: um programa de três horas somaria a mesma pessoa seis vezes e ganharia
        sempre. Assim dá para comparar A Hora do Ronco com Band ao Vivo, que dura vinte e
        cinco minutos.
      </p>

      {erro && <p style={{ color: '#FF9A95', fontSize: 13 }}>{erro}</p>}
      {!linhas && !erro && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}

      {linhas?.length === 0 && (
        <div className="cartao" style={{ padding: 24, fontSize: 13.5, color: 'var(--texto-3)' }}>
          Ainda não há audiência registrada neste período.
        </div>
      )}

      {linhas && linhas.length > 0 && (
        <div className="cartao" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Programa', 'No aplicativo', 'Ouvindo aqui', 'Min/ouvinte', 'Votos', 'Mensagens', 'Promoções']
                  .map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 0 ? 'left' : 'right',
                      padding: '13px 14px', fontSize: 10.5, fontWeight: 600,
                      letterSpacing: '.09em', textTransform: 'uppercase',
                      color: 'var(--texto-3)', borderBottom: '1px solid var(--borda-forte)',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.programaId ?? 'nenhum'}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--borda)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <span style={{
                        width: 3, height: 22, borderRadius: 2, flex: 'none',
                        background: l.cor ?? 'var(--borda-forte)',
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.programa}</div>
                        {/* A barra fica sob o nome: é a comparação que a pessoa faz de
                            relance, antes de ler qualquer número da tabela. */}
                        <div style={{
                          height: 3, marginTop: 5, borderRadius: 2,
                          width: `${Math.max(4, (l.mediaNoApp / pico) * 100)}%`,
                          background: l.cor ?? 'var(--accent)', opacity: .55,
                        }} />
                      </div>
                    </div>
                  </td>
                  <Celula valor={l.mediaNoApp} forte />
                  <Celula valor={l.mediaOuvindo} cor={AZUL} />
                  <Celula valor={l.minutosPorOuvinte} sufixo="min" />
                  <Celula valor={l.momentos} />
                  <Celula valor={l.mensagens} />
                  <Celula valor={l.participacoes} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Celula({ valor, cor, forte, sufixo }: {
  valor: number; cor?: string; forte?: boolean; sufixo?: string
}) {
  return (
    <td className="numerico" style={{
      padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--borda)',
      fontWeight: forte ? 700 : 400,
      color: valor === 0 ? 'var(--texto-3)' : cor ?? 'var(--texto-1)',
    }}>
      {valor}{sufixo && <span style={{ fontSize: 10.5, color: 'var(--texto-3)' }}> {sufixo}</span>}
    </td>
  )
}

// ── Evolução ─────────────────────────────────────────────────

function VisaoEvolucao() {
  const [dias, setDias] = useState(30)
  const [linhas, setLinhas] = useState<Dia[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setLinhas(null)
    chamar<{ evolucao: Dia[] }>(`/studio/audiencia/evolucao?dias=${dias}`)
      .then((r) => { setLinhas(r.evolucao ?? []); setErro('') })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Não deu para carregar.'))
  }, [dias])

  const pico = Math.max(1, ...(linhas ?? []).map((l) => l.pessoas))
  const comMovimento = (linhas ?? []).filter((l) => l.pessoas > 0)

  return (
    <>
      <Periodo dias={dias} aoMudar={setDias} opcoes={[7, 30, 60, 90]} />

      {erro && <p style={{ color: '#FF9A95', fontSize: 13 }}>{erro}</p>}
      {!linhas && !erro && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}

      {linhas && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
            <Numero valor={comMovimento.at(-1)?.pessoas ?? 0} rotulo="pessoas hoje"
              apoio="distintas, no dia inteiro" />
            <Numero valor={Math.max(0, ...linhas.map((l) => l.picoOuvindo))} cor={AZUL}
              rotulo="pico ouvindo por aqui" apoio={`nos últimos ${dias} dias`} />
            <Numero valor={linhas.reduce((s, l) => s + l.momentos, 0)} rotulo="votos no período" />
            <Numero
              valor={Math.round(linhas.reduce((s, l) => s + l.minutosOuvidos, 0) / 60)}
              rotulo="horas ouvidas por aqui" apoio="somadas no período" />
          </div>

          {comMovimento.length === 0 ? (
            <div className="cartao" style={{ padding: 24, fontSize: 13.5, color: 'var(--texto-3)' }}>
              A medição começou em 22 de agosto de 2026. Os dias anteriores aparecem
              zerados porque não foram medidos — e não porque não houve ninguém.
            </div>
          ) : (
            <div className="cartao" style={{ padding: '20px 18px 14px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, minWidth: 520, height: 150 }}>
                {linhas.map((l) => (
                  <div key={l.dia} style={{ flex: 1, minWidth: 8, textAlign: 'center' }}
                    title={`${l.dia}
${l.pessoas} pessoas · pico de ${l.picoOuvindo} ouvindo por aqui
${l.momentos} votos · ${l.mensagens} mensagens`}>
                    <div style={{
                      height: `${Math.max(2, (l.pessoas / pico) * 100)}%`,
                      background: l.pessoas ? 'var(--accent)' : 'var(--borda)',
                      borderRadius: '2px 2px 0 0',
                    }} />
                  </div>
                ))}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: 'var(--texto-3)', marginTop: 9, minWidth: 520,
              }}>
                <span className="numerico">{linhas[0]?.dia}</span>
                <span className="numerico">{linhas.at(-1)?.dia}</span>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function Periodo({ dias, aoMudar, opcoes = [1, 7, 30, 60] }: {
  dias: number; aoMudar: (d: number) => void; opcoes?: number[]
}) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
      {opcoes.map((d) => (
        <button key={d} onClick={() => aoMudar(d)}
          style={{
            padding: '5px 12px', borderRadius: 999, fontSize: 12,
            border: `1px solid ${dias === d ? 'var(--accent)' : 'var(--borda-forte)'}`,
            background: dias === d ? 'rgba(129,216,208,.13)' : 'transparent',
            color: dias === d ? 'var(--accent)' : 'var(--texto-2)',
          }}>
          {d === 1 ? 'hoje' : `${d} dias`}
        </button>
      ))}
    </div>
  )
}
