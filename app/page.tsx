'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { chamar, guardarSessao, guardarEmissora, lerToken, armazenamentoVolatil, type Emissora, type Operador } from '../lib/api'
import { MarcaPulso, AssinaturaStudio, PoweredByTechNow } from './marca'

export default function Entrar() {
  const router = useRouter()
  const [emissoras, setEmissoras] = useState<Emissora[]>([])
  const [emissoraEscolhida, setEmissoraEscolhida] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    setCarregando(true)
    try {
      // O espaço que veio junto na colagem não é problema de quem digitou.
      const r = await chamar<{
        token: string
        operador: Operador
        emissora: Emissora
        escolhaEmissora?: boolean
        emissoras?: Emissora[]
      }>('/studio/entrar', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senha: senha.trim(),
          ...(emissoraEscolhida ? { emissoraId: emissoraEscolhida } : {}),
        }),
      })

      // O mesmo e-mail pode operar mais de uma rádio. O servidor não escolhe por
      // ninguém — devolve a lista e a tela pergunta. Escolher sozinho seria colocar
      // alguém para operar o ao vivo da emissora errada.
      if (r.escolhaEmissora && r.emissoras) {
        setEmissoras(r.emissoras)
        setCarregando(false)
        return
      }

      // A emissora entra na sessão antes do token: é ela que vira o `X-Tenant` de todas
      // as chamadas seguintes, e uma chamada sem tenant certo falha em silêncio.
      guardarEmissora(r.emissora)
      guardarSessao(r.token, r.operador)

      // Confere que a sessão realmente ficou guardada ANTES de sair da tela. Sem isso,
      // quando o armazenamento está bloqueado, a pessoa era jogada em /hoje, a página
      // não achava token nenhum e devolvia ela para cá — um pisca-pisca sem mensagem,
      // com a senha certa.
      if (!lerToken()) {
        setErro(
          'Seu navegador está bloqueando o armazenamento do site, então a sessão não ' +
            'se mantém. Saia da navegação privada ou libere os dados de site para ' +
            'studio.radioconnect.technowhub.ai.',
        )
        setCarregando(false)
        return
      }

      if (armazenamentoVolatil) {
        setAviso('A sessão vale só até você recarregar a página.')
      }

      // Navegação do lado do cliente: `location.href` recarrega tudo e apagaria a
      // sessão guardada em memória quando o localStorage não está disponível.
      router.push('/hoje')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.')
      setCarregando(false)
    }
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 2px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Lockup empilhado, como manda o design system para login e splash.
            Ritmo "no ar" aqui de propósito: a marca precisa estar viva antes mesmo de
            alguém entrar — é a primeira coisa que o produtor vê todo dia. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginBottom: 38 }}>
          <MarcaPulso tamanho={68} ritmo="no-ar" />
          <AssinaturaStudio tamanho={25} />
        </div>

        <form onSubmit={entrar} className="cartao" style={{ display: 'grid', gap: 16 }}>
          <div>
            <label className="rotulo" htmlFor="email">E-mail</label>
            <input
              id="email"
              className="campo"
              type="email"
              autoComplete="username"
              value={email}
              // O espaço sai enquanto se digita, não na hora de enviar.
              //
              // Isto não é preciosismo: `type="email"` com `required` faz o navegador
              // barrar o envio ANTES de qualquer JavaScript rodar. Com um espaço
              // colado junto ao endereço, clicar em Entrar simplesmente não fazia
              // nada — nenhuma requisição, nenhuma mensagem, nenhum rastro. Limpar no
              // envio não adiantava porque o envio nunca acontecia.
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
              placeholder="voce@suaradio.com.br"
              required
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="campo"
              type="password"
              autoComplete="current-password"
              value={senha}
              // Espaço nas pontas de senha é sempre resíduo de cópia. No meio pode ser
              // intenção, então só as pontas saem.
              onChange={(e) => setSenha(e.target.value.replace(/^\s+|\s+$/g, ''))}
              required
            />
          </div>

          {/* Só aparece quando o mesmo e-mail opera mais de uma rádio — o que é raro e
              é exatamente por isso que não pode ser um campo permanente pedindo a
              emissora a quem só tem uma. */}
          {emissoras.length > 0 && (
            <div>
              <label className="rotulo" htmlFor="emissora">Qual rádio?</label>
              <select
                id="emissora"
                className="campo"
                value={emissoraEscolhida}
                onChange={(e) => setEmissoraEscolhida(e.target.value)}
              >
                <option value="">Escolha…</option>
                {emissoras.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          )}

          {erro && <div className="erro">{erro}</div>}
          {aviso && (
            <div style={{
              fontSize: 13, color: 'var(--texto-2)', background: 'rgba(129,216,208,.08)',
              border: '1px solid rgba(129,216,208,.25)', borderRadius: 'var(--raio)', padding: '11px 14px',
            }}>{aviso}</div>
          )}

          <button className="btn" disabled={carregando} type="submit">
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
          <PoweredByTechNow tamanho={14} />
        </div>
      </div>
    </main>
  )
}
