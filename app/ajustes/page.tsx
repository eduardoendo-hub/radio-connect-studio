'use client'

import { useEffect, useState } from 'react'
import { UserPlus, KeyRound, X, ShieldCheck } from 'lucide-react'
import { CascaStudio, CabecalhoTela } from '../casca'
import { chamar, lerOperador } from '../../lib/api'

type Operador = {
  id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  ultimoLogin: string | null
}

/**
 * O time da rádio, administrado pela rádio.
 *
 * A TechNow cria a emissora e o primeiro administrador; daqui em diante quem entra e
 * quem sai é decisão de quem opera. Fazer cada acesso passar por nós pareceria mais
 * controle e seria menos: um produtor sai numa sexta e o acesso precisa cair na sexta.
 * Quando adicionar gente é burocrático, aparece login compartilhado — e aí ninguém sabe
 * mais quem publicou o quê.
 */
const DESCRICAO: Record<string, string> = {
  ADMIN: 'Vê tudo e administra o time',
  DIRETOR: 'Indicadores, campanhas e time',
  PRODUTOR: 'Opera o dia a dia no ar',
  PROGRAMACAO: 'Grade, programas e locutores',
  LOCUTOR: 'O ao vivo do programa dele',
  MARKETING: 'Campanhas, promoções e avisos',
  ATENDIMENTO: 'Chat e promoções',
  VISUALIZADOR: 'Só leitura',
}

export default function Ajustes() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [papeis, setPapeis] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [novo, setNovo] = useState(false)
  const [editando, setEditando] = useState<Operador | null>(null)
  const [trocandoSenha, setTrocandoSenha] = useState(false)
  const eu = lerOperador()

  async function carregar() {
    try {
      const r = await chamar<{ operadores: Operador[]; papeis: string[] }>('/studio/operadores')
      setOperadores(r.operadores ?? [])
      setPapeis(r.papeis ?? [])
      setErro('')
    } catch (e) {
      // Quem não é ADMIN nem DIRETOR não enxerga o time — e isso não é falha, é o
      // desenho. A tela diz isso em vez de mostrar uma lista vazia que parece defeito.
      setErro(e instanceof Error ? e.message : 'Não deu para carregar.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { void carregar() }, [])

  const souAdmin = eu?.papel === 'ADMIN'

  return (
    <CascaStudio>
      <main style={{ padding: '22px 26px 40px', maxWidth: 1080 }}>
        <CabecalhoTela
          titulo="Ajustes"
          apoio="Quem tem acesso ao Studio desta rádio."
          acoes={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-vazio" onClick={() => setTrocandoSenha(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
                <KeyRound size={14} /> Minha senha
              </button>
              {souAdmin && (
                <button className="btn-vazio" onClick={() => setNovo(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '6px 11px' }}>
                  <UserPlus size={14} /> Novo acesso
                </button>
              )}
            </div>
          }
        />

        {carregando && <p style={{ color: 'var(--texto-3)', fontSize: 14 }}>Carregando…</p>}
        {erro && !carregando && (
          <div className="cartao" style={{ padding: 26, textAlign: 'center' }}>
            <ShieldCheck size={22} style={{ color: 'var(--texto-3)' }} />
            <p style={{ marginTop: 10, fontSize: 14.5, fontWeight: 600 }}>
              Só administradores veem o time
            </p>
            <p style={{ color: 'var(--texto-3)', fontSize: 13, margin: '4px 0 0' }}>
              Você pode trocar a própria senha aqui em cima.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gap: 6 }}>
          {operadores.map((o) => (
            <div key={o.id} className="linha"
              onClick={() => souAdmin && setEditando(o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', opacity: o.ativo ? 1 : .5,
                cursor: souAdmin ? 'pointer' : 'default',
              }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -.1 }}>
                  {o.nome}
                  {o.id === eu?.id && (
                    <span style={{ fontSize: 11, color: 'var(--texto-3)', fontWeight: 400 }}> · você</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 1 }}>{o.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: .6, color: 'var(--texto-2)' }}>
                  {o.papel}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--texto-3)', marginTop: 2 }}>
                  {!o.ativo
                    ? 'sem acesso'
                    : o.ultimoLogin
                      ? `entrou ${new Date(o.ultimoLogin).toLocaleDateString('pt-BR')}`
                      : 'nunca entrou'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(novo || editando) && (
          <EditorAcesso
            operador={editando}
            papeis={papeis}
            souEu={editando?.id === eu?.id}
            aoFechar={() => { setNovo(false); setEditando(null) }}
            aoSalvar={async () => { setNovo(false); setEditando(null); await carregar() }}
          />
        )}
        {trocandoSenha && <MinhaSenha aoFechar={() => setTrocandoSenha(false)} />}
      </main>
    </CascaStudio>
  )
}

function Janela({ children, titulo, apoio, aoFechar }: {
  children: React.ReactNode; titulo: string; apoio?: string; aoFechar: () => void
}) {
  return (
    <div onClick={aoFechar} style={{
      position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(4,10,10,.72)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="cartao"
        style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{titulo}</h2>
            {apoio && <p style={{ fontSize: 12.5, color: 'var(--texto-3)', margin: '5px 0 0' }}>{apoio}</p>}
          </div>
          <button className="btn-vazio" onClick={aoFechar} style={{ padding: 7 }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EditorAcesso({ operador, papeis, souEu, aoFechar, aoSalvar }: {
  operador: Operador | null
  papeis: string[]
  souEu?: boolean
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const editando = operador !== null
  const [nome, setNome] = useState(operador?.nome ?? '')
  const [email, setEmail] = useState(operador?.email ?? '')
  const [papel, setPapel] = useState(operador?.papel ?? 'PRODUTOR')
  const [ativo, setAtivo] = useState(operador?.ativo ?? true)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const valido = nome.trim().length >= 2 && (editando || (email.includes('@') && senha.length >= 6))

  return (
    <Janela
      titulo={editando ? 'Editar acesso' : 'Novo acesso'}
      apoio={editando ? operador!.email : 'A pessoa entra com este e-mail e troca a senha depois.'}
      aoFechar={aoFechar}>
      <label className="rotulo">Nome</label>
      <input className="campo" value={nome} autoFocus onChange={(e) => setNome(e.target.value)} />

      {!editando && (
        <>
          <label className="rotulo" style={{ marginTop: 14 }}>E-mail</label>
          <input className="campo" value={email}
            onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))} />
        </>
      )}

      <label className="rotulo" style={{ marginTop: 14 }}>Papel</label>
      <select className="campo" value={papel} onChange={(e) => setPapel(e.target.value)}>
        {papeis.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 6 }}>
        {DESCRICAO[papel] ?? ''}
      </p>

      <label className="rotulo" style={{ marginTop: 14 }}>
        {editando ? 'Nova senha (opcional)' : 'Senha inicial'}
      </label>
      <input className="campo" value={senha} onChange={(e) => setSenha(e.target.value)}
        placeholder={editando ? 'deixe em branco para manter' : 'ao menos 6 caracteres'} />
      <p style={{ fontSize: 11, color: 'var(--texto-3)', marginTop: 6, lineHeight: 1.5 }}>
        Combine com a pessoa por fora e peça para ela trocar no primeiro acesso.
      </p>

      {/* Desativar a si mesmo é o caminho mais curto para ficar de fora da própria
          rádio, e acontece por engano de clique numa lista. O servidor recusa de
          qualquer forma; aqui o controle nem aparece. */}
      {editando && !souEu && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)}
            style={{ width: 17, height: 17, accentColor: 'var(--accent)' }} />
          <span style={{ fontSize: 13.5 }}>
            {ativo ? 'Tem acesso ao Studio' : 'Sem acesso — não consegue entrar'}
          </span>
        </label>
      )}

      {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 14 }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
        <button className="btn" disabled={!valido || salvando}
          style={{ opacity: valido && !salvando ? 1 : .5 }}
          onClick={async () => {
            setSalvando(true); setErro('')
            try {
              if (editando) {
                await chamar(`/studio/operadores/${operador!.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    nome: nome.trim(),
                    papel,
                    ...(souEu ? {} : { ativo }),
                    ...(senha ? { senha } : {}),
                  }),
                })
              } else {
                await chamar('/studio/operadores', {
                  method: 'POST',
                  body: JSON.stringify({
                    nome: nome.trim(),
                    email: email.trim().toLowerCase(),
                    papel,
                    senha,
                  }),
                })
              }
              aoSalvar()
            } catch (e) {
              setErro(e instanceof Error ? e.message : 'Não deu para salvar.')
              setSalvando(false)
            }
          }}>
          {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar acesso'}
        </button>
        <button className="btn-vazio" onClick={aoFechar} disabled={salvando}>Cancelar</button>
      </div>
    </Janela>
  )
}

function MinhaSenha({ aoFechar }: { aoFechar: () => void }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  return (
    <Janela titulo="Trocar minha senha" aoFechar={aoFechar}
      apoio="Toda conta nasce com uma senha que outra pessoa escolheu.">
      {pronto ? (
        <>
          <p style={{ fontSize: 14, color: 'var(--accent)' }}>Senha trocada.</p>
          <button className="btn" onClick={aoFechar} style={{ marginTop: 16 }}>Fechar</button>
        </>
      ) : (
        <>
          <label className="rotulo">Senha atual</label>
          <input className="campo" type="password" value={atual} autoFocus
            onChange={(e) => setAtual(e.target.value)} />
          <label className="rotulo" style={{ marginTop: 14 }}>Nova senha</label>
          <input className="campo" type="password" value={nova}
            onChange={(e) => setNova(e.target.value)} placeholder="ao menos 8 caracteres" />
          {erro && <p style={{ color: '#FF9A95', fontSize: 12.5, marginTop: 12 }}>{erro}</p>}
          <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
            <button className="btn" disabled={salvando || nova.length < 8}
              style={{ opacity: salvando || nova.length < 8 ? .5 : 1 }}
              onClick={async () => {
                setSalvando(true); setErro('')
                try {
                  await chamar('/studio/senha', {
                    method: 'POST',
                    body: JSON.stringify({ atual, nova }),
                  })
                  setPronto(true)
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Não deu para trocar.')
                } finally {
                  setSalvando(false)
                }
              }}>
              {salvando ? 'Trocando…' : 'Trocar'}
            </button>
            <button className="btn-vazio" onClick={aoFechar}>Cancelar</button>
          </div>
        </>
      )}
    </Janela>
  )
}
