'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Save, TrendingUp } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar } from '../../lib/api'

type Degrau = {
  rotulo: string
  frase?: string | null
  diasNaSemana?: number | null
  diasNoMes?: number | null
  minutosNaSemana?: number | null
  participacoes?: number | null
  diasDeCasa?: number | null
}

const CAMPOS = [
  { chave: 'diasNaSemana', rotulo: 'Dias na semana', ajuda: 'Em quantos dos últimos 7 apareceu.', max: 7 },
  { chave: 'diasNoMes', rotulo: 'Dias no mês', ajuda: 'Em quantos dos últimos 30 apareceu.', max: 31 },
  { chave: 'minutosNaSemana', rotulo: 'Minutos ouvidos', ajuda: 'Rádio tocando no aplicativo, nos últimos 7 dias.', max: 10080 },
  { chave: 'participacoes', rotulo: 'Participações', ajuda: 'Momentos respondidos no mês mais promoções.', max: 500 },
  { chave: 'diasDeCasa', rotulo: 'Tempo de casa', ajuda: 'Dias desde o cadastro.', max: 3650 },
] as const

/**
 * A régua de engajamento da rádio.
 *
 * **A tela explica a metodologia antes de deixar mexer nela.** Quem abre isto é o dono ou
 * o diretor da emissora, não quem construiu o produto: sem entender o que cada número
 * mede, mudar um limiar é chutar. E chute em régua de engajamento não dá erro — dá um
 * relatório que ninguém sabe interpretar três meses depois.
 */
export default function Audiencia() {
  const [regua, setRegua] = useState<Degrau[]>([])
  const [padrao, setPadrao] = useState<Degrau[]>([])
  const [personalizada, setPersonalizada] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  async function carregar() {
    try {
      const r = await chamar<{ regua: Degrau[]; padrao: Degrau[]; personalizada: boolean }>('/studio/regua')
      setRegua(r.regua)
      setPadrao(r.padrao)
      setPersonalizada(r.personalizada)
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para carregar.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() }, [])

  function mudar(i: number, chave: string, valor: string) {
    setErro(''); setSalvo(false)
    const n = [...regua]
    const numero = valor.trim() === '' ? null : Number(valor)
    n[i] = { ...n[i]!, [chave]: Number.isFinite(numero) ? numero : null }
    setRegua(n)
  }

  return (
    <CascaStudio>
      <main style={{ padding: '22px 26px 40px', maxWidth: 1000 }}>
        <CabecalhoTela
          titulo="Audiência"
          apoio="Como a rádio mede a relação de cada ouvinte com ela."
        />

        <Metodologia />

        {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}

        {!carregando && (
          <>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 10, margin: '30px 0 4px',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Os cinco degraus</h2>
              <span style={{ fontSize: 12, color: 'var(--texto-3)' }}>
                {personalizada ? 'régua desta rádio' : 'usando a régua de fábrica'}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--texto-3)', margin: '0 0 16px', lineHeight: 1.6, maxWidth: 660 }}>
              A pessoa fica no degrau mais alto cujas condições ela cumpre — <strong style={{ color: 'var(--texto-2)' }}>todas
              juntas</strong>. Campo em branco não é condição. Não há pontuação: quem
              cumpre, sobe.
            </p>

            <div style={{ display: 'grid', gap: 9 }}>
              {regua.map((d, i) => (
                <div key={i} className="cartao" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                    <span className="numerico" style={{
                      width: 22, height: 22, borderRadius: 999, fontSize: 11, fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(129,216,208,.13)', color: 'var(--accent)',
                    }}>
                      {i + 1}
                    </span>
                    <input className="campo" value={d.rotulo} style={{ maxWidth: 240, fontWeight: 600 }}
                      onChange={(e) => {
                        setErro(''); setSalvo(false)
                        const n = [...regua]; n[i] = { ...n[i]!, rotulo: e.target.value }; setRegua(n)
                      }} />
                    {i === 0 && (
                      <span style={{ fontSize: 11.5, color: 'var(--texto-3)' }}>
                        onde todo mundo começa — não exige nada
                      </span>
                    )}
                  </div>

                  {/*
                    A frase vem logo abaixo do nome porque é assim que o ouvinte a lê: o
                    nome, e embaixo o que ele quer dizer. "Chega junto" é bonito e não
                    explica nada sozinho — e o Índice depende de a evolução parecer justa,
                    o que exige que ela seja compreendida.
                  */}
                  <div style={{ marginBottom: i === 0 ? 0 : 12, marginLeft: 33 }}>
                    <input className="campo" value={d.frase ?? ''} maxLength={90}
                      placeholder="O que este degrau quer dizer, na voz da rádio"
                      onChange={(e) => {
                        setErro(''); setSalvo(false)
                        const n = [...regua]; n[i] = { ...n[i]!, frase: e.target.value }; setRegua(n)
                      }} />
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 5,
                    }}>
                      <span style={{ fontSize: 10.5, color: 'var(--texto-3)', lineHeight: 1.45 }}>
                        Aparece no aplicativo, embaixo do nome. Fale com a pessoa, não sobre
                        ela — e evite palavra que muda com o gênero: metade do público é
                        mulher.
                      </span>
                      <span className="numerico" style={{
                        fontSize: 10.5, whiteSpace: 'nowrap',
                        color: (d.frase?.length ?? 0) > 62 ? '#E8A33D' : 'var(--texto-3)',
                      }}>
                        {d.frase?.length ?? 0}/62
                      </span>
                    </div>
                  </div>

                  {i > 0 && (
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10,
                    }}>
                      {CAMPOS.map((c) => (
                        <div key={c.chave}>
                          <label style={{
                            fontSize: 10.5, color: 'var(--texto-3)', display: 'block', marginBottom: 4,
                          }}>
                            {c.rotulo}
                          </label>
                          <input className="campo numerico" type="number" min={1} max={c.max}
                            placeholder="—"
                            value={(d as Record<string, unknown>)[c.chave] as number ?? ''}
                            onChange={(e) => mudar(i, c.chave, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {erro && (
              <p style={{ color: '#FF9A95', fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>{erro}</p>
            )}
            {salvo && (
              <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 16 }}>
                Régua salva. Vale a partir da próxima vez que cada ouvinte abrir a tela.
              </p>
            )}

            <div style={{ display: 'flex', gap: 9, marginTop: 22 }}>
              <button className="btn" disabled={salvando}
                style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: salvando ? .5 : 1 }}
                onClick={async () => {
                  setSalvando(true); setErro(''); setSalvo(false)
                  try {
                    await chamar('/studio/regua', {
                      method: 'PUT',
                      body: JSON.stringify({
                        regua: regua.map((d) => ({
                          rotulo: d.rotulo.trim(),
                          frase: d.frase?.trim() || null,
                          ...Object.fromEntries(
                            CAMPOS.map((c) => [c.chave, (d as Record<string, unknown>)[c.chave] || null]),
                          ),
                        })),
                      }),
                    })
                    setSalvo(true)
                    setPersonalizada(true)
                  } catch (e) {
                    setErro(e instanceof Error ? e.message : 'Não deu para salvar.')
                  } finally {
                    setSalvando(false)
                  }
                }}>
                <Save size={14} /> {salvando ? 'Salvando…' : 'Salvar régua'}
              </button>
              <button className="btn-vazio"
                style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                onClick={() => { setRegua(padrao); setErro(''); setSalvo(false) }}>
                <RotateCcw size={14} /> Voltar à régua de fábrica
              </button>
            </div>
          </>
        )}
      </main>
    </CascaStudio>
  )
}

/**
 * O que o produto mede, e o que ele recusa medir.
 *
 * Vem antes dos campos de propósito. A parte que mais importa desta tela não é o
 * formulário — é a frase sobre as horas ouvidas serem só as do aplicativo. É a primeira
 * pergunta que um diretor de rádio faz ao ver o número, e a resposta precisa estar na
 * tela antes dele perguntar.
 */
function Metodologia() {
  return (
    <div className="cartao" style={{ padding: 20, maxWidth: 740 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TrendingUp size={15} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: 14.5, fontWeight: 700, margin: 0 }}>Como o Índice funciona</h2>
      </div>

      <p style={{ fontSize: 13, color: 'var(--texto-2)', lineHeight: 1.65, margin: 0 }}>
        Cada ouvinte fica num de cinco degraus, e o aplicativo mostra o degrau em
        palavra — <em>“Muito conectado”</em>, nunca <em>“82 pontos”</em>. Não há ranking
        entre ouvintes, não há contagem para o próximo degrau e nunca se avisa que a
        conexão caiu.
      </p>

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {[
          ['Presença', 'Dias distintos em que a pessoa usou o aplicativo. Conta o dia, não a visita: quem abre trinta vezes numa terça apareceu numa terça.'],
          ['Minutos ouvidos', 'Rádio tocando dentro do aplicativo. Pausou, caiu o sinal ou está no pré-roll de anúncio: não conta.'],
          ['Participações', 'Momentos respondidos no mês somados às promoções em que entrou.'],
          ['Relacionamento', 'Se já falou com a rádio pelo chat.'],
          ['Tempo de casa', 'Dias desde o cadastro. É o que separa relação de semana intensa.'],
        ].map(([nome, texto]) => (
          <div key={nome} style={{ display: 'flex', gap: 11 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: 'var(--accent)',
              minWidth: 116, paddingTop: 1,
            }}>
              {nome}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--texto-3)', lineHeight: 1.55 }}>{texto}</span>
          </div>
        ))}
      </div>

      {/*
        A ressalva mais importante da tela. É a primeira pergunta que um diretor de rádio
        faz ao ver o número de horas, e a resposta precisa estar ali antes dele perguntar
        — inclusive porque a resposta honesta é boa para nós: o aplicativo mede o que o
        IBOPE não mede, que é quem ouve com nome e telefone.
      */}
      <div style={{
        marginTop: 16, padding: '12px 14px', borderRadius: 10,
        background: 'rgba(232,163,61,.09)', border: '1px solid rgba(232,163,61,.28)',
      }}>
        <p style={{ fontSize: 12.5, color: 'var(--texto-2)', margin: 0, lineHeight: 1.6 }}>
          <strong>As horas são as do aplicativo, não as da rádio.</strong> Quem ouve no
          carro, no rádio da cozinha ou na caixa de som não passa por aqui, e o Índice não
          tem como saber. O que ele mede é a relação com o aplicativo — e essa, ao
          contrário da audiência, vem com nome e telefone.
        </p>
      </div>
    </div>
  )
}
