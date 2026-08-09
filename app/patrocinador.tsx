'use client'

import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { chamar } from '../lib/api'

export type Campanha = { id: string; nome: string; anunciante: string; logoUrl: string | null }

/**
 * O seletor de patrocinador.
 *
 * Escolhe entre as **campanhas vendidas**, e não um nome digitado à mão. A diferença
 * não é de conforto: campanha é contrato — tem anunciante, período e criativos. Nome
 * solto em texto vira "Soneda", "soneda", "Soneda Farma" e três marcas diferentes no
 * relatório de fim de mês, que é justamente o documento com que a rádio cobra.
 *
 * Aqui a assinatura vira relação de banco, então cada Momento patrocinado é uma linha
 * que se soma na entrega da campanha sem ninguém precisar conciliar nada depois.
 */
export function SeletorPatrocinador({
  valor,
  aoMudar,
  rotulo = 'Este Momento tem patrocinador',
  ajuda = 'A assinatura aparece no app enquanto o Momento estiver no ar.',
}: {
  valor: string | null
  aoMudar: (id: string | null) => void
  rotulo?: string
  ajuda?: string
}) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    chamar<{ campanhas: Campanha[] }>('/studio/campanhas')
      .then((r) => setCampanhas(r.campanhas ?? []))
      .catch(() => setCampanhas([]))
      .finally(() => setCarregando(false))
  }, [])

  // Sem campanha vigente não há o que oferecer. Mostrar um seletor vazio só faria o
  // produtor procurar por uma opção que não existe.
  if (!carregando && campanhas.length === 0) return null

  const ligado = valor !== null
  const escolhida = campanhas.find((c) => c.id === valor)

  return (
    <div style={{ marginTop: 18 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={ligado}
          onChange={(e) => aoMudar(e.target.checked ? (campanhas[0]?.id ?? null) : null)}
          style={{ width: 17, height: 17, accentColor: 'var(--accent)' }}
        />
        <Megaphone size={15} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 14 }}>{rotulo}</span>
      </label>
      <p style={{ fontSize: 11.5, color: 'var(--texto-3)', marginTop: 7, marginLeft: 27, lineHeight: 1.5 }}>
        {ajuda}
      </p>

      {ligado && (
        <div style={{ display: 'grid', gap: 9, marginTop: 10, marginLeft: 27 }}>
          <select className="campo" value={valor ?? ''} onChange={(e) => aoMudar(e.target.value || null)}>
            {campanhas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.anunciante} — {c.nome}
              </option>
            ))}
          </select>
          {/* O logo aparece aqui porque é ele que vai para a tela do ouvinte. Quem
              publica confere a marca, não o nome de um registro.

              Sobre placa branca, igual ao app: metade dos logos é escura e com fundo
              transparente. Sem a placa, o produtor confere um retângulo vazio e publica
              achando que está certo. */}
          {escolhida?.logoUrl && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', borderRadius: 6, padding: '5px 9px', width: 'fit-content',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={escolhida.logoUrl} alt="" style={{ maxHeight: 22, maxWidth: 118, objectFit: 'contain' }} />
            </span>
          )}
        </div>
      )}
    </div>
  )
}
