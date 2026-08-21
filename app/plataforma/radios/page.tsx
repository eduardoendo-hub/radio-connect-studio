'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, Headphones, CalendarDays, X } from 'lucide-react'
import { CascaPlataforma } from '../casca'
import { chamarPlataforma } from '../../../lib/plataforma'

type Radio = {
  id: string
  slug: string
  nome: string
  streamUrl: string | null
  operadores: number
  ouvintes: number
  programas: number
}

export default function Radios() {
  const router = useRouter()
  const [radios, setRadios] = useState<Radio[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)

  async function carregar() {
    try {
      const r = await chamarPlataforma<{ emissoras: Radio[] }>('/emissoras-detalhe')
      setRadios(r.emissoras ?? [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() }, [])

  return (
    <CascaPlataforma titulo="Rádios">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <p style={{ color: 'var(--texto-3)', fontSize: 13, margin: 0 }}>
          Cada rádio tem o próprio aplicativo e a própria base de ouvintes.
        </p>
        <div style={{ flex: 1 }} />
        <button className="btn-vazio" onClick={() => setCriando(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
          <Plus size={14} /> Nova rádio
        </button>
      </div>

      {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}

      <div style={{ display: 'grid', gap: 8 }}>
        {radios.map((r) => (
          <div key={r.id} className="linha" style={{ padding: '13px 16px', cursor: 'pointer' }}
            onClick={() => router.push(`/plataforma/radios/${r.id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: -.2 }}>{r.nome}</div>
                <div className="numerico" style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 2 }}>
                  {r.slug}
                </div>
              </div>
              <Numero icone={<Headphones size={13} />} valor={r.ouvintes} rotulo="ouvintes" />
              <Numero icone={<Users size={13} />} valor={r.operadores} rotulo="no Studio" />
              <Numero icone={<CalendarDays size={13} />} valor={r.programas} rotulo="programas" />
            </div>
          </div>
        ))}
      </div>

      {criando && (
        <NovaRadio
          aoFechar={() => setCriando(false)}
          aoCriar={async () => { setCriando(false); await carregar() }}
        />
      )}
    </CascaPlataforma>
  )
}

function Numero({ icone, valor, rotulo }: { icone: React.ReactNode; valor: number; rotulo: string }) {
  return (
    <div style={{ textAlign: 'right', minWidth: 74 }}>
      <div className="numerico" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5,
        fontSize: 15, fontWeight: 700, lineHeight: 1,
      }}>
        <span style={{ color: 'var(--texto-3)' }}>{icone}</span>
        {valor}
      </div>
      <div style={{ fontSize: 10, color: 'var(--texto-3)', marginTop: 3 }}>{rotulo}</div>
    </div>
  )
}

/**
 * Uma rádio nasce com administrador.
 *
 * Os dois na mesma tela porque são a mesma decisão: emissora sem ninguém que consiga
 * entrar é registro morto, e separar em dois passos garante que um dia alguém vai parar
 * no primeiro.
 */
function NovaRadio({ aoFechar, aoCriar }: { aoFechar: () => void; aoCriar: () => void }) {
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTocado, setSlugTocado] = useState(false)
  const [streamUrl, setStreamUrl] = useState('')
  const [adminNome, setAdminNome] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminSenha, setAdminSenha] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  // O identificador se sugere a partir do nome, mas só até alguém mexer nele. Depois
  // disso o que a pessoa escreveu manda — sugestão que sobrescreve digitação é
  // exatamente o comportamento que faz gente desistir de um formulário.
  function aoDigitarNome(v: string) {
    setNome(v)
    if (!slugTocado) {
      setSlug(v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '').slice(0, 30))
    }
  }

  const valido = nome.trim().length >= 2 && slug.length >= 3
    && adminNome.trim().length >= 2 && adminEmail.includes('@') && adminSenha.length >= 6

  return (
    <div onClick={aoFechar} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,10,10,.72)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="cartao"
        style={{ width: '100%', maxWidth: 470, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Nova rádio</h2>
            <p style={{ fontSize: 12.5, color: 'var(--texto-3)', margin: '5px 0 0' }}>
              Ela nasce com um administrador, que depois cadastra o time dele.
            </p>
          </div>
          <button className="btn-vazio" onClick={aoFechar} style={{ padding: 7 }}><X size={15} /></button>
        </div>

        <label className="rotulo">Nome</label>
        <input className="campo" value={nome} autoFocus
          onChange={(e) => aoDigitarNome(e.target.value)} placeholder="Band FM" />

        <label className="rotulo" style={{ marginTop: 15 }}>Identificador</label>
        <input className="campo numerico" value={slug}
          onChange={(e) => { setSlugTocado(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
          placeholder="bandfm" />
        <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--texto-2)' }}>Não muda depois.</strong> O apelido entra na
          compilação do aplicativo desta rádio — trocar quebraria os aplicativos já
          instalados no celular das pessoas.
        </p>

        <label className="rotulo" style={{ marginTop: 15 }}>Stream (m3u8)</label>
        <input className="campo" value={streamUrl}
          onChange={(e) => setStreamUrl(e.target.value)} placeholder="https://…" />
        <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6 }}>
          Pode ficar em branco agora — a emissora fornece depois.
        </p>

        <div style={{
          marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--borda)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: 'var(--accent)' }}>
            ADMINISTRADOR
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--texto-3)', margin: '5px 0 14px' }}>
            Quem recebe a chave da rádio, e cadastra o resto do time pelo Studio.
          </p>

          <label className="rotulo">Nome</label>
          <input className="campo" value={adminNome} onChange={(e) => setAdminNome(e.target.value)} />

          <label className="rotulo" style={{ marginTop: 14 }}>E-mail</label>
          <input className="campo" value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value.replace(/\s/g, ''))} />

          <label className="rotulo" style={{ marginTop: 14 }}>Senha inicial</label>
          <input className="campo" value={adminSenha}
            onChange={(e) => setAdminSenha(e.target.value)} placeholder="ao menos 6 caracteres" />
          <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6 }}>
            Combine com ela por fora e peça para trocar no primeiro acesso.
          </p>
        </div>

        {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 14 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 9, marginTop: 22 }}>
          <button className="btn" disabled={!valido || salvando}
            style={{ opacity: valido && !salvando ? 1 : .5 }}
            onClick={async () => {
              setSalvando(true); setErro('')
              try {
                await chamarPlataforma('/emissoras', {
                  method: 'POST',
                  body: JSON.stringify({
                    nome: nome.trim(),
                    slug,
                    streamUrl: streamUrl.trim() || undefined,
                    admin: {
                      nome: adminNome.trim(),
                      email: adminEmail.trim().toLowerCase(),
                      senha: adminSenha,
                    },
                  }),
                })
                aoCriar()
              } catch (e) {
                setErro(e instanceof Error ? e.message : 'Não deu para criar agora.')
                setSalvando(false)
              }
            }}>
            {salvando ? 'Criando…' : 'Criar rádio'}
          </button>
          <button className="btn-vazio" onClick={aoFechar} disabled={salvando}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
